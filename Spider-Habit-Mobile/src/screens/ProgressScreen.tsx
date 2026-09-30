import CustomText from '../components/CustomText';
import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenContainer } from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { habitService } from '../services/habitService';
import { Habit } from '../database/sqliteSchema';
import { HabitIconBadge } from '../components/HabitIcons';
import { TopHeader } from '../components/TopHeader';
import { logger } from '../utils/logger';

const TAG = 'ProgressScreen';

interface Props {
  navigation: any;
}

interface TileInfo {
  day: number;
  dateStr: string;
  percent: number;
}

export const ProgressScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedTileDate, setSelectedTileDate] = useState<string | null>(null);

  const loadData = async () => {
    if (!user?.id) {
      logger.warn(TAG, 'loadData() skipped — no user session');
      return;
    }
    logger.info(TAG, `loadData() → fetching habits for userId: ${user.id}`);
    const loaded = await habitService.getHabits(user);
    logger.info(
      TAG,
      `loadData() → ${loaded.length} habits loaded for progress screen`,
    );
    setHabits(loaded);
  };

  useFocusEffect(
    useCallback(() => {
      logger.debug(TAG, 'ProgressScreen focused — triggering loadData()');
      loadData();
    }, [user?.id]),
  );

  // Highest streak habit
  const topStreakHabit = useMemo(() => {
    return habits.reduce<Habit | null>((prev, curr) => {
      if (!prev) return curr;
      return curr.streak > prev.streak ? curr : prev;
    }, null);
  }, [habits]);

  // Calculate Real Weekly Completion Chart Data (Mon - Sun)
  const weeklyData = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sun, 1 is Mon...
    const distToMon = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(today);
    monday.setDate(today.getDate() + distToMon);

    const daysShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const result = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dStr = d.toISOString().split('T')[0];

      const completedOnDay = habits.filter(h =>
        h.completedDates?.includes(dStr),
      ).length;

      const pct =
        habits.length > 0
          ? Math.round((completedOnDay / habits.length) * 100)
          : 0;

      result.push({
        day: daysShort[i],
        percent: pct,
        dateStr: dStr,
      });
    }
    return result;
  }, [habits]);

  // Calculate Real Monthly Heatmap Grid
  const monthlyHeatmap = useMemo(() => {
    const now = new Date();
    const targetDate = new Date(
      now.getFullYear(),
      now.getMonth() + monthOffset,
      1,
    );
    const monthName = targetDate
      .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      .toUpperCase();

    const daysInMonth = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth() + 1,
      0,
    ).getDate();

    const squares: TileInfo[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(targetDate.getFullYear(), targetDate.getMonth(), day);
      const dStr = d.toISOString().split('T')[0];

      const completedCount = habits.filter(h =>
        h.completedDates?.includes(dStr),
      ).length;

      const pct =
        habits.length > 0
          ? Math.round((completedCount / habits.length) * 100)
          : 0;

      squares.push({
        day,
        dateStr: dStr,
        percent: pct,
      });
    }

    return { monthName, squares };
  }, [monthOffset, habits]);

  // Calculate Habit 30-day Completion Pct
  const getHabitMonthCompletion = (habit: Habit) => {
    if (!habit.completedDates || habit.completedDates.length === 0) return 0;
    const now = new Date();
    const count30 = habit.completedDates.filter(dStr => {
      const d = new Date(dStr);
      const diffTime = Math.abs(now.getTime() - d.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    }).length;

    return Math.min(100, Math.round((count30 / 30) * 100));
  };

  const getSquareColor = (pct: number) => {
    if (pct === 0) return '#E6F4F1';
    if (pct <= 33) return '#99F6E4';
    if (pct <= 66) return '#2DD4BF';
    return '#0D9488';
  };

  return (
    <ScreenContainer backgroundColor="#39C4B6" barStyle="light-content">
      {/* Top Header */}
      <TopHeader
        title="MY PROGRESS & REPORTS"
        onBack={() => navigation.goBack()}
      />

      {/* Main White Sheet */}
      <View style={styles.mainSheet}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* WEEKLY COMPLETION CHART CARD */}
          <View style={styles.card}>
            <CustomText style={styles.cardHeaderTitle}>
              WEEKLY COMPLETION CHART
            </CustomText>

            <View style={styles.chartArea}>
              {weeklyData.map((item, idx) => (
                <View key={idx} style={styles.barColumn}>
                  <CustomText style={styles.barPercentText}>
                    {item.percent}%
                  </CustomText>
                  <View style={styles.barTrack}>
                    <View
                      style={[styles.barFill, { height: `${item.percent}%` }]}
                    />
                  </View>
                  <CustomText style={styles.barDayText}>{item.day}</CustomText>
                </View>
              ))}
            </View>
          </View>

          {/* TOTAL HABITS & HIGHEST STREAK ROW */}
          <View style={styles.statsRow}>
            {/* Total Habits Tracked */}
            <TouchableOpacity
              style={[styles.statBox, { marginRight: 8 }]}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('TotalHabits')}
            >
              <CustomText style={styles.statLabel}>
                TOTAL HABITS TRACKED
              </CustomText>
              <CustomText style={styles.statValue}>{habits.length}</CustomText>
            </TouchableOpacity>

            {/* Highest Streak */}
            <TouchableOpacity
              style={[styles.statBox, { marginLeft: 8 }]}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Dashboard')}
            >
              <CustomText style={styles.statLabel}>HIGHEST STREAK</CustomText>
              <CustomText style={styles.streakValueTitle} numberOfLines={1}>
                {topStreakHabit ? topStreakHabit.title : 'None yet'}
              </CustomText>
              <CustomText style={styles.streakValueDays}>
                {topStreakHabit ? `${topStreakHabit.streak} Days 🔥` : '0 Days'}
              </CustomText>
            </TouchableOpacity>
          </View>

          {/* MONTHLY HEATMAP GRID / CALENDAR CARD */}
          <View style={styles.card}>
            <View style={styles.heatmapHeader}>
              <TouchableOpacity
                onPress={() => {
                  setMonthOffset(prev => prev - 1);
                  setSelectedTileDate(null);
                }}
                style={styles.navButton}
              >
                <CustomText style={styles.heatmapNav}>‹</CustomText>
              </TouchableOpacity>
              <CustomText style={styles.cardHeaderTitle}>
                {monthlyHeatmap.monthName}
              </CustomText>
              <TouchableOpacity
                onPress={() => {
                  setMonthOffset(prev => prev + 1);
                  setSelectedTileDate(null);
                }}
                style={styles.navButton}
              >
                <CustomText style={styles.heatmapNav}>›</CustomText>
              </TouchableOpacity>
            </View>

            {/* Heatmap Grid - Date number displays directly OVER the tapped tile */}
            <View style={styles.heatmapGrid}>
              {monthlyHeatmap.squares.map((sq, idx) => {
                const isSelected = selectedTileDate === sq.dateStr;
                const isDarkBg = sq.percent > 50;

                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.7}
                    style={[
                      styles.heatSquare,
                      { backgroundColor: getSquareColor(sq.percent) },
                      isSelected && styles.heatSquareSelected,
                    ]}
                    onPress={() =>
                      setSelectedTileDate(isSelected ? null : sq.dateStr)
                    }
                  >
                    {isSelected && (
                      <CustomText
                        style={[
                          styles.tileDateOverlayText,
                          isDarkBg ? styles.textWhite : styles.textDark,
                        ]}
                      >
                        {sq.day}
                      </CustomText>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.heatLegendRow}>
              <CustomText style={styles.legendText}>0% Done</CustomText>
              <View style={styles.legendColors}>
                <View
                  style={[styles.legendBox, { backgroundColor: '#E6F4F1' }]}
                />
                <View
                  style={[styles.legendBox, { backgroundColor: '#99F6E4' }]}
                />
                <View
                  style={[styles.legendBox, { backgroundColor: '#2DD4BF' }]}
                />
                <View
                  style={[styles.legendBox, { backgroundColor: '#0D9488' }]}
                />
              </View>
              <CustomText style={styles.legendText}>100% Done</CustomText>
            </View>
          </View>

          {/* INDIVIDUAL HABIT PROGRESS CARDS */}
          {habits.length > 0 ? (
            <View style={styles.habitProgressGrid}>
              {habits.map(item => {
                const completionPct = getHabitMonthCompletion(item);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.habitProgCard}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('TotalHabits')}
                  >
                    <View style={styles.progCardTop}>
                      <HabitIconBadge
                        iconId={item.icon}
                        iconImageUrl={item.iconImageUrl}
                        size={22}
                      />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <CustomText
                          style={styles.progHabitTitle}
                          numberOfLines={1}
                        >
                          {item.title}
                        </CustomText>
                        <CustomText style={styles.progPctText}>
                          {completionPct}% done
                        </CustomText>
                      </View>
                    </View>
                    <View style={styles.progTrack}>
                      <View
                        style={[
                          styles.progFill,
                          { width: `${completionPct}%` },
                        ]}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.noHabitsBox}>
              <CustomText style={styles.noHabitsText}>
                No habits added yet. Create habits to view individual progress
                reports!
              </CustomText>
            </View>
          )}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
};

export default ProgressScreen;

const styles = StyleSheet.create({
  mainSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  cardHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.6,
    marginBottom: 14,
  },
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 10,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barPercentText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D9488',
    marginBottom: 4,
  },
  barTrack: {
    width: 18,
    height: 90,
    backgroundColor: '#E2E8F0',
    borderRadius: 9,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#0D9488',
    borderRadius: 9,
  },
  barDayText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0D9488',
    lineHeight: 32, // Explicit line height
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  streakValueTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  streakValueDays: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F97316',
    marginTop: 2,
  },
  heatmapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  navButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  heatmapNav: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0D9488',
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    justifyContent: 'flex-start',
    marginVertical: 10,
  },
  heatSquare: {
    width: 28,
    height: 28,
    // borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heatSquareSelected: {
    borderWidth: 2,
    borderColor: '#0F172A',
    transform: [{ scale: 1.15 }],
    zIndex: 10,
  },
  tileDateOverlayText: {
    fontSize: 11,
    fontWeight: '800',
  },
  textWhite: {
    color: '#FFFFFF',
  },
  textDark: {
    color: '#0F172A',
  },
  heatLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  legendColors: {
    flexDirection: 'row',
    gap: 4,
  },
  legendBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  habitProgressGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  habitProgCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  progCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progHabitTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  progPctText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D9488',
  },
  progTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progFill: {
    height: '100%',
    backgroundColor: '#0D9488',
    borderRadius: 3,
  },
  noHabitsBox: {
    backgroundColor: '#F8FAFC',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  noHabitsText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
});
