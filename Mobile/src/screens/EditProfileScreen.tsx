import CustomTextInput from '../components/CustomTextInput';
import CountryCodePicker from '../components/CountryCodePicker';
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
import { countryCodes } from 'react-native-country-codes-picker';
import { ScreenContainer } from '../components/ScreenContainer';
import { TopHeader } from '../components/TopHeader';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { logger } from '../utils/logger';

const TAG = 'EditProfileScreen';

interface Props {
  navigation: any;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_COUNTRY_CODE = '+91';

/** Split a stored "+<code><number>" phone into its country code and number. */
const splitPhone = (full: string): { code: string; number: string } => {
  const value = (full ?? '').trim();
  if (!value.startsWith('+')) {
    return { code: DEFAULT_COUNTRY_CODE, number: value };
  }
  // Longest matching dial code wins (e.g. +1242 before +1).
  let best = '';
  for (const country of countryCodes) {
    const dial = country.dial_code;
    if (value.startsWith(dial) && dial.length > best.length) {
      best = dial;
    }
  }
  return best
    ? { code: best, number: value.slice(best.length) }
    : { code: DEFAULT_COUNTRY_CODE, number: value.replace(/^\+/, '') };
};

export const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, updateProfile } = useAuth();
  const { showAlert } = useAlert();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const initialPhone = splitPhone(user?.phone ?? '');
  const [countryCode, setCountryCode] = useState(initialPhone.code);
  const [phone, setPhone] = useState(initialPhone.number);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSave = async () => {
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Please enter your name');
      return;
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    if (!/^\d{6,15}$/.test(phone.trim())) {
      setErrorMessage('Please enter a valid phone number');
      return;
    }

    try {
      setLoading(true);
      await updateProfile({
        name,
        email,
        phone: `${countryCode}${phone.trim()}`,
      });
      logger.info(TAG, 'Profile updated');
      showAlert('Profile Updated', 'Your details have been saved.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer backgroundColor="#d60201" barStyle="light-content">
      <TopHeader title="EDIT PROFILE" onBack={() => navigation.goBack()} />

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
            {errorMessage ? (
              <View style={styles.errorBox}>
                <CustomText style={styles.errorText}>{errorMessage}</CustomText>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <CustomText style={styles.label}>Name</CustomText>
              <CustomTextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <CustomText style={styles.label}>Email</CustomText>
              <CustomTextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <CustomText style={styles.label}>Phone</CustomText>
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

            <TouchableOpacity
              style={styles.saveButton}
              activeOpacity={0.8}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <CustomText style={styles.saveButtonText}>SAVE CHANGES</CustomText>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ScreenContainer>
  );
};

export default EditProfileScreen;

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
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderColor: '#F87171',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 18,
  },
  errorText: { color: '#991B1B', fontSize: 14, textAlign: 'center' },
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
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phoneInput: {
    flex: 8,
  },
  saveButton: {
    backgroundColor: '#d60201',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
