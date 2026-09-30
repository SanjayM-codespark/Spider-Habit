import CustomText from '../components/CustomText';
import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import RazorpayCheckout from 'react-native-razorpay';
import { ScreenContainer } from '../components/ScreenContainer';
import { TopHeader } from '../components/TopHeader';
import { useAlert } from '../context/AlertContext';
import {
  subscriptionService,
  Subscription,
  SubscriptionPrice,
  CurrentSubscriptionData,
} from '../services/subscriptionService';
import { useCountry } from '../context/CountryContext';
import { useFreeTrial } from '../context/FreeTrialContext';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/apiEndpoints';
import { apiCall } from '../services/apiClient';
import { habitService } from '../services/habitService';
import { logger } from '../utils/logger';

const TAG = 'SubscriptionScreen';

interface Props {
  navigation: any;
}

// Prefer the detected country pricing, fall back to US default,
// then to the first configured country
const getDisplayPrice = (
  subscription: Subscription,
  countryCode: string,
): SubscriptionPrice | null => {
  const price =
    subscription.pricing.find(p => p.country === countryCode) ||
    subscription.pricing.find(p => p.country === 'US') ||
    subscription.pricing[0];
  return price ?? null;
};

const formatAmount = (amount: number | string) => {
  const value = Number(amount);
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
};

const formatPrice = (price: SubscriptionPrice) =>
  `${price.currency} ${formatAmount(price.amount)}`;

