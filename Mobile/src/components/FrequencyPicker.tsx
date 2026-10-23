import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import CustomText from './CustomText';
import {
  FREQUENCY_OPTIONS,
  WEEK_DAYS,
  MONTH_DATES,
  FrequencyState,
  selectFrequency,
  toggleWeekday,
  toggleWeekdayFromDaily,
  selectMonthDate,
  describeSelection,
  parseMonthDay,
} from '../utils/habitFrequency';

interface Props {
  value: FrequencyState;
  onChange: (next: FrequencyState) => void;
}

const HINTS: Record<string, string> = {
  Daily: 'Repeats every day. Tap a day to skip it.',
  Weekly: 'Repeats once a week. Pick the day.',
  'Specific days': 'Pick the days of the week it repeats.',
  Monthly: 'Repeats once a month. Pick the date.',
  Custom: 'Pick any combination of days.',
};

export const FrequencyPicker: React.FC<Props> = ({ value, onChange }) => {
  const { frequency, targetDays } = value;
  const selectedDate = targetDays.map(parseMonthDay).find(d => d !== null) ?? null;

  const handleDayPress = (dayId: string) => {
    if (frequency === 'Daily') {
      onChange(toggleWeekdayFromDaily(dayId));
      return;
    }
    const next = toggleWeekday(value, dayId);
    if (next) onChange(next);
  };

  return (
    <View>
      <View style={styles.rowBetween}>
        <CustomText style={styles.label}>Set Frequency</CustomText>
        <CustomText style={styles.subBadge}>{describeSelection(value)}</CustomText>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.freqScroll}
      >
        {FREQUENCY_OPTIONS.map(opt => {
          const isSelected = frequency === opt;
          return (
            <TouchableOpacity
              key={opt}
              style={[styles.freqPill, isSelected && styles.freqPillActive]}
              onPress={() => onChange(selectFrequency(opt, targetDays))}
            >
              <CustomText style={[styles.freqText, isSelected && styles.freqTextActive]}>
                {opt}
              </CustomText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.daysSection}>
        <CustomText style={styles.daysSubtitle}>
          {frequency === 'Monthly' ? 'Select Date:' : 'Select Days:'} {HINTS[frequency]}
        </CustomText>

        {frequency === 'Monthly' ? (
          <View style={styles.dateGrid}>
            {MONTH_DATES.map(date => {
              const isSelected = selectedDate === date;
              return (
                <TouchableOpacity
                  key={date}
                  style={[styles.dateButton, isSelected && styles.dayButtonSelected]}
                  onPress={() => onChange(selectMonthDate(date))}
                >
                  <CustomText
                    style={[styles.dayButtonText, isSelected && styles.dayButtonTextSelected]}
                  >
                    {date}
                  </CustomText>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.daysContainer}>
            {WEEK_DAYS.map(dayItem => {
              const isSelected = targetDays.includes(dayItem.id);
              return (
                <TouchableOpacity
                  key={dayItem.id}
                  style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
                  onPress={() => handleDayPress(dayItem.id)}
                >
                  <CustomText
                    style={[styles.dayButtonText, isSelected && styles.dayButtonTextSelected]}
                  >
                    {dayItem.label}
                  </CustomText>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        {frequency === 'Monthly' && selectedDate !== null && selectedDate > 28 && (
          <CustomText style={styles.note}>
            In shorter months this reminder runs on the last day of the month.
          </CustomText>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  subBadge: { fontSize: 12, fontWeight: '600', color: '#d60201' },
  freqScroll: { gap: 8, paddingBottom: 8 },
  freqPill: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  freqPillActive: { backgroundColor: '#FDECEC', borderColor: '#d60201' },
  freqText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  freqTextActive: { color: '#d60201', fontWeight: '800' },
  daysSection: { marginTop: 10 },
  daysSubtitle: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 8 },
  daysContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dateButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonSelected: { backgroundColor: '#d60201' },
  dayButtonText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  dayButtonTextSelected: { color: '#FFFFFF' },
  note: { fontSize: 11, color: '#94A3B8', marginTop: 8 },
});

export default FrequencyPicker;
