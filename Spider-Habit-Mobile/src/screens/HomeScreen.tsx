import CustomText from '../components/CustomText';
import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';;
import { ScreenContainer } from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { HabitLogo } from '../components/HabitLogo';

const HomeScreen = () => {
  const { user, logout } = useAuth();

  return (
    <ScreenContainer backgroundColor="#F8FAFC" barStyle="dark-content">
      <View style={styles.container}>
        <View style={styles.header}>
          <HabitLogo size={60} />
          <CustomText style={styles.welcomeText}>Welcome Back!</CustomText>
          <CustomText style={styles.userName}>{user?.name || 'User'}</CustomText>
        </View>

        <View style={styles.card}>
          <CustomText style={styles.cardTitle}>User Profile (Local DB)</CustomText>
          
          <View style={styles.infoRow}>
            <CustomText style={styles.infoLabel}>Name:</CustomText>
            <CustomText style={styles.infoValue}>{user?.name || 'N/A'}</CustomText>
          </View>

          <View style={styles.infoRow}>
            <CustomText style={styles.infoLabel}>Email:</CustomText>
            <CustomText style={styles.infoValue}>{user?.email || 'N/A'}</CustomText>
          </View>

          <View style={styles.infoRow}>
            <CustomText style={styles.infoLabel}>Phone:</CustomText>
            <CustomText style={styles.infoValue}>{user?.phone || 'N/A'}</CustomText>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.8}
          onPress={logout}
        >
          <CustomText style={styles.logoutButtonText}>LOG OUT</CustomText>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 10,
  },
  welcomeText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
  },
  userName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D9488',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
