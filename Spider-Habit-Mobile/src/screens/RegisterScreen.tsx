import CustomTextInput from '../components/CustomTextInput';
import CountryCodePicker from '../components/CountryCodePicker';
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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { AppLogo } from '../components/AppLogo';
import CustomText from '../components/CustomText';

type AuthStackParamList = {
  Welcome: undefined;
  Register: undefined;
  Login: undefined;
  OtpVerification: { phone: string };
};

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Register'
>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    if (!phone.trim() || phone.trim().length < 6) {
      setErrorMessage('Please enter a valid phone number');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMessage('Password must be at least 4 characters long');
      return;
    }

    try {
      setLoading(true);
      const fullPhone = `${countryCode}${phone.trim()}`;
      await register({
        name: name.trim(),
        email: email.trim(),
        phone: fullPhone,
        password,
      });
      navigation.navigate('OtpVerification', { phone: fullPhone });
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
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
          {/* Top Logo & Welcome Text */}
          <View style={styles.topContainer}>
            <AppLogo width={200} />
            <CustomText style={styles.title}>Create Account</CustomText>
            <CustomText style={styles.subtitle}>
              Sign up to start tracking your habits
            </CustomText>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {errorMessage ? (
              <View style={styles.errorBox}>
                <CustomText style={styles.errorText}>{errorMessage}</CustomText>
              </View>
            ) : null}

            {/* Name Input */}
            <View style={styles.inputGroup}>
              <CustomText style={styles.label}>Full Name</CustomText>
              <CustomTextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <CustomText style={styles.label}>Email Address</CustomText>
              <CustomTextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Phone Input */}
            <View style={styles.inputGroup}>
              <CustomText style={styles.label}>Phone Number</CustomText>
              <View style={styles.phoneInputContainer}>
                <CountryCodePicker
                  value={countryCode}
                  onChange={setCountryCode}
                />
                <CustomTextInput
                  style={[styles.input, styles.phoneInput]}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#94A3B8"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <CustomText style={styles.label}>Password</CustomText>
              <CustomTextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={styles.registerButton}
              activeOpacity={0.8}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <CustomText style={styles.registerButtonText}>
                  REGISTER
                </CustomText>
              )}
            </TouchableOpacity>
          </View>

          {/* Switch to Login */}
          <View style={styles.footerContainer}>
            <CustomText style={styles.footerText}>
              Already have an account?{' '}
            </CustomText>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <CustomText style={styles.loginLink}>Log In</CustomText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

export default RegisterScreen;

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
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
    marginBottom: 4,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
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
    marginBottom: 16,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 14,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
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
    height: 50,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0F172A',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countryCodeInput: {
    flex: 2,
    marginRight: 10,
    textAlign: 'center',
    paddingHorizontal: 5,
  },
  phoneInput: {
    flex: 8,
  },
  registerButton: {
    backgroundColor: '#0D9488',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
  },
  loginLink: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D9488',
  },
});
