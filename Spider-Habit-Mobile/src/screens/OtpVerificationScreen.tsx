import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { HabitLogo } from '../components/HabitLogo';
import CustomText from '../components/CustomText';
import { AuthStackParamList } from '../navigation/AuthNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'OtpVerification'>;

const OtpVerificationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { phone } = route.params;
  const { verifyOtp, sendOtp } = useAuth();

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [timer, setTimer] = useState(60);

  const inputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Move to next field if there's a value
    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && index > 0 && !otp[index]) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    setErrorMessage('');

    if (otpCode.length < 6) {
      setErrorMessage('Please enter the 6-digit verification code');
      return;
    }

    try {
      setLoading(true);
      await verifyOtp(otpCode);
      // Navigation is handled automatically by RootNavigation once isLoggedIn becomes true
    } catch (err: any) {
      setErrorMessage(err.message || 'OTP Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    
    setErrorMessage('');
    try {
      setLoading(true);
      await sendOtp(phone);
      setTimer(60);
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer
      backgroundColor="#FFFFFF"
      barStyle="dark-content"
      edges={['top', 'bottom', 'left', 'right']}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Logo & Text */}
          <View style={styles.topContainer}>
            <HabitLogo size={64} />
            <CustomText style={styles.title}>Verification Code</CustomText>
            <CustomText style={styles.subtitle}>
              We have sent a verification code to
            </CustomText>
            <CustomText style={styles.phoneText}>{phone}</CustomText>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {errorMessage ? (
              <View style={styles.errorBox}>
                <CustomText style={styles.errorText}>{errorMessage}</CustomText>
              </View>
            ) : null}

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputs.current[index] = ref)}
                  style={[styles.otpInput, digit ? styles.otpInputActive : null]}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(text) => handleChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                />
              ))}
            </View>

            <TouchableOpacity
              style={styles.verifyButton}
              activeOpacity={0.8}
              onPress={handleVerify}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <CustomText style={styles.verifyButtonText}>VERIFY OTP</CustomText>
              )}
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              <CustomText style={styles.resendText}>Didn't receive the code? </CustomText>
              <TouchableOpacity onPress={handleResend} disabled={timer > 0}>
                <CustomText style={[styles.resendLink, timer > 0 && styles.resendDisabled]}>
                  {timer > 0 ? `Resend in ${timer}s` : 'Resend Code'}
                </CustomText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer - Change Number */}
          <View style={styles.footerContainer}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <CustomText style={styles.changeNumberLink}>Change Phone Number</CustomText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

export default OtpVerificationScreen;

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  topContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 20,
    marginBottom: 8,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
  },
  phoneText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D9488',
    marginTop: 4,
  },
  formContainer: {
    width: '100%',
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderColor: '#F87171',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 14,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  otpInput: {
    width: 48,
    height: 56,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    color: '#0F172A',
    textAlign: 'center',
  },
  otpInputActive: {
    borderColor: '#0D9488',
    backgroundColor: '#F0FDFA',
  },
  verifyButton: {
    backgroundColor: '#0D9488',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  resendText: {
    fontSize: 14,
    color: '#64748B',
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D9488',
  },
  resendDisabled: {
    color: '#94A3B8',
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  changeNumberLink: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    textDecorationLine: 'underline',
  },
});
