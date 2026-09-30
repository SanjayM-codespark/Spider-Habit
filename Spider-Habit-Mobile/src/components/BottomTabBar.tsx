import CustomText from '../components/CustomText';
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MaterialDesignIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Entypo from 'react-native-vector-icons/Entypo';
import Feather from 'react-native-vector-icons/Feather';

interface BottomTabBarProps {
  activeTab: 'Dashboard' | 'Create' | 'Progress' | 'Settings';
  onSelectTab: (
    tab: 'Dashboard' | 'Create' | 'Progress' | 'Settings'
  ) => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  if (isKeyboardVisible) return null;
  const tabs = [
    {
      id: 'Dashboard' as const,
      label: 'Dashboard',
      Icon: MaterialIcons,
      iconName: 'dashboard',
    },
    {
      id: 'Create' as const,
      label: 'Create',
      Icon: Ionicons,
      iconName: 'add-circle-outline',
    },
    {
      id: 'Progress' as const,
      label: 'Progress',
      Icon: Entypo,
      iconName: 'bar-graph',
    },
    {
      id: 'Settings' as const,
      label: 'Settings',
      Icon: Feather,
      iconName: 'settings',
    },
  ];

  return (
    // Outer wrapper: white background extends into system nav bar zone on Android 15
    <View style={styles.wrapper}>
      {/* Fixed-height tab row — always 60px, same as Android 14 */}
      <View style={styles.container}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.Icon;

          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabButton}
              activeOpacity={0.7}
              onPress={() => onSelectTab(tab.id)}
            >
              <Icon
                name={tab.iconName}
                size={22}
                color={isActive ? '#0D9488' : '#94A3B8'}
              />

              <CustomText
                style={[
                  styles.tabLabel,
                  isActive
                    ? styles.tabLabelActive
                    : styles.tabLabelInactive,
                ]}
              >
                {tab.label}
              </CustomText>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Bottom inset spacer — 0px on Android ≤14, nav-bar height on Android 15 */}
      {bottomInset > 0 && (
        <View style={{ height: bottomInset, backgroundColor: '#FFFFFF' }} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  container: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },

  tabLabel: {
    fontSize: 11,
    marginTop: 2,
  },

  tabLabelActive: {
    color: '#0D9488',
    fontWeight: '800',
  },

  tabLabelInactive: {
    color: '#64748B',
    fontWeight: '600',
  },
});