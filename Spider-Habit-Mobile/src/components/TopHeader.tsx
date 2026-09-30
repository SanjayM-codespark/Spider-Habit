import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import CustomText from './CustomText';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface TopHeaderProps {
  title: string;
  showNotificationIcon?: boolean;
  onBack?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ title, showNotificationIcon = false, onBack }) => {
  return (
    <View style={styles.topHeader}>
      <View style={styles.headerLeft}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.headerCenter}>
        <CustomText style={styles.titleText}>{title}</CustomText>
      </View>
      <View style={styles.headerRight}>
        {showNotificationIcon && (
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color="#111827" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#39C4B6',
  },
  headerLeft: {
    width: 36,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 36,
    alignItems: 'flex-end',
  },
  titleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.5,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
});
