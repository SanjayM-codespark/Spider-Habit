import CustomTextInput from '../components/CustomTextInput';
import CustomText from '../components/CustomText';
import PasswordInput from '../components/PasswordInput';
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
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { logger } from '../utils/logger';

const TAG = 'ChangePasswordScreen';
const MIN_PASSWORD_LENGTH = 4;

interface Props {
  navigation: any;
}

/** Labelled password input (with the show / hide eye icon). */
const PasswordField: React.FC<{
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
}> = ({ label, placeholder, value, onChangeText }) => (
  <View style={styles.inputGroup}>
    <CustomText style={styles.label}>{label}</CustomText>
    <PasswordInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor="#94A3B8"
      value={value}
      onChangeText={onChangeText}
    />
  </View>
);

export const ChangePasswordScreen: React.FC<Props> = ({ navigation }) => {
  const { changePassword } = useAuth();
  const { showAlert } = useAlert();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSave = async () => {
    setErrorMessage('');

    if (!currentPassword) {
      setErrorMessage('Please enter your current password');
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(
        `New password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
      );
      return;
    }
    if (newPassword === currentPassword) {
      setErrorMessage('New password must be different from the current one');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirm password do not match');
      return;
    }

    try {
      setLoading(true);
      await changePassword(currentPassword, newPassword);
      logger.info(TAG, 'Password changed');
      showAlert('Password Changed', 'Your password has been updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer backgroundColor="#d60201" barStyle="light-content">
      <TopHeader title="CHANGE PASSWORD" onBack={() => navigation.goBack()} />

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

            <PasswordField
              label="Current Password"
              placeholder="Enter current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />

            <PasswordField
              label="New Password"
              placeholder="Enter new password"
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <PasswordField
              label="Confirm Password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity
              style={styles.saveButton}
              activeOpacity={0.8}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <CustomText style={styles.saveButtonText}>
                  CHANGE PASSWORD
                </CustomText>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ScreenContainer>
  );
};

export default ChangePasswordScreen;

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
