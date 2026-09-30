import CustomText from '../components/CustomText';
import React from 'react';
import { View, StyleSheet } from 'react-native';;

interface HabitLogoProps {
  size?: number;
}

export const HabitLogo: React.FC<HabitLogoProps> = ({ size = 80 }) => {
  const scale = size / 80;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.logoWrapper, { transform: [{ scale }] }]}>
        {/* Left Bar of H */}
        <View style={styles.leftBar} />

        {/* Right Bar of H */}
        <View style={styles.rightBar} />

        {/* Top Right Leaf 1 */}
        <View style={styles.leafMain} />
        
        {/* Top Right Leaf 2 */}
        <View style={styles.leafSecondary} />

        {/* Center Checkmark Swoosh */}
        <View style={styles.checkShort} />
        <View style={styles.checkLong} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    width: 80,
    height: 80,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftBar: {
    position: 'absolute',
    left: 18,
    top: 20,
    width: 14,
    height: 48,
    borderRadius: 7,
    backgroundColor: '#0D9488',
  },
  rightBar: {
    position: 'absolute',
    right: 18,
    top: 20,
    width: 14,
    height: 48,
    borderRadius: 7,
    backgroundColor: '#0D9488',
  },
  leafMain: {
    position: 'absolute',
    top: 6,
    right: 10,
    width: 20,
    height: 20,
    borderTopLeftRadius: 16,
    borderBottomRightRadius: 16,
    backgroundColor: '#34D399',
    transform: [{ rotate: '-15deg' }],
  },
  leafSecondary: {
    position: 'absolute',
    top: 14,
    right: 24,
    width: 14,
    height: 14,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    backgroundColor: '#059669',
    transform: [{ rotate: '25deg' }],
  },
  checkShort: {
    position: 'absolute',
    left: 25,
    top: 47,
    width: 12,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#34D399',
    transform: [{ rotate: '45deg' }],
  },
  checkLong: {
    position: 'absolute',
    left: 31,
    top: 42,
    width: 26,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#34D399',
    transform: [{ rotate: '-45deg' }],
  },
});
