import CustomText from '../components/CustomText';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenContainer } from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { useFreeTrial } from '../context/FreeTrialContext';
import { habitService } from '../services/habitService';
import { Habit } from '../database/sqliteSchema';
import { HabitIconBadge } from '../components/HabitIcons';
import { TopHeader } from '../components/TopHeader';
import { logger } from '../utils/logger';
import { notificationService } from '../services/notificationService';
import Ionicons from 'react-native-vector-icons/Ionicons';

const TAG = 'DashboardScreen';

interface Props {
  navigation: any;
}

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { isExpired } = useFreeTrial();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Initialize notification system on mount
  useEffect(() => {
    notificationService.initialize();
    notificationService.requestPermission();
  }, []);

  // Today's actual date string YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Currently selected date string YYYY-MM-DD (defaults to Today)
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  const loadHabits = async () => {
    if (!user?.id) {
      logger.warn(TAG, 'loadHabits() skipped — no user session');
      return;
    }
    logger.info(TAG, `loadHabits() → fetching habits for userId: ${user.id}`);
    const loaded = await habitService.getHabits(user);
    logger.info(TAG, `loadHabits() → ${loaded.length} habits loaded`, {
      date: selectedDateStr,
    });
    setHabits(loaded);

    // Re-schedule all notifications after loading habits
    notificationService.scheduleAllReminders(loaded);
  };

  useFocusEffect(
    useCallback(() => {
      logger.debug(TAG, 'Screen focused — triggering loadHabits()');
      loadHabits();
    }, [user?.id]),
  );

  // When the free trial expires, all habits are wiped from storage while the
  // user is still on this screen — reload so the deleted habits disappear.
  useEffect(() => {
    if (isExpired && user?.id) {
      logger.info(TAG, 'Free trial expired — reloading habits grid');
      loadHabits();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpired, user?.id]);

  const onRefresh = async () => {
    logger.info(TAG, 'Pull-to-refresh triggered');
    setRefreshing(true);
    await loadHabits();
    setRefreshing(false);
    logger.debug(TAG, 'Pull-to-refresh complete');
  };

  // Toggle habit completion for the selected date (supports backdating past dates!)
  const handleToggleHabit = async (habitId: string) => {
    if (!user?.id) {
      logger.warn(TAG, 'handleToggleHabit() aborted — no user session');
      return;
    }
    logger.info(
      TAG,
      `handleToggleHabit() → habitId: ${habitId}, date: ${selectedDateStr}`,
    );
    const updated = await habitService.toggleHabitCompletion(
      user,
      habitId,
      selectedDateStr,
    );
    const toggled = updated.find(h => h.id === habitId);
    logger.info(TAG, `Habit toggled`, {
      title: toggled?.title,
      completed: toggled?.completedDates.includes(selectedDateStr),
      streak: toggled?.streak,
    });
    setHabits(updated);
  };

  // Calculate dynamic statistics for the selected date
  const totalHabits = habits.length;
  const completedSelectedCount = habits.filter(h =>
    h.completedDates.includes(selectedDateStr),
  ).length;
  const completionPercentage =
    totalHabits > 0
      ? Math.round((completedSelectedCount / totalHabits) * 100)
      : 0;

  // Format header title for selected date e.g., "MONDAY, OCT 26, 2026"
  const selectedDateObj = new Date(selectedDateStr + 'T00:00:00');
  const formattedHeaderDate = selectedDateObj
    .toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    .toUpperCase();

  // Generate 7-day week strip (Mon - Sun of current week)
  const weekDaysStrip = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sun, 1 is Mon, etc.
    const distToMon = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(today);
    monday.setDate(today.getDate() + distToMon);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dStr = d.toISOString().split('T')[0];
      const dayLabel = d
        .toLocaleDateString('en-US', { weekday: 'short' })
        .toUpperCase();
      const dateNum = d.getDate().toString();
      const isToday = dStr === todayStr;

      // Check if all habits were completed on this date
      const isDayComplete =
        habits.length > 0 && habits.every(h => h.completedDates.includes(dStr));

      days.push({
        dateStr: dStr,
        dayLabel,
        dateNum,
        isToday,
        isDayComplete,
      });
    }
    return days;
  }, [todayStr, habits]);

  const isSelectedToday = selectedDateStr === todayStr;

  // Returns clock icon for time-based habits, flag icon for goal/quantity habits
  const getGoalIconName = (iconId: string): string => {
    const timingIcons = ['book', 'workout', 'meditation', 'sleep'];
    return timingIcons.includes(iconId) ? 'time-outline' : 'flag-outline';
  };

  // Simple segmented border trick for circular progress without SVG
  const getCircleStyles = (percent: number) => {
    if (percent === 0) return { borderColor: '#dde0e4' };
    return {
      borderTopColor: percent > 0 ? '#0D9488' : '#dde0e4',
      borderRightColor: percent > 25 ? '#0D9488' : '#dde0e4',
      borderBottomColor: percent > 50 ? '#0D9488' : '#dde0e4',
      borderLeftColor: percent > 85 ? '#0D9488' : '#dde0e4',
    };
  };

  return (
    <ScreenContainer backgroundColor="#39C4B6" barStyle="light-content">
      {/* Top Header Banner displaying Selected Date */}
      <TopHeader
        title={formattedHeaderDate}
        showNotificationIcon={true}
        onBack={() => navigation.goBack()}
      />

      {/* Week Days Strip - Interactive Date Selection */}
      <View style={styles.weekRow}>
        {weekDaysStrip.map((item, index) => {
          const isSelected = item.dateStr === selectedDateStr;

          return (
            <TouchableOpacity
              key={index}
              style={styles.dayContainer}
              activeOpacity={0.7}
              onPress={() => setSelectedDateStr(item.dateStr)}
            >
              <CustomText
                style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}
              >
                {item.dayLabel}
              </CustomText>

              {/* Date Badge: Orange for Today, Teal for Selected, White/Transparent for Regular */}
              <View
                style={[
                  styles.dateBadge,
                  item.isToday
                    ? styles.dateBadgeToday
                    : isSelected
                    ? styles.dateBadgeSelected
                    : styles.dateBadgeInactive,
                ]}
              >
                <Ionicons
                  name={item.isToday ? 'flash' : 'checkmark'}
                  size={14}
                  color={item.isToday || isSelected ? '#FFFFFF' : '#0D9488'}
                  style={styles.dateBadgeIcon}
                />
                <CustomText
                  style={[
                    styles.dateNum,
                    item.isToday || isSelected
                      ? styles.dateNumActive
                      : styles.dateNumInactive,
                  ]}
                >
                  {item.dateNum}
                </CustomText>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* White Main Sheet */}
      <View style={styles.mainSheet}>
        <View style={styles.sheetHandle} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.scrollContainer}
        >
          <View style={styles.topSection}>
            {/* Habits Summary Card for Selected Date */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryLeft}>
                <CustomText style={styles.summaryTitle}>
                  {isSelectedToday
                    ? "TODAY'S HABITS"
                    : 'HABITS FOR SELECTED DATE'}
                </CustomText>
                <CustomText style={styles.summarySubtitle}>
                  ({completedSelectedCount}/{totalHabits} DONE)
                </CustomText>

                {/* Progress bar */}
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${completionPercentage}%` },
                    ]}
                  />
                </View>
              </View>

              {/* Circular Percentage Badge */}
              <View
                style={[
                  styles.percentageCircle,
                  getCircleStyles(completionPercentage),
                  { transform: [{ rotate: '45deg' }] },
                ]}
              >
                <CustomText
                  style={[
                    styles.percentageText,
                    completionPercentage > 0
                      ? styles.percentageTextActive
                      : styles.percentageTextInactive,
                    { transform: [{ rotate: '-45deg' }] },
                  ]}
                >
                  {completionPercentage}%
                </CustomText>
              </View>
            </View>
          </View>

          <View style={styles.gridSection}>
            {/* Habit Grid / Empty State */}
            {habits.length === 0 ? (
              /* EMPTY STATE WHEN NO HABITS CREATED YET */
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBg}>
                  <CustomText style={styles.emptyEmoji}>🎯</CustomText>
                </View>
                <CustomText style={styles.emptyTitle}>
                  No Habits Created Yet
                </CustomText>
                <CustomText style={styles.emptySubtitle}>
                  Your daily habit list is empty. Tap the button below or the +
                  button to create your first habit!
                </CustomText>
                <TouchableOpacity
                  style={styles.createFirstButton}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('Create')}
                >
                  <CustomText style={styles.createFirstText}>
                    + CREATE FIRST HABIT
                  </CustomText>
                </TouchableOpacity>
              </View>
            ) : (
              /* HABIT CARDS GRID WHEN HABITS EXIST */
              <View style={styles.habitsGrid}>
                {habits.map(item => {
                  const isCompleted =
                    item.completedDates.includes(selectedDateStr);

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.habitCard,
                        isCompleted
                          ? styles.habitCardCompleted
                          : styles.habitCardPending,
                        !isSelectedToday && styles.habitCardReadOnly,
                      ]}
                      activeOpacity={isSelectedToday ? 0.8 : 1}
                      onPress={() => {
                        if (isSelectedToday) handleToggleHabit(item.id);
                      }}
                    >
                      <View style={styles.cardContent}>
                        {/* Top Row: Checkbox & Icon */}
                        <View style={styles.cardTopRow}>
                          <View
                            style={[
                              styles.checkbox,
                              isCompleted
                                ? styles.checkboxChecked
                                : styles.checkboxPending,
                            ]}
                          >
                            {isCompleted && (
                              <Ionicons
                                name="checkmark"
                                size={18}
                                color="#FFFFFF"
                                style={{ marginTop: 1 }}
                              />
                            )}
                          </View>

                          <View
                            style={[
                              styles.iconBox,
                              isCompleted
                                ? styles.iconBoxCompleted
                                : styles.iconBoxPending,
                            ]}
                          >
                            <HabitIconBadge
                              iconId={item.icon}
                              iconImageUrl={item.iconImageUrl}
                              size={26}
                            />
                          </View>
                        </View>

                        {/* Habit Title */}
                        <CustomText style={styles.habitTitle} numberOfLines={2}>
                          {item.title}
                        </CustomText>

                        {/* Goal Details */}
                        {item.goalDetails ? (
                          <View style={styles.goalRow}>
                            <Ionicons
                              name={getGoalIconName(item.icon)}
                              size={24}
                              color={isCompleted ? '#0F766E' : '#F97316'}
                              style={styles.goalIcon}
                            />
                            <CustomText style={styles.goalText}>
                              {item.goalDetails}
                            </CustomText>
                          </View>
                        ) : null}
                      </View>

                      {/* Streak Badge - Below goal, aligned bottom */}
                      <View style={styles.streakPill}>
                        <CustomText style={styles.streakText}>
                          🔥{' '}
                          {item.streak === 0
                            ? '0'
                            : item.streak === 1
                            ? '1 day'
                            : `${item.streak} days`}
                        </CustomText>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Floating Action Button '+' */}
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Create')}
        >
          <CustomText style={styles.fabText}>+</CustomText>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 24,
    backgroundColor: '#39C4B6',
  },
  dayContainer: {
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  dayLabelSelected: {
    color: '#111827',
    fontWeight: '800',
  },
  dateBadge: {
    width: 36,
    height: 48,
    borderRadius: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  dateBadgeIcon: {
    marginBottom: 2,
  },
  dateBadgeToday: {
    backgroundColor: '#F97316',
  },
  dateBadgeSelected: {
    backgroundColor: '#0F766E',
  },
  dateBadgeInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dateNum: {
    fontSize: 14,
    fontWeight: '800',
  },
  dateNumActive: {
    color: '#FFFFFF',
  },
  dateNumInactive: {
    color: '#111827',
  },
  mainSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    marginTop: -10, // overlap slightly with the top area
  },
  sheetHandle: {
    width: 48,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  topSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  gridSection: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingBottom: 20,
    paddingTop: -20,
    marginTop: 20,

    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryLeft: {
    flex: 1,
    marginRight: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  summarySubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginTop: 4,
    marginBottom: 12,
  },
  progressTrack: {
    height: 10,
    backgroundColor: '#dde0e4',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0D9488',
    borderRadius: 5,
  },
  percentageCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  percentageText: {
    fontSize: 16,
    fontWeight: '800',
  },
  percentageTextActive: {
    color: '#0F172A',
  },
  percentageTextInactive: {
    color: '#94A3B8',
  },
  /* Empty State Styles */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginTop: 10,
  },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#CCECE6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyEmoji: {
    fontSize: 40, // Slightly larger
    lineHeight: 48, // Add explicit lineHeight
    textAlign: 'center',
    includeFontPadding: false,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  createFirstButton: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
  },
  createFirstText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  /* Habit Grid Styles */
  habitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  habitCard: {
    width: '48%',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.5,
    justifyContent: 'space-between',
    minHeight: 140,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
  },
  habitCardCompleted: {
    backgroundColor: '#F0FDFA',
    borderColor: '#0D9488',
  },
  habitCardPending: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FDBA74', // Orange border
  },
  habitCardReadOnly: {
    opacity: 0.65,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBoxCompleted: {
    backgroundColor: '#CCECE6',
  },
  iconBoxPending: {
    backgroundColor: '#FFEDD5',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxPending: {
    borderColor: '#F97316',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  badgeSpacing: {
    marginLeft: 12,
  },
  habitTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    lineHeight: 22,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalIcon: {
    marginRight: 6,
  },
  goalText: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '600',
  },
  streakPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100, // Increased to ensure a perfect pill shape
    backgroundColor: '#F97316',
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  fabText: {
    fontSize: 36, // Increase slightly
    color: '#FFFFFF',
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 40, // Add explicit lineHeight
    includeFontPadding: false,
  },
});
