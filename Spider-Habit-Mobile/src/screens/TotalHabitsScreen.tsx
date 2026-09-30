import CustomText from '../components/CustomText';
import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenContainer } from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { habitService } from '../services/habitService';
import { Habit } from '../database/sqliteSchema';
import { HabitIconBadge } from '../components/HabitIcons';
import { logger } from '../utils/logger';
import Ionicons from 'react-native-vector-icons/Ionicons';

const TAG = 'TotalHabitsScreen';

interface Props {
  navigation: any;
}

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS_SHORT = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
];

export const TotalHabitsScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const loadHabits = async () => {
    if (!user?.id) return;
    logger.info(TAG, 'Loading habits');
    const loaded = await habitService.getHabits(user);
    setHabits(loaded);
  };

  useFocusEffect(
    useCallback(() => {
      loadHabits();
    }, [user?.id]),
  );

  // Today's YYYY-MM-DD
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => today.toISOString().split('T')[0], [today]);

  // Compute 7 days of the target week (Monday - Sunday)
  const weekInfo = useMemo(() => {
    const currentDay = today.getDay(); // 0 is Sun, 1 is Mon...
    const distToMon = currentDay === 0 ? -6 : 1 - currentDay;

    const monday = new Date(today);
    monday.setDate(today.getDate() + distToMon + weekOffset * 7);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dStr = d.toISOString().split('T')[0];
      const isToday = dStr === todayStr;
      const isPast = dStr < todayStr;
      days.push({
        date: d,
        dStr,
        dayLabel: DAYS_SHORT[i],
        dateNum: d.getDate(),
        isToday,
        isPast,
      });
    }

    const first = days[0].date;
    const last = days[6].date;
    const firstMonth = MONTHS_SHORT[first.getMonth()];
    const lastMonth = MONTHS_SHORT[last.getMonth()];
    const rangeTitle =
      firstMonth === lastMonth
        ? `${firstMonth} ${days[0].dateNum} – ${firstMonth} ${days[6].dateNum}`
        : `${firstMonth} ${days[0].dateNum} – ${lastMonth} ${days[6].dateNum}`;

    const subheaderDate = `${MONTHS_SHORT[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`;

    return { days, rangeTitle, subheaderDate };
  }, [today, todayStr, weekOffset]);

  // Handle cell completion toggle
  const handleToggleCell = async (habitId: string, dateStr: string) => {
    if (!user?.id) return;
    logger.info(TAG, `Toggling habit ${habitId} on date ${dateStr}`);
    const updated = await habitService.toggleHabitCompletion(
      user,
      habitId,
      dateStr,
    );
    setHabits(updated);
  };

  // Completion calculation for today
  const completedTodayCount = useMemo(() => {
    return habits.filter(h => h.completedDates?.includes(todayStr)).length;
  }, [habits, todayStr]);

  const todayDisplayShort = useMemo(() => {
    const m = MONTHS_SHORT[today.getMonth()];
    return `${m} ${today.getDate()}`;
  }, [today]);

  // Calculate 30-day completion percentage for progress bar
  const getHabitProgressPct = (habit: Habit): number => {
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

  // Cell width dynamic calculation
  const habitColWidth = isLandscape ? Math.max(220, width * 0.3) : 170;
  const dayColWidth = isLandscape
    ? Math.max(56, (width - habitColWidth - 40) / 7)
    : 56;

  return (
    <ScreenContainer backgroundColor="#FFFFFF" barStyle="dark-content">
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.weekSelector}>
            <TouchableOpacity
              onPress={() => setWeekOffset(prev => prev - 1)}
              style={styles.weekArrowBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <CustomText style={styles.weekArrow}>‹</CustomText>
            </TouchableOpacity>

            <CustomText style={styles.rangeTitle}>
              {weekInfo.rangeTitle}
            </CustomText>

            <TouchableOpacity
              onPress={() => setWeekOffset(prev => prev + 1)}
              style={styles.weekArrowBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <CustomText style={styles.weekArrow}>›</CustomText>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.todayPill}
          activeOpacity={0.7}
          onPress={() => setWeekOffset(0)}
        >
          <CustomText style={styles.todayPillText}>Current Week</CustomText>
        </TouchableOpacity>
      </View>

      {/* Date Subheader */}
      <View style={styles.subHeader}>
        <CustomText style={styles.subHeaderDate}>
          {weekInfo.subheaderDate}
        </CustomText>
      </View>

      {/* Habit Tracker Matrix / Table */}
      <View style={styles.tableWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={[
            styles.scrollContent,
            isLandscape && { minWidth: width - 32 },
          ]}
        >
          <View>
            {/* Table Header Row */}
            <View style={styles.headerRow}>
              {/* Habits Column Header */}
              <View style={[styles.habitHeaderCell, { width: habitColWidth }]} />

              {/* 7 Days Header Cells */}
              {weekInfo.days.map((dayItem, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dayHeaderCell,
                    { width: dayColWidth },
                    dayItem.isToday && styles.todayColHighlight,
                  ]}
                >
                  {dayItem.isToday && (
                    <CustomText style={styles.todayLabel}>Today</CustomText>
                  )}
                  <View
                    style={[
                      styles.dayBadge,
                      dayItem.isToday && styles.dayBadgeToday,
                    ]}
                  >
                    <CustomText
                      style={[
                        styles.dayLabelText,
                        dayItem.isToday && styles.dayLabelTodayText,
                      ]}
                    >
                      {dayItem.dayLabel}
                    </CustomText>
                    <CustomText
                      style={[
                        styles.dateNumText,
                        dayItem.isToday && styles.dateNumTodayText,
                      ]}
                    >
                      {dayItem.dateNum}
                    </CustomText>
                  </View>
                </View>
              ))}
            </View>

            {/* Habit Rows */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {habits.length === 0 ? (
                <View style={[styles.emptyContainer, { width: habitColWidth + dayColWidth * 7 }]}>
                  <CustomText style={styles.emptyEmoji}>🎯</CustomText>
                  <CustomText style={styles.emptyTitle}>
                    No Habits Tracked Yet
                  </CustomText>
                  <CustomText style={styles.emptySubtitle}>
                    Create habits in the Create tab to see them tracked in this weekly matrix!
                  </CustomText>
                  <TouchableOpacity
                    style={styles.createBtn}
                    onPress={() => navigation.navigate('Create')}
                  >
                    <CustomText style={styles.createBtnText}>
                      + CREATE HABIT
                    </CustomText>
                  </TouchableOpacity>
                </View>
              ) : (
                habits.map((habit, rIdx) => {
                  const progressPct = getHabitProgressPct(habit);

                  return (
                    <View
                      key={habit.id}
                      style={[
                        styles.habitRow,
                        rIdx === habits.length - 1 && styles.lastRow,
                      ]}
                    >
                      {/* Left: Habit Info */}
                      <View
                        style={[styles.habitInfoCell, { width: habitColWidth }]}
                      >
                        <View style={styles.habitTitleRow}>
                          <HabitIconBadge
                            iconId={habit.icon}
                            iconImageUrl={habit.iconImageUrl}
                            size={22}
                            style={styles.habitBadge}
                          />
                          <CustomText
                            style={styles.habitTitleText}
                            numberOfLines={1}
                          >
                            {habit.title}{' '}
                            <CustomText style={styles.streakText}>
                              (🔥{habit.streak || 0}d)
                            </CustomText>
                          </CustomText>
                        </View>

                        {/* Progress Bar */}
                        <View style={styles.progressBarTrack}>
                          <View
                            style={[
                              styles.progressBarFill,
                              { width: `${progressPct}%` },
                            ]}
                          />
                        </View>
                      </View>

                      {/* 7 Day Status Cells */}
                      {weekInfo.days.map((dayItem, cIdx) => {
                        const isCompleted = habit.completedDates?.includes(
                          dayItem.dStr,
                        );

                        return (
                          <TouchableOpacity
                            key={cIdx}
                            activeOpacity={0.7}
                            onPress={() =>
                              handleToggleCell(habit.id, dayItem.dStr)
                            }
                            style={[
                              styles.dayCell,
                              { width: dayColWidth },
                              dayItem.isToday && styles.todayColHighlight,
                            ]}
                          >
                            {isCompleted ? (
                              <View style={styles.completedCircle}>
                                <Ionicons
                                  name="checkmark"
                                  size={16}
                                  color="#FFFFFF"
                                />
                              </View>
                            ) : dayItem.isPast ? (
                              <Ionicons
                                name="close"
                                size={22}
                                color="#94A3B8"
                              />
                            ) : (
                              <View style={styles.pendingRing} />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </ScrollView>
      </View>

      {/* Bottom Footer Bar - Summary Only (No Bottom Navigation Bar) */}
      <View style={styles.footerBar}>
        <View style={styles.summarySection}>
          <CustomText style={styles.summaryText}>
            <CustomText style={styles.summaryCount}>
              {completedTodayCount}/{habits.length}
            </CustomText>{' '}
            Habits Completed Today ({todayDisplayShort})
          </CustomText>
        </View>
      </View>
    </ScreenContainer>
  );
};

export default TotalHabitsScreen;

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: '#FFFFFF',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  weekSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekArrowBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  weekArrow: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  rangeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
    marginHorizontal: 4,
  },
  todayPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  todayPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D9488',
  },
  subHeader: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  subHeaderDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  tableWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 6,
  },
  habitHeaderCell: {
    paddingBottom: 4,
  },
  dayHeaderCell: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    paddingBottom: 4,
  },
  todayLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0D9488',
    marginBottom: 2,
  },
  dayBadge: {
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dayBadgeToday: {
    backgroundColor: '#D1EAE5',
  },
  dayLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  dayLabelTodayText: {
    color: '#0F172A',
    fontWeight: '800',
  },
  dateNumText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  dateNumTodayText: {
    color: '#0D9488',
    fontWeight: '800',
  },
  todayColHighlight: {
    backgroundColor: '#F0FDFA',
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    minHeight: 58,
  },
  lastRow: {
    borderBottomWidth: 1,
  },
  habitInfoCell: {
    paddingVertical: 10,
    paddingRight: 12,
    justifyContent: 'center',
  },
  habitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  habitBadge: {
    marginRight: 6,
  },
  habitTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F97316',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0D9488',
    borderRadius: 2,
  },
  dayCell: {
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  completedCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: '#CBD5E1',
    backgroundColor: 'transparent',
  },
  footerBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'flex-end',
  },
  summarySection: {
    alignSelf: 'flex-end',
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  summaryCount: {
    color: '#0D9488',
    fontWeight: '800',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
    maxWidth: 280,
  },
  createBtn: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
