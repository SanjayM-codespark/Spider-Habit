import CustomText from '../components/CustomText';
import CustomTextInput from '../components/CustomTextInput';
import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { TopHeader } from '../components/TopHeader';
import { useAuth } from '../context/AuthContext';
import { habitService } from '../services/habitService';
import { Habit } from '../database/sqliteSchema';
import { HabitIconBadge, HABIT_ICONS } from '../components/HabitIcons';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { notificationService } from '../services/notificationService';
import { useAlert } from '../context/AlertContext';

interface Props {
  navigation: any;
}

const FREQUENCY_OPTIONS = [
  'Daily',
  'Weekly',
  'Specific days',
  'Monthly',
  'Custom',
];

const WEEK_DAYS = [
  { id: 'Mon', label: 'M', fullName: 'Monday' },
  { id: 'Tue', label: 'T', fullName: 'Tuesday' },
  { id: 'Wed', label: 'W', fullName: 'Wednesday' },
  { id: 'Thu', label: 'T', fullName: 'Thursday' },
  { id: 'Fri', label: 'F', fullName: 'Friday' },
  { id: 'Sat', label: 'S', fullName: 'Saturday' },
  { id: 'Sun', label: 'S', fullName: 'Sunday' },
];

const HOURS = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
const MINUTES = Array.from(
  { length: 60 },
  (_, i) => i.toString().padStart(2, '0'),
);
const PERIODS = ['AM', 'PM'];

/** Parse a stored reminder time like "7:00 AM" back into picker values. */
const parseReminderTime = (value?: string) => {
  const match = value?.trim().match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (match) {
    return {
      hour: String(parseInt(match[1], 10)),
      minute: match[2],
      period: match[3].toUpperCase(),
    };
  }
  return { hour: '7', minute: '00', period: 'AM' };
};

