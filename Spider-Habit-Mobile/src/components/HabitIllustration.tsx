import CustomText from '../components/CustomText';
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';;

const { width } = Dimensions.get('window');

export const HabitIllustration: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Outer Decorative Mint Canvas */}
      <View style={styles.canvasCard}>
        {/* Top Floating Badge */}
        <View style={styles.checkBadge}>
          <CustomText style={styles.checkBadgeText}>✓</CustomText>
        </View>

        {/* Floating Star */}
        <View style={styles.starBadge}>
          <CustomText style={styles.starText}>⭐</CustomText>
        </View>

        {/* Floating Flame / Streak Badge */}
        <View style={styles.streakBadge}>
          <CustomText style={styles.streakIcon}>🔥</CustomText>
          <CustomText style={styles.streakText}>12 Day Streak</CustomText>
        </View>

        {/* Main Target Board Card */}
        <View style={styles.targetCard}>
          {/* Target Bullseye Graphics */}
          <View style={styles.bullseyeOuter}>
            <View style={styles.bullseyeMid}>
              <View style={styles.bullseyeInner}>
                <View style={styles.bullseyeCenter} />
              </View>
            </View>
          </View>

          {/* Progress Bars Container */}
          <View style={styles.progressSection}>
            <CustomText style={styles.cardHeader}>Daily Habit Tracker</CustomText>
            
            {/* Bar 1 */}
            <View style={styles.barItem}>
              <View style={styles.barHeader}>
                <CustomText style={styles.barLabel}>Morning Workout</CustomText>
                <CustomText style={styles.barPercent}>100%</CustomText>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: '100%' }]} />
              </View>
            </View>

            {/* Bar 2 */}
            <View style={styles.barItem}>
              <View style={styles.barHeader}>
                <CustomText style={styles.barLabel}>Read 20 Pages</CustomText>
                <CustomText style={styles.barPercent}>85%</CustomText>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: '85%', backgroundColor: '#2DD4BF' }]} />
              </View>
            </View>

            {/* Bar 3 */}
            <View style={styles.barItem}>
              <View style={styles.barHeader}>
                <CustomText style={styles.barLabel}>Meditation</CustomText>
                <CustomText style={styles.barPercent}>70%</CustomText>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: '70%', backgroundColor: '#F59E0B' }]} />
              </View>
            </View>

            {/* Week Days Tracker */}
            <View style={styles.daysRow}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                <View
                  key={index}
                  style={[
                    styles.dayPill,
                    index < 5 ? styles.dayPillActive : styles.dayPillInactive,
                  ]}
                >
                  <CustomText
                    style={[
                      styles.dayText,
                      index < 5 ? styles.dayTextActive : styles.dayTextInactive,
                    ]}
                  >
                    {day}
                  </CustomText>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Bottom Trophy Master Badge */}
        <View style={styles.trophyBadge}>
          <CustomText style={styles.trophyIcon}>🏆</CustomText>
          <CustomText style={styles.trophyText}>Goal Achieved!</CustomText>
        </View>
      </View>
    </View>
  );
};

const cardWidth = Math.min(width - 48, 320);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  canvasCard: {
    width: cardWidth,
    height: 250,
    backgroundColor: '#E6F4F1',
    borderRadius: 24,
    padding: 16,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    left: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2DD4BF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  checkBadgeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  starBadge: {
    position: 'absolute',
    top: 8,
    right: 14,
    zIndex: 3,
  },
  starText: {
    fontSize: 22,
  },
  streakBadge: {
    position: 'absolute',
    top: 16,
    right: 42,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    elevation: 2,
    gap: 4,
  },
  streakIcon: {
    fontSize: 12,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  targetCard: {
    width: '94%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    marginTop: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  bullseyeOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  bullseyeMid: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bullseyeInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bullseyeCenter: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#B45309',
  },
  progressSection: {
    width: '100%',
  },
  cardHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  barItem: {
    marginBottom: 6,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  barPercent: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D9488',
  },
  barTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#0D9488',
    borderRadius: 3,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dayPill: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayPillActive: {
    backgroundColor: '#0D9488',
  },
  dayPillInactive: {
    backgroundColor: '#F1F5F9',
  },
  dayText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dayTextActive: {
    color: '#FFFFFF',
  },
  dayTextInactive: {
    color: '#94A3B8',
  },
  trophyBadge: {
    position: 'absolute',
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FCD34D',
    gap: 6,
  },
  trophyIcon: {
    fontSize: 14,
  },
  trophyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
});
