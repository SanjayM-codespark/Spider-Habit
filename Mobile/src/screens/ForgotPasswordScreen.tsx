import CustomTextInput from '../components/CustomTextInput';
import CustomText from '../components/CustomText';
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { TopHeader } from '../components/TopHeader';
import { useAlert } from '../context/AlertContext';
import { authStorage } from '../services/authStorage';
import { logger } from '../utils/logger';

const TAG = 'ForgotPasswordScreen';

interface Props {
  navigation: any;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 4;

/**
 * Two steps: (1) enter the account email and get a 6-digit code by email,
 * (2) enter the code plus a new password. Reached from the login screen.
 */
export const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const { showAlert } = useAlert();

  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const handleSendCode = async () => {
    setErrorMessage('');
    setInfoMessage('');

    if (!EMAIL_PATTERN.test(email.trim())) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      await authStorage.requestPasswordReset(email);
      setStep('reset');
      setInfoMessage(`We sent a 6-digit code to ${email.trim()}.`);
    } catch (err: any) {
      logger.warn(TAG, 'Failed to request password reset', err);
      setErrorMessage(err?.message || 'Failed to send the verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setErrorMessage('');

    if (otp.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit code from your email');
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await authStorage.resetPassword(email, otp, newPassword);
      showAlert(
        'Password Updated',
        'Your password has been changed. You can now log in with the new password.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer backgroundColor="#d60201" barStyle="light-content">
      <TopHeader title="FORGOT PASSWORD" onBack={() => navigation.goBack()} />

      <View style={styles.mainSheet}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <CustomText style={styles.intro}>
              {step === 'email'
                ? 'Enter your account email and we will send you a verification code.'
                : 'Enter the code from your email and choose a new password.'}
            </CustomText>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <CustomText style={styles.errorText}>{errorMessage}</CustomText>
              </View>
            ) : null}
            {infoMessage && !errorMessage ? (
              <View style={styles.infoBox}>
                <CustomText style={styles.infoText}>{infoMessage}</CustomText>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <CustomText style={styles.label}>Email</CustomText>
              <CustomTextInput
                style={[styles.input, step === 'reset' && styles.inputDisabled]}
                placeholder="you@example.com"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={step === 'email' && !loading}
              />
            </View>

            {step === 'reset' && (
              <>
                <View style={styles.inputGroup}>
                  <CustomText style={styles.label}>Verification Code</CustomText>
                  <CustomTextInput
                    style={styles.input}
                    placeholder="6-digit code"
                    placeholderTextColor="#94A3B8"
                    value={otp}
                    onChangeText={text => setOtp(text.replace(/\D/g, ''))}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <CustomText style={styles.label}>New Password</CustomText>
                  <CustomTextInput
                    style={styles.input}
                    placeholder="Enter new password"
                    placeholderTextColor="#94A3B8"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputGroup}>
                  <CustomText style={styles.label}>Confirm Password</CustomText>
                  <CustomTextInput
                    style={styles.input}
                    placeholder="Re-enter new password"
                    placeholderTextColor="#94A3B8"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                  />
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.8}
              onPress={step === 'email' ? handleSendCode : handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <CustomText style={styles.primaryButtonText}>
                  {step === 'email' ? 'SEND CODE' : 'RESET PASSWORD'}
                </CustomText>
              )}
            </TouchableOpacity>

            {step === 'reset' && (
              <TouchableOpacity
                style={styles.linkButton}
                onPress={handleSendCode}
                disabled={loading}
              >
                <CustomText style={styles.linkText}>Resend code</CustomText>
              </TouchableOpacity>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ScreenContainer>
  );
};

export default ForgotPasswordScreen;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  mainSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  scrollContent: { paddingBottom: 32 },
  intro: { fontSize: 14, color: '#64748B', marginBottom: 20, lineHeight: 20 },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderColor: '#F87171',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 18,
  },
  errorText: { color: '#991B1B', fontSize: 14, textAlign: 'center' },
  infoBox: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 18,
  },
  infoText: { color: '#334155', fontSize: 14, textAlign: 'center' },
  inputGroup: { marginBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0F172A',
  },
  inputDisabled: { backgroundColor: '#F1F5F9', color: '#64748B' },
  primaryButton: {
    backgroundColor: '#d60201',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  linkButton: { alignItems: 'center', marginTop: 18 },
  linkText: { color: '#d60201', fontSize: 14, fontWeight: '600' },
});