export const ManageHabitsScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);

  // Edit modal state
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editGoal, setEditGoal] = useState('');
  const [editIcon, setEditIcon] = useState('runner');
  const [editFrequency, setEditFrequency] = useState('Daily');
  const [editTargetDays, setEditTargetDays] = useState<string[]>(['Mon']);
  const [editHour, setEditHour] = useState('7');
  const [editMinute, setEditMinute] = useState('00');
  const [editPeriod, setEditPeriod] = useState('AM');
  const [showEditTimeModal, setShowEditTimeModal] = useState(false);
  const { showAlert } = useAlert();

  const editReminderDisplay = `${editHour}:${editMinute} ${editPeriod}`;

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        habitService.getHabits(user).then(setHabits);
      }
    }, [user]),
  );

  const openEdit = (habit: Habit) => {
    const parsed = parseReminderTime(habit.reminderTime);
    setEditingHabit(habit);
    setEditTitle(habit.title);
    setEditGoal(habit.goalDetails || '');
    setEditIcon(habit.icon);
    setEditFrequency(habit.frequency || 'Daily');
    setEditTargetDays(habit.targetDays?.length ? habit.targetDays : ['Mon']);
    setEditHour(parsed.hour);
    setEditMinute(parsed.minute);
    setEditPeriod(parsed.period);
  };

  const toggleEditDay = (dayId: string) => {
    setEditTargetDays(prev =>
      prev.includes(dayId)
        ? prev.filter(id => id !== dayId)
        : [...prev, dayId],
    );
  };

  const handleSaveEdit = async () => {
    if (!editingHabit || !user?.id) return;
    if (!editTitle.trim()) {
      showAlert('Error', 'Habit name cannot be empty.');
      return;
    }
    const updated = await habitService.updateHabit(
      user,
      editingHabit.id,
      {
        title: editTitle.trim(),
        goalDetails: editGoal.trim(),
        icon: editIcon,
        frequency: editFrequency,
        targetDays: editTargetDays,
        reminderTime: editReminderDisplay,
      },
    );
    // Reschedule notification with updated habit data
    const editedHabit = updated.find(h => h.id === editingHabit.id);
    if (editedHabit) {
      notificationService.scheduleHabitReminder(editedHabit);
    }
    setHabits(updated);
    setEditingHabit(null);
  };

  const handleDelete = (habit: Habit) => {
    showAlert(
      'Delete Habit',
      `Are you sure you want to delete "${habit.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return;
            // Cancel the scheduled notification for this habit
            notificationService.cancelHabitReminder(habit.id);
            const updated = await habitService.deleteHabit(user, habit.id);
            setHabits(updated);
          },
        },
      ],
    );
  };

  return (
    <ScreenContainer backgroundColor="#39C4B6" barStyle="light-content">
      <TopHeader title="MY HABITS" onBack={() => navigation.goBack()} />

      {/* White Sheet */}
      <View style={styles.mainSheet}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {habits.length === 0 ? (
            <View style={styles.emptyState}>
              <CustomText style={styles.emptyEmoji}>📭</CustomText>
              <CustomText style={styles.emptyTitle}>No Habits Yet</CustomText>
              <CustomText style={styles.emptySubtitle}>
                Go to the Create tab to add your first habit!
              </CustomText>
            </View>
          ) : (
            habits.map(habit => (
              <View key={habit.id} style={styles.habitCard}>
                <View style={styles.habitLeft}>
                  <HabitIconBadge
                    iconId={habit.icon}
                    iconImageUrl={habit.iconImageUrl}
                    size={32}
                    style={styles.badgeSpacing}
                  />
                  <View style={styles.habitInfo}>
                    <CustomText style={styles.habitTitle}>
                      {habit.title}
                    </CustomText>
                    <CustomText style={styles.habitGoal}>
                      {habit.goalDetails || 'No goal set'}
                    </CustomText>
                    <CustomText style={styles.habitFreq}>
                      🔁 {habit.frequency} · 🔥 {habit.streak} day streak
                    </CustomText>
                  </View>
                </View>
                <View style={styles.habitActions}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => openEdit(habit)}
                  >
                    <Ionicons name="pencil-outline" size={18} color="#0D9488" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(habit)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* Edit Habit Modal */}
      <Modal
        visible={!!editingHabit}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingHabit(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <CustomText style={styles.modalTitle}>EDIT HABIT</CustomText>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
            >
              {/* Habit Name */}
              <CustomText style={styles.modalLabel}>Habit Name</CustomText>
              <CustomTextInput
                style={styles.modalInput}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Habit name"
                placeholderTextColor="#94A3B8"
              />

              {/* Frequency */}
              <View style={styles.editRowBetween}>
                <CustomText style={styles.modalLabel}>Set Frequency</CustomText>
                <CustomText style={styles.editSubBadge}>
                  {editTargetDays.length} days selected
                </CustomText>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.editFreqScroll}
              >
                {FREQUENCY_OPTIONS.map((opt, idx) => {
                  const isSelected = editFrequency === opt;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.editFreqPill,
                        isSelected && styles.editFreqPillActive,
                      ]}
                      onPress={() => setEditFrequency(opt)}
                    >
                      <CustomText
                        style={[
                          styles.editFreqText,
                          isSelected && styles.editFreqTextActive,
                        ]}
                      >
                        {opt}
                      </CustomText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Days */}
              <CustomText style={styles.editDaysSubtitle}>
                Select Days:
              </CustomText>
              <View style={styles.editDaysContainer}>
                {WEEK_DAYS.map(dayItem => {
                  const isSelected = editTargetDays.includes(dayItem.id);
                  return (
                    <TouchableOpacity
                      key={dayItem.id}
                      style={[
                        styles.editDayButton,
                        isSelected && styles.editDayButtonSelected,
                      ]}
                      onPress={() => toggleEditDay(dayItem.id)}
                    >
                      <CustomText
                        style={[
                          styles.editDayButtonText,
                          isSelected && styles.editDayButtonTextSelected,
                        ]}
                      >
                        {dayItem.label}
                      </CustomText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Reminder Time */}
              <CustomText style={styles.editLabelSpaced}>
                Reminder Time
              </CustomText>
              <TouchableOpacity
                style={styles.editDropdownInput}
                activeOpacity={0.8}
                onPress={() => setShowEditTimeModal(true)}
              >
                <CustomText style={styles.editDropdownValueText}>
                  ⏰ {editReminderDisplay}
                </CustomText>
                <CustomText style={styles.editDropdownArrow}>▼</CustomText>
              </TouchableOpacity>

              {/* Goal Details */}
              <CustomText style={styles.editLabelSpaced}>
                Goal Details
              </CustomText>
              <CustomTextInput
                style={styles.modalInput}
                value={editGoal}
                onChangeText={setEditGoal}
                placeholder="e.g. 5km, 30 mins"
                placeholderTextColor="#94A3B8"
              />

              {/* Icon */}
              <CustomText style={styles.editLabelSpaced}>
                Select Icon
              </CustomText>
              <View style={styles.editIconGrid}>
                {HABIT_ICONS.map(item => {
                  const isSelected = editIcon === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.editIconBox,
                        isSelected && styles.editIconBoxSelected,
                      ]}
                      onPress={() => setEditIcon(item.id)}
                    >
                      <CustomText style={styles.editIconEmoji}>
                        {item.emoji}
                      </CustomText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditingHabit(null)}
              >
                <CustomText style={styles.cancelBtnText}>CANCEL</CustomText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit}>
                <CustomText style={styles.saveBtnText}>SAVE</CustomText>
              </TouchableOpacity>
            </View>

            {/* Reminder Time Picker Overlay (inside the edit sheet) */}
            {showEditTimeModal && (
              <View style={styles.timeOverlay}>
                <View style={styles.timeModalCard}>
                  <CustomText style={styles.timeModalTitle}>
                    Select Reminder Time
                  </CustomText>

                  <View style={styles.pickerRow}>
                    {/* Hour Column (1 to 12) */}
                    <View style={styles.pickerColumn}>
                      <CustomText style={styles.pickerHeader}>Hour</CustomText>
                      <ScrollView
                        style={styles.pickerScroll}
                        nestedScrollEnabled
                      >
                        {HOURS.map(h => (
                          <TouchableOpacity
                            key={h}
                            style={[
                              styles.pickerItem,
                              editHour === h && styles.pickerItemActive,
                            ]}
                            onPress={() => setEditHour(h)}
                          >
                            <CustomText
                              style={[
                                styles.pickerItemText,
                                editHour === h && styles.pickerItemTextActive,
                              ]}
                            >
                              {h}
                            </CustomText>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>

                    {/* Minute Column (00..59) */}
                    <View style={styles.pickerColumn}>
                      <CustomText style={styles.pickerHeader}>
                        Minute
                      </CustomText>
                      <ScrollView
                        style={styles.pickerScroll}
                        nestedScrollEnabled
                      >
                        {MINUTES.map(m => (
                          <TouchableOpacity
                            key={m}
                            style={[
                              styles.pickerItem,
                              editMinute === m && styles.pickerItemActive,
                            ]}
                            onPress={() => setEditMinute(m)}
                          >
                            <CustomText
                              style={[
                                styles.pickerItemText,
                                editMinute === m && styles.pickerItemTextActive,
                              ]}
                            >
                              {m}
                            </CustomText>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>

                    {/* Period Column (AM / PM) */}
                    <View style={styles.pickerColumn}>
                      <CustomText style={styles.pickerHeader}>AM/PM</CustomText>
                      <View style={styles.pickerPeriodWrap}>
                        {PERIODS.map(p => (
                          <TouchableOpacity
                            key={p}
                            style={[
                              styles.pickerItem,
                              editPeriod === p && styles.pickerItemActive,
                            ]}
                            onPress={() => setEditPeriod(p)}
                          >
                            <CustomText
                              style={[
                                styles.pickerItemText,
                                editPeriod === p &&
                                  styles.pickerItemTextActive,
                              ]}
                            >
                              {p}
                            </CustomText>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.timeModalDone}
                    onPress={() => setShowEditTimeModal(false)}
                  >
                    <CustomText style={styles.timeModalDoneText}>
                      DONE ({editReminderDisplay})
                    </CustomText>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
};

export default ManageHabitsScreen;

const styles = StyleSheet.create({
  mainSheet: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: { padding: 16, paddingBottom: 40 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 56, marginBottom: 16, lineHeight: 64 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  habitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  habitLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  badgeSpacing: { marginRight: 12 },
  habitInfo: { flex: 1 },
  habitTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  habitGoal: { fontSize: 13, color: '#64748B', marginBottom: 2 },
  habitFreq: { fontSize: 12, color: '#0D9488', fontWeight: '600' },
  habitActions: { flexDirection: 'row', gap: 8 },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Edit Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
    maxHeight: '92%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 16,
  },
  modalScroll: { marginBottom: 12 },
  // Frequency pills
  editRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editSubBadge: { fontSize: 12, fontWeight: '600', color: '#0D9488' },
  editFreqScroll: { gap: 8, paddingBottom: 8 },
  editFreqPill: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  editFreqPillActive: {
    backgroundColor: '#E6F4F1',
    borderColor: '#0D9488',
  },
  editFreqText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  editFreqTextActive: { color: '#0D9488', fontWeight: '800' },
  // Day selector
  editDaysSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
    marginTop: 6,
  },
  editDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  editDayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editDayButtonSelected: { backgroundColor: '#0D9488' },
  editDayButtonText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  editDayButtonTextSelected: { color: '#FFFFFF' },
  // Label + dropdown for reminder time
  editLabelSpaced: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    marginTop: 4,
  },
  editDropdownInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editDropdownValueText: { fontSize: 15, fontWeight: '700', color: '#0D9488' },
  editDropdownArrow: { fontSize: 12, color: '#64748B' },
  // Icon grid
  editIconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  editIconBox: {
    width: '28%',
    height: 58,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconBoxSelected: { backgroundColor: '#0D9488', borderColor: '#0D9488' },
  editIconEmoji: {
    fontSize: 26,
    lineHeight: 34,
    textAlign: 'center',
    includeFontPadding: false,
  },
  // Reminder time picker overlay
  timeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  timeModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    elevation: 10,
  },
  timeModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 16,
  },
  pickerRow: {
    flexDirection: 'row',
    height: 180,
    marginBottom: 16,
  },
  pickerColumn: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  pickerHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
  },
  pickerScroll: { width: '100%' },
  pickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 2,
    backgroundColor: '#F8FAFC',
  },
  pickerItemActive: { backgroundColor: '#0D9488' },
  pickerItemText: { fontSize: 14, fontWeight: '600', color: '#334155' },
  pickerItemTextActive: { color: '#FFFFFF', fontWeight: '800' },
  pickerPeriodWrap: { gap: 3, marginTop: 2 },
  timeModalDone: {
    backgroundColor: '#0D9488',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeModalDoneText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '800', color: '#64748B' },
  saveBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
});
