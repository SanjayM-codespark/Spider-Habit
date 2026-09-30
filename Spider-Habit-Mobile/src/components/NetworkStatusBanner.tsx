import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomText from './CustomText';

export const NetworkStatusBanner = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const translateY = new Animated.Value(-100);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      // If `isConnected` is strictly false, device is offline
      const offline = state.isConnected === false;
      setIsConnected(!offline);

      if (offline) {
        // Slide down
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else {
        // Slide up
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    });

    return () => unsubscribe();
  }, []);

  if (isConnected !== false) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }], paddingTop: insets.top + 10 },
      ]}
    >
      <CustomText style={styles.text}>No Internet Connection</CustomText>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#DC2626',
    zIndex: 9999,
    paddingBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
