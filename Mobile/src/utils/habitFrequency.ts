/**
 * Rules tying a habit's Frequency to its target days.
 *
 * targetDays holds weekday ids ('Mon'..'Sun') for every frequency except
 * Monthly, which stores a single day-of-month as 'D<1-31>' (e.g. 'D15').
 */

export const FREQUENCY_OPTIONS = ['Daily', 'Weekly', 'Specific days', 'Monthly', 'Custom'];

export const WEEK_DAYS = [
  { id: 'Mon', label: 'M', fullName: 'Monday' },
  { id: 'Tue', label: 'T', fullName: 'Tuesday' },
  { id: 'Wed', label: 'W', fullName: 'Wednesday' },
  { id: 'Thu', label: 'T', fullName: 'Thursday' },
  { id: 'Fri', label: 'F', fullName: 'Friday' },
  { id: 'Sat', label: 'S', fullName: 'Saturday' },
  { id: 'Sun', label: 'S', fullName: 'Sunday' },
];

export const ALL_DAY_IDS = WEEK_DAYS.map(d => d.id);
export const MONTH_DATES = Array.from({ length: 31 }, (_, i) => i + 1);

export const monthDayId = (date: number) => `D${date}`;
export const parseMonthDay = (id: string): number | null => {
  const match = /^D(\d{1,2})$/.exec(id);
  if (!match) return null;
  const date = Number(match[1]);
  return date >= 1 && date <= 31 ? date : null;
};

const isWeekdayId = (id: string) => ALL_DAY_IDS.includes(id);
const weekdaysOf = (days: string[]) => days.filter(isWeekdayId);

export interface FrequencyState {
  frequency: string;
  targetDays: string[];
}

export const DEFAULT_FREQUENCY_STATE: FrequencyState = {
  frequency: 'Daily',
  targetDays: [...ALL_DAY_IDS],
};

/** Days to use right after the user switches to a frequency. */
export const selectFrequency = (frequency: string, current: string[]): FrequencyState => {
  const weekdays = weekdaysOf(current);
  switch (frequency) {
    case 'Daily':
      return { frequency, targetDays: [...ALL_DAY_IDS] };
    case 'Weekly':
      return { frequency, targetDays: [weekdays[0] ?? 'Mon'] };
    case 'Specific days':
      // Every day selected would just be Daily, so start from a sensible subset.
      return {
        frequency,
        targetDays:
          weekdays.length > 0 && weekdays.length < 7 ? weekdays : ['Mon', 'Wed', 'Fri'],
      };
    case 'Monthly': {
      const existing = current.map(parseMonthDay).find(d => d !== null);
      return { frequency, targetDays: [monthDayId(existing ?? 1)] };
    }
    default: // Custom
      return { frequency, targetDays: weekdays.length > 0 ? weekdays : [...ALL_DAY_IDS] };
  }
};

/** Apply a tap on a weekday button. Returns null when the tap is not allowed. */
export const toggleWeekday = (state: FrequencyState, dayId: string): FrequencyState | null => {
  const { frequency, targetDays } = state;

  if (frequency === 'Weekly') return { frequency, targetDays: [dayId] };

  const selected = targetDays.includes(dayId);
  if (selected && targetDays.length === 1) return null; // keep at least one day

  const next = selected ? targetDays.filter(d => d !== dayId) : [...targetDays, dayId];
  const ordered = ALL_DAY_IDS.filter(d => next.includes(d));

  // Selecting all 7 days is just Daily.
  if (ordered.length === 7 && frequency === 'Specific days') {
    return { frequency: 'Daily', targetDays: ordered };
  }
  return { frequency, targetDays: ordered };
};

/** Tapping a day while on Daily means "not every day any more". */
export const toggleWeekdayFromDaily = (dayId: string): FrequencyState => ({
  frequency: 'Specific days',
  targetDays: ALL_DAY_IDS.filter(d => d !== dayId),
});

export const selectMonthDate = (date: number): FrequencyState => ({
  frequency: 'Monthly',
  targetDays: [monthDayId(date)],
});

export const describeSelection = ({ frequency, targetDays }: FrequencyState): string => {
  if (frequency === 'Monthly') {
    const date = targetDays.map(parseMonthDay).find(d => d !== null);
    return date ? `Day ${date} of every month` : 'Pick a date';
  }
  const count = weekdaysOf(targetDays).length;
  if (count === 7) return 'Every day';
  return `${count} ${count === 1 ? 'day' : 'days'} selected`;
};

/** Returns an error message, or null when the combination is valid. */
export const validateFrequency = ({ frequency, targetDays }: FrequencyState): string | null => {
  if (frequency === 'Monthly') {
    return targetDays.some(d => parseMonthDay(d) !== null) ? null : 'Please pick a date of the month';
  }
  const count = weekdaysOf(targetDays).length;
  if (count === 0) return 'Please select at least one day';
  if (frequency === 'Weekly' && count !== 1) return 'Weekly habits need exactly one day';
  if (frequency === 'Daily' && count !== 7) return 'Daily habits run on all 7 days';
  return null;
};

/** Repairs habits saved before these rules existed (e.g. Daily with one day). */
export const normalizeFrequency = (frequency: string, targetDays: string[] | null | undefined): FrequencyState => {
  const days = targetDays ?? [];
  const state = { frequency: frequency || 'Daily', targetDays: days };
  if (validateFrequency(state) === null) return state;

  const weekdays = ALL_DAY_IDS.filter(d => days.includes(d));
  if (state.frequency === 'Monthly') return selectFrequency('Monthly', days);
  if (weekdays.length === 0) return { ...DEFAULT_FREQUENCY_STATE };
  if (weekdays.length === 7) return { frequency: 'Daily', targetDays: weekdays };
  if (state.frequency === 'Weekly') return { frequency: 'Weekly', targetDays: [weekdays[0]] };
  return { frequency: 'Specific days', targetDays: weekdays };
};
