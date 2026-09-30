import CustomText from '../components/CustomText';
import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { TopHeader } from '../components/TopHeader';
import { databaseService } from '../database/databaseService';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAlert } from '../context/AlertContext';

interface Props {
  navigation: any;
}

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { showAlert } = useAlert();

  const handleDeleteAccount = () => {
    showAlert(
      'Delete Account',
      'Are you sure you want to delete your account? All habits and logged data will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (user?.id) await databaseService.clearAllData(user.id);
            await logout();
          },
        },
      ],
    );
  };

  return (
    <ScreenContainer backgroundColor="#39C4B6" barStyle="light-content">
      <TopHeader title="SETTINGS & PROFILE" />

      <View style={styles.mainSheet}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* User Profile Card */}
          <View style={styles.profileCard}>
            <CustomText style={styles.userName}>
              {user?.name || 'User'}
            </CustomText>
            <CustomText style={styles.userPhone}>
              📱 {user?.phone || 'N/A'}
            </CustomText>
            <CustomText style={styles.userEmail}>
              ✉️ {user?.email || 'N/A'}
            </CustomText>
          </View>

          {/* Settings Options */}
          <View style={styles.sectionCard}>
            <CustomText style={styles.sectionTitle}>MANAGE</CustomText>

            {/* My Habits Row */}
            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ManageHabits')}
            >
              <View style={styles.menuLeft}>
                <CustomText style={styles.menuIcon}>📋</CustomText>
                <View>
                  <CustomText style={styles.menuLabel}>My Habits</CustomText>
                  <CustomText style={styles.menuSublabel}>
                    View, edit or delete habits
                  </CustomText>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#0D9488" />
            </TouchableOpacity>

            {Platform.OS !== 'ios' && (
              <>
                <View style={styles.divider} />

                {/* Subscription Row */}
                <TouchableOpacity
                  style={styles.menuRow}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('Subscription')}
                >
                  <View style={styles.menuLeft}>
                    <CustomText style={styles.menuIcon}>👑</CustomText>
                    <View>
                      <CustomText style={styles.menuLabel}>
                        Subscription Packages
                      </CustomText>
                      <CustomText style={styles.menuSublabel}>
                        Upgrade to Pro for unlimited habits
                      </CustomText>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#0D9488" />
                </TouchableOpacity>
              </>
            )}

            <View style={styles.divider} />

            {/* Help & Support Row */}
            <TouchableOpacity
              style={styles.menuRow}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Help')}
            >
              <View style={styles.menuLeft}>
                <CustomText style={styles.menuIcon}>ℹ️</CustomText>
                <View>
                  <CustomText style={styles.menuLabel}>Help & Support</CustomText>
                  <CustomText style={styles.menuSublabel}>
                    Help articles, policies and contact
                  </CustomText>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#0D9488" />
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.logoutButton}
              activeOpacity={0.8}
              onPress={logout}
            >
              <CustomText style={styles.logoutText}>LOG OUT</CustomText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteAccountButton}
              activeOpacity={0.8}
              onPress={handleDeleteAccount}
            >
              <CustomText style={styles.deleteAccountText}>
                DELETE ACCOUNT
              </CustomText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  mainSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  scrollContent: { paddingBottom: 40 },
  profileCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0D9488',
    marginBottom: 2,
  },
  userEmail: { fontSize: 14, color: '#64748B' },
  sectionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  emptyHabitsText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 8,
  },
  habitList: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 8,
    paddingTop: 4,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },
  habitEmoji: { fontSize: 24, width: 32, textAlign: 'center' },
  habitInfo: { flex: 1 },
  habitTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  habitGoal: { fontSize: 12, color: '#64748B', marginTop: 1 },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 2 },
  menuIcon: { fontSize: 24, lineHeight: 28 },
  menuLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  menuSublabel: { fontSize: 12, color: '#64748B', marginTop: 1 },
  menuChevron: { fontSize: 22, fontWeight: '700', color: '#0D9488' },
  actionsContainer: { gap: 12 },
  logoutButton: {
    backgroundColor: '#0D9488',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  deleteAccountButton: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#F87171',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteAccountText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Edit Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 16,
  },
  iconOption: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  iconOptionSelected: { backgroundColor: '#0D9488', borderColor: '#0D9488' },
  iconOptionEmoji: { fontSize: 26, lineHeight: 34 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '800', color: '#64748B' },
  saveBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
});