export const SubscriptionScreen: React.FC<Props> = ({ navigation }) => {
  const [plans, setPlans] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentSub, setCurrentSub] = useState<CurrentSubscriptionData | null>(
    null,
  );
  const [loadingCurrent, setLoadingCurrent] = useState(false);
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const { showAlert } = useAlert();
  const { countryCode, detecting: detectingCountry } = useCountry();
  const { markSubscribed } = useFreeTrial();
  const { user } = useAuth();

  const loadPlans = useCallback(async () => {
    logger.debug(TAG, 'loadPlans() → fetching subscription plans');
    try {
      const loaded = await subscriptionService.getActiveSubscriptions(countryCode);
      setPlans(loaded);
      setError(null);
      setSelectedPlanId(prev => prev ?? loaded[0]?.id ?? null);
    } catch (err: any) {
      logger.error(TAG, 'loadPlans() failed', err);
      setError(err?.message || 'Failed to load subscription plans.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [countryCode]);

  const loadCurrent = useCallback(async () => {
    if (!user?.isSubscribed || !user?.email) {
      setCurrentSub(null);
      return;
    }
    logger.debug(TAG, `loadCurrent() → fetching subscription for ${user.email}`);
    setLoadingCurrent(true);
    try {
      const data = await subscriptionService.getCurrentSubscription(user.email);
      setCurrentSub(data);
    } catch (err: any) {
      logger.error(TAG, 'loadCurrent() failed', err);
      setCurrentSub(null);
    } finally {
      setLoadingCurrent(false);
    }
  }, [user?.isSubscribed, user?.email]);

  useFocusEffect(
    useCallback(() => {
      // Country detection resolves after the splash has already gone, so hold
      // off on pricing until it settles — otherwise we'd briefly show the
      // default country's packages and then swap them. Note `detectingCountry`
      // is a dependency so this re-runs the moment detection finishes, even
      // when the detected country equals the default.
      if (!detectingCountry) {
        loadPlans();
      }
      loadCurrent();
    }, [loadPlans, loadCurrent, detectingCountry]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    if (detectingCountry) {
      // No plans are loaded while detection is in flight, and loadPlans() is
      // what normally clears the refresh spinner, so clear it here instead.
      await loadCurrent();
      setRefreshing(false);
      return;
    }
    await Promise.all([loadPlans(), loadCurrent()]);
  };

  const subscribed = !!user?.isSubscribed;
  const showDetails = subscribed && !showPlanSelector;

  const currentPlan = currentSub?.subscription ?? null;
  const currentPrice = currentPlan
    ? getDisplayPrice(currentPlan, countryCode)
    : null;

  const subscribedSince = currentSub?.user?.created_at
    ? new Date(currentSub.user.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  const selectedPlan =
    plans.find(p => p.id === selectedPlanId) ?? plans[0] ?? null;
  const selectedPrice = selectedPlan ? getDisplayPrice(selectedPlan, countryCode) : null;

  const handleSubscribe = async () => {
    if (!selectedPlan || !selectedPrice) {
      showAlert(
        'No Plan Selected',
        'Please select subscription package to continue.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!user?.id) {
      showAlert(
        'Login Required',
        'Please log in before upgrading.',
        [{ text: 'OK' }]
      );
      return;
    }

    setSubmitting(true);

    try {
      // Step 1 — create a Razorpay order on the backend. This validates the
      // plan against the real subscription price and returns an order id plus
      // the public Key ID needed to open the on-device checkout.
      const order = await apiCall<{
        success: boolean;
        data?: {
          orderId: string;
          amountInSmallest: number;
          currency: string;
          keyId: string;
          subscriptionId: number;
          planName: string;
        };
      }>(API_ENDPOINTS.subscriptions.createOrder(), {
        name: 'subscriptions.createOrder',
        method: 'POST',
        params: { subscriptionId: selectedPlan.id, plan: selectedPlan.name },
        body: {
          subscriptionId: selectedPlan.id,
          country: countryCode,
          currency: selectedPrice.currency,
          amount: Number(selectedPrice.amount),
        },
      });

      if (!order?.success || !order?.data?.orderId || !order?.data?.keyId) {
        throw new Error('Failed to create payment order. Please try again.');
      }

      // Step 2 — open the Razorpay payment screen (UPI / cards / netbanking /
      // wallets). Resolves with the payment details when the user pays,
      // rejects when the user cancels or the payment fails.
      let paymentResult: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      };

      try {
        paymentResult = await RazorpayCheckout.open({
          key: order.data.keyId,
          amount: order.data.amountInSmallest, // always in the smallest unit (paise/cents)
          currency: order.data.currency,
          name: 'Spider Habit',
          description: `Subscription · ${order.data.planName}`,
          order_id: order.data.orderId,
          prefill: {
            name: user.name,
            email: user.email,
            contact: user.phone.replace(/\D/g, '').slice(-10),
          },
          theme: { color: '#0D9488' },
        });
      } catch (checkoutError: any) {
        logger.info(TAG, 'Checkout dismissed or failed', checkoutError);
        showAlert(
          'Payment Cancelled',
          checkoutError?.description ||
            checkoutError?.message ||
            'Payment was not completed. Please try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Step 3 — verify the payment signature with the backend. The signature
      // can only be reproduced using the Razorpay key secret, so a match here
      // proves the payment actually succeeded before we unlock the plan.
      const verification = await apiCall<{
        success: boolean;
        message?: string;
      }>(API_ENDPOINTS.subscriptions.verifyPayment(), {
        name: 'subscriptions.verifyPayment',
        method: 'POST',
        params: { orderId: paymentResult.razorpay_order_id },
        body: {
          razorpayOrderId: paymentResult.razorpay_order_id,
          razorpayPaymentId: paymentResult.razorpay_payment_id,
          razorpaySignature: paymentResult.razorpay_signature,
          email: user.email,
          subscriptionId: selectedPlan.id,
          amount: Number(selectedPrice.amount),
          currency: selectedPrice.currency,
        },
      });

      if (!verification?.success) {
        throw new Error(
          verification?.message || 'Payment could not be verified.'
        );
      }

      // Step 4 — only AFTER a verified payment, pass the user details (name,
      // email, phone, password) to the register API so they are saved in the
      // backend database (existing accounts are upserted with the new plan).
      await apiCall(API_ENDPOINTS.users.register(), {
        name: 'users.register',
        method: 'POST',
        params: { name: user.name, email: user.email, phone: user.phone },
        body: {
          name: user.name,
          email: user.email,
          phone: user.phone,
          password: user.password,
          subscriptionId: selectedPlan.id,
          clientUserId: user.id,
        },
      });

      // Locally mark the user as subscribed (stops free-trial deletion).
      await markSubscribed();

      // Push any habits that were only stored locally into the backend DB
      // so the Dashboard (which now reads from the backend) still shows them.
      await habitService.migrateLocalToBackend(user);

      showAlert(
        'Subscription Success 🎉',
        `Thank you for subscribing to "${selectedPlan.name}" (${selectedPlan.duration}) for ${formatPrice(
          selectedPrice
        )}! Your payment is verified and premium features are now unlocked.`,
        [{ text: 'Great!', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      logger.error(TAG, 'handleSubscribe() failed', err?.message ?? err);
      showAlert(
        'Subscription Failed',
        err?.message || 'Something went wrong. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Split description into feature lines
  const getFeatureLines = (description: string) =>
    description
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

  return (
    <ScreenContainer backgroundColor="#39C4B6" barStyle="light-content">
      <TopHeader
        title={showDetails ? 'MY SUBSCRIPTION' : 'SUBSCRIPTION PACKAGES'}
        onBack={() => navigation.goBack()}
      />

      {/* Main White Sheet */}
      <View style={styles.mainSheet}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.scrollContent}
        >
          {showDetails ? (
            /* ===== Subscribed user → show their current plan ===== */
            loadingCurrent && !currentSub ? (
              <View style={styles.stateContainer}>
                <ActivityIndicator size="large" color="#0D9488" />
                <CustomText style={styles.stateText}>
                  Loading your subscription...
                </CustomText>
              </View>
            ) : currentPlan ? (
              <>
                {/* Status + Plan Card */}
                <View style={styles.planCard}>
                  <View style={styles.badgeRow}>
                    <CustomText style={styles.activeBadge}>
                      ✓ ACTIVE MEMBER
                    </CustomText>
                  </View>

                  <View style={styles.planHeaderRow}>
                    <View style={styles.planInfo}>
                      <CustomText style={styles.planName}>
                        {currentPlan.name}
                      </CustomText>
                      <CustomText style={styles.planSubtext}>
                        {currentPlan.duration} plan
                      </CustomText>
                    </View>
                    {currentPrice && (
                      <CustomText style={styles.planPrice}>
                        {formatPrice(currentPrice)}
                      </CustomText>
                    )}
                  </View>

                  {currentPlan.description ? (
                    <View style={styles.featureList}>
                      {getFeatureLines(currentPlan.description).map(
                        (line, idx) => (
                          <CustomText key={idx} style={styles.featureItem}>
                            ✓ {line}
                          </CustomText>
                        ),
                      )}
                    </View>
                  ) : null}
                </View>

                {/* Account info card */}
                <View style={styles.infoCard}>
                  <CustomText style={styles.infoRow}>
                    <CustomText style={styles.infoLabel}>Email:{'  '}</CustomText>
                    <CustomText style={styles.infoValue}>
                      {currentSub?.user?.email ?? '—'}
                    </CustomText>
                  </CustomText>
                  <CustomText style={styles.infoRow}>
                    <CustomText style={styles.infoLabel}>
                      Member since:{'  '}
                    </CustomText>
                    <CustomText style={styles.infoValue}>
                      {subscribedSince}
                    </CustomText>
                  </CustomText>
                  <CustomText style={styles.infoRow}>
                    <CustomText style={styles.infoLabel}>Status:{'  '}</CustomText>
                    <CustomText style={styles.infoValueActive}>
                      Active
                    </CustomText>
                  </CustomText>
                </View>

                {/* Manage plan */}
                <TouchableOpacity
                  style={styles.manageButton}
                  activeOpacity={0.85}
                  onPress={() => setShowPlanSelector(true)}
                >
                  <CustomText style={styles.manageButtonText}>
                    MANAGE / CHANGE PLAN
                  </CustomText>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.stateContainer}>
                <CustomText style={styles.stateEmoji}>⚠️</CustomText>
                <CustomText style={styles.stateTitle}>
                  Could Not Load Subscription
                </CustomText>
                <CustomText style={styles.stateText}>
                  We couldn't fetch your subscription details. Pull to refresh
                  or check back soon.
                </CustomText>
                <TouchableOpacity
                  style={styles.retryButton}
                  activeOpacity={0.85}
                  onPress={() => {
                    setError(null);
                    loadCurrent();
                  }}
                >
                  <CustomText style={styles.retryButtonText}>TRY AGAIN</CustomText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  activeOpacity={0.85}
                  onPress={() => setShowPlanSelector(true)}
                >
                  <CustomText style={styles.secondaryButtonText}>
                    BROWSE PLANS
                  </CustomText>
                </TouchableOpacity>
              </View>
            )
          ) : (
            /* ===== Free user (or browsing plans) → plan selection ===== */
            <>
          {/* Hero Banner */}
          <View style={styles.heroCard}>
            <CustomText style={styles.heroCrown}>👑</CustomText>
            <CustomText style={styles.heroTitle}>Unlock Premium Habits</CustomText>
            <CustomText style={styles.heroSubtitle}>
              Get unlimited habit tracking, detailed monthly reports, and cloud backup.
            </CustomText>
          </View>

          {/* Plan Selector Cards */}
          <CustomText style={styles.sectionTitle}>CHOOSE YOUR PLAN</CustomText>

          {loading ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="large" color="#0D9488" />
              <CustomText style={styles.stateText}>Loading plans...</CustomText>
            </View>
          ) : error ? (
            <View style={styles.stateContainer}>
              <CustomText style={styles.stateEmoji}>⚠️</CustomText>
              <CustomText style={styles.stateTitle}>Unable to Load Plans</CustomText>
              <CustomText style={styles.stateText}>{error}</CustomText>
              <TouchableOpacity
                style={styles.retryButton}
                activeOpacity={0.85}
                onPress={loadPlans}
              >
                <CustomText style={styles.retryButtonText}>TRY AGAIN</CustomText>
              </TouchableOpacity>
            </View>
          ) : plans.length === 0 ? (
            <View style={styles.stateContainer}>
              <CustomText style={styles.stateTitle}>No Plans Available</CustomText>
              <CustomText style={styles.stateText}>
                Subscription packages will appear here once published.
              </CustomText>
            </View>
          ) : (
            plans.map((plan, index) => {
              const isSelected = plan.id === selectedPlanId;
              const price = getDisplayPrice(plan, countryCode);

              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planCard,
                    isSelected && styles.planCardSelected,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => setSelectedPlanId(plan.id)}
                >
                  <View style={styles.badgeRow}>
                    <CustomText style={styles.recommendedBadge}>
                      {index === 0 ? 'RECOMMENDED • BEST VALUE' : plan.platform?.toUpperCase() || 'PRO PLAN'}
                    </CustomText>
                    {isSelected && (
                      <View style={styles.checkCircle}>
                        <CustomText style={styles.checkText}>✓</CustomText>
                      </View>
                    )}
                  </View>

                  <View style={styles.planHeaderRow}>
                    <View style={styles.planInfo}>
                      <CustomText style={styles.planName}>{plan.name}</CustomText>
                      <CustomText style={styles.planSubtext}>
                        {plan.duration} plan
                      </CustomText>
                    </View>
                    {price && (
                      <CustomText style={styles.planPrice}>
                        {formatPrice(price)}
                      </CustomText>
                    )}
                  </View>

                  {plan.description ? (
                    <View style={styles.featureList}>
                      {getFeatureLines(plan.description).map((line, idx) => (
                        <CustomText key={idx} style={styles.featureItem}>
                          ✓ {line}
                        </CustomText>
                      ))}
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })
          )}

          {/* Current Plan Reference Card */}
          <View style={styles.freeCard}>
            <View style={styles.planHeaderRow}>
              <View>
                <CustomText
                  style={
                    subscribed
                      ? styles.currentPlanName
                      : styles.freePlanName
                  }
                >
                  {subscribed
                    ? currentPlan?.name ?? 'Pro Plan'
                    : 'Free Basic'}
                </CustomText>
                <CustomText style={styles.freePlanSubtext}>
                  {subscribed
                    ? currentPlan?.duration
                      ? `${currentPlan.duration} plan`
                      : 'Unlimited habit tracking'
                    : 'Limited to 5 active habits'}
                </CustomText>
              </View>
              <CustomText style={styles.freeBadgeText}>CURRENT PLAN</CustomText>
            </View>
          </View>

          {/* Action Upgrade Button */}
          <TouchableOpacity
            style={styles.subscribeButton}
            activeOpacity={0.8}
            onPress={handleSubscribe}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <CustomText style={styles.subscribeButtonText}>
                {subscribed
                  ? 'UPGRADE PLAN'
                  : `UPGRADE NOW — ${selectedPrice ? formatPrice(selectedPrice) : 'SELECT A PLAN'}`}
              </CustomText>
            )}
          </TouchableOpacity>

          {/* Subscribed users browsing plans can return to their details */}
          {subscribed && (
            <TouchableOpacity
              style={styles.backToDetailsButton}
              activeOpacity={0.85}
              onPress={() => setShowPlanSelector(false)}
            >
              <CustomText style={styles.backToDetailsText}>
                ← BACK TO MY SUBSCRIPTION
              </CustomText>
            </TouchableOpacity>
          )}
            </>
          )}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
};

export default SubscriptionScreen;

const styles = StyleSheet.create({
  mainSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#F0FDFA',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#99F6E4',
    marginBottom: 20,
  },
  heroCrown: {
    fontSize: 36,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  planCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  planCardSelected: {
    backgroundColor: '#E6F4F1',
    borderColor: '#0D9488',
  },
  activeBadge: {
    backgroundColor: '#0D9488',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    gap: 10,
  },
  infoRow: {
    fontSize: 14,
    color: '#0F172A',
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  infoValueActive: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0D9488',
  },
  manageButton: {
    backgroundColor: '#0D9488',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  manageButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  secondaryButton: {
    marginTop: 12,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  secondaryButtonText: {
    color: '#0D9488',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  backToDetailsButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  backToDetailsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D9488',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendedBadge: {
    backgroundColor: '#F97316',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  planInfo: {
    flex: 1,
    marginRight: 8,
  },
  planName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  planSubtext: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0D9488',
    marginTop: 2,
  },
  featureList: {
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(13, 148, 136, 0.15)',
    paddingTop: 10,
  },
  featureItem: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  freeCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  freePlanName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
  },
  currentPlanName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0D9488',
  },
  freePlanSubtext: {
    fontSize: 12,
    color: '#94A3B8',
  },
  freeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  subscribeButton: {
    backgroundColor: '#0D9488',
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  stateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  stateEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  stateText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#0D9488',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 22,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});