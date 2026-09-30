import CustomTextInput from '../components/CustomTextInput';
import CustomText from '../components/CustomText';
import React, { useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { ScreenContainer } from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { useFreeTrial } from '../context/FreeTrialContext';
import { habitService } from '../services/habitService';
import { HABIT_ICONS } from '../components/HabitIcons';
import { TopHeader } from '../components/TopHeader';
import { logger } from '../utils/logger';
import { notificationService } from '../services/notificationService';
import { useAlert } from '../context/AlertContext';

const TAG = 'CreateHabitScreen';

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
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
const PERIODS = ['AM', 'PM'];

export const CreateHabitScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const { isExpired } = useFreeTrial();

  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState('Daily');
  const [targetDays, setTargetDays] = useState<string[]>(['Mon']);
  const [goalDetails, setGoalDetails] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('runner');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Custom uploaded icon. `pickedIconUri` gives an instant local preview while
  // the upload is still in flight; `customIconUrl` is the backend path that
  // actually gets persisted on the habit.
  const [pickedIconUri, setPickedIconUri] = useState('');
  const [customIconUrl, setCustomIconUrl] = useState('');
  const [uploadingIcon, setUploadingIcon] = useState(false);

  // Reminder Time State (Hour, Minute, Period)
  const [selectedHour, setSelectedHour] = useState('7');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState('AM');
  const [showTimeModal, setShowTimeModal] = useState(false);

  const reminderTimeDisplay = `${selectedHour}:${selectedMinute} ${selectedPeriod}`;

  // Scroll-to-focused-input support for Goal Details, which sits low enough
  // that the keyboard covers it unless we explicitly scroll it into view.
  const scrollViewRef = useRef<ScrollView>(null);
  const goalDetailsY = useRef(0);

  const scrollToGoalDetails = () => {
    scrollViewRef.current?.scrollTo({ y: goalDetailsY.current - 20, animated: true });
  };

  const toggleDay = (dayId: string) => {
    if (targetDays.includes(dayId)) {
      logger.debug(TAG, `Day deselected: ${dayId}`);
      setTargetDays(targetDays.filter(id => id !== dayId));
    } else {
      logger.debug(TAG, `Day selected: ${dayId}`);
      setTargetDays([...targetDays, dayId]);
    }
  };

  const handlePickCustomIcon = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        // Icons render at ~36dp, so downscale before upload to keep the
        // request small. The backend independently caps the file at 2 MB.
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.8,
      });

      if (result.didCancel) {
        logger.debug(TAG, 'Custom icon picker dismissed by user');
        return;
      }

      if (result.errorCode) {
        logger.warn(TAG, 'Custom icon picker returned an error', result);
        setError('Could not open your photos. Please try again.');
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        logger.warn(TAG, 'Custom icon picker returned no image asset', result);
        return;
      }

      setError('');
      // Show the picked image right away; the badge below it keeps the emoji
      // until the upload resolves.
      setPickedIconUri(asset.uri);
      setUploadingIcon(true);

      const url = await habitService.uploadHabitIcon({
        uri: asset.uri,
        name: asset.fileName ?? 'habit-icon.jpg',
        type: asset.type ?? 'image/jpeg',
      });
      setCustomIconUrl(url);
      logger.info(TAG, 'Custom habit icon uploaded', { url });
    } catch (err: any) {
      logger.error(TAG, 'Custom habit icon upload failed', err);
      setPickedIconUri('');
      setError('Could not upload that image. Please try another one.');
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleRemoveCustomIcon = () => {
    logger.debug(TAG, 'Custom habit icon removed by user');
    setCustomIconUrl('');
    setPickedIconUri('');
  };

  /** Picking a built-in emoji clears the uploaded image so there is no ambiguity. */
  const handleSelectBuiltInIcon = (iconId: string) => {
    if (customIconUrl || pickedIconUri) {
      handleRemoveCustomIcon();
    }
    setSelectedIcon(iconId);
  };

  const handleCreateHabit = async () => {
    setError('');
    logger.info(TAG, 'handleCreateHabit() invoked', {
      title,
      frequency,
      targetDays,
      reminderTime: reminderTimeDisplay,
      goalDetails,
      selectedIcon,
      hasCustomIcon: !!customIconUrl,
      customIconUrl,
    });

    if (!title.trim()) {
      logger.warn(TAG, 'Validation failed — habit name is empty');
      setError('Please enter a habit name');
      return;
    }

    if (!user?.id) {
      logger.warn(TAG, 'Validation failed — no user session');
      setError('User session invalid. Please log in again.');
      return;
    }

    // Free trial ended → no new habits until the user subscribes.
    if (isExpired) {
      logger.warn(TAG, 'Habit creation blocked — free trial expired');
      showAlert(
        'Subscription Required',
        'Your free trial has ended and new habits can no longer be created. Upgrade to Pro to create unlimited habits!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade to Pro', onPress: () => navigation.navigate('Subscription') },
        ]
      );
      return;
    }

    try {
      setLoading(true);

      const existingHabits = await habitService.getHabits(user);
      if (Platform.OS !== 'ios' && existingHabits.length >= 7) {
        setLoading(false);
        showAlert(
          'Habit Limit Reached',
          'You can only track up to 7 habits on the free plan. Upgrade to Pro to add unlimited habits!',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade to Pro', onPress: () => navigation.navigate('Subscription') }
          ]
        );
        return;
      }

      const created = await habitService.createHabit(user, {
        title: title.trim(),
        frequency,
        targetDays,
        reminderTime: reminderTimeDisplay,
        goalDetails: goalDetails.trim() || 'Daily goal',
        icon: selectedIcon,
        iconImageUrl: customIconUrl,
      });
      logger.info(TAG, 'Habit created and saved', { id: created.id, title: created.title });

      // Schedule notification reminder for the new habit
      try {
        await notificationService.requestPermission();
        notificationService.scheduleHabitReminder(created);
        logger.info(TAG, 'Notification reminder scheduled for new habit', { id: created.id });
      } catch (notifError) {
        logger.error(TAG, 'Failed to schedule notification', notifError);
      }

      // Reset form and navigate back to Dashboard
      setTitle('');
      setGoalDetails('');
      setCustomIconUrl('');
      setPickedIconUri('');
      navigation.navigate('Dashboard');
    } catch (err: any) {
      logger.error(TAG, 'Failed to create habit', err);
      setError('Failed to create habit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer backgroundColor="#39C4B6" barStyle="light-content">
      {/* Top Header */}
      <TopHeader
        title="CREATE NEW HABIT"
        onBack={() => navigation.goBack()}
      />

      {/* Main White Sheet — outer plain View so button is never keyboard-pushed */}
      <View style={styles.mainSheet}>
        {/* KeyboardAvoidingView: use 'padding' on Android so the ScrollView
            can scroll focused inputs above the keyboard. 'height' breaks on
            Android 15 because adjustResize is disabled in edge-to-edge mode. */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior="padding"
        >
          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {error ? (
              <View style={styles.errorBox}>
                <CustomText style={styles.errorText}>{error}</CustomText>
              </View>
            ) : null}

            {/* Habit Name Input */}
            <View style={styles.inputGroup}>
              <CustomText style={styles.label}>Habit Name</CustomText>
              <CustomTextInput
                style={styles.textInput}
                placeholder="e.g. Run 5km, Read Books, Drink Water"
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Set Frequency (Daily, Weekly, Specific days, Monthly, Custom) */}
            <View style={styles.inputGroup}>
              <View style={styles.rowBetween}>
                <CustomText style={styles.label}>Set Frequency</CustomText>
                <CustomText style={styles.subBadge}>{targetDays.length} days selected</CustomText>
              </View>

              {/* Frequency Options Scroll */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.freqScroll}
              >
                {FREQUENCY_OPTIONS.map((opt, idx) => {
                  const isSelected = frequency === opt;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.freqPill,
                        isSelected && styles.freqPillActive,
                      ]}
                      onPress={() => setFrequency(opt)}
                    >
                      <CustomText
                        style={[
                          styles.freqText,
                          isSelected && styles.freqTextActive,
                        ]}
                      >
                        {opt}
                      </CustomText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Day Selector Pills (Unique ID Fix for Tue/Thu and Sat/Sun) */}
              <View style={styles.daysSection}>
                <CustomText style={styles.daysSubtitle}>Select Days:</CustomText>
                <View style={styles.daysContainer}>
                  {WEEK_DAYS.map(dayItem => {
                    const isSelected = targetDays.includes(dayItem.id);
                    return (
                      <TouchableOpacity
                        key={dayItem.id}
                        style={[
                          styles.dayButton,
                          isSelected && styles.dayButtonSelected,
                        ]}
                        onPress={() => toggleDay(dayItem.id)}
                      >
                        <CustomText
                          style={[
                            styles.dayButtonText,
                            isSelected && styles.dayButtonTextSelected,
                          ]}
                        >
                          {dayItem.label}
                        </CustomText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Reminder Time Dropdown Selector (1-12 & AM/PM) */}
            <View style={styles.inputGroup}>
              <CustomText style={styles.label}>Reminder Time</CustomText>
              <TouchableOpacity
                style={styles.dropdownInput}
                activeOpacity={0.8}
                onPress={() => setShowTimeModal(true)}
              >
                <CustomText style={styles.dropdownValueText}>
                  ⏰ {reminderTimeDisplay}
                </CustomText>
                <CustomText style={styles.dropdownArrow}>▼</CustomText>
              </TouchableOpacity>
            </View>

            {/* Goal Details Input */}
            <View
              style={styles.inputGroup}
              onLayout={(e) => { goalDetailsY.current = e.nativeEvent.layout.y; }}
            >
              <CustomText style={styles.label}>Goal Details</CustomText>
              <CustomTextInput
                style={styles.textInput}
                placeholder="e.g. 5 km run, 30 mins, 8 glasses"
                placeholderTextColor="#94A3B8"
                value={goalDetails}
                onChangeText={setGoalDetails}
                onFocus={scrollToGoalDetails}
              />
            </View>

            {/* Icon Selector Grid (Perfectly Centered Box Layout) */}
            <View style={styles.inputGroup}>
              <CustomText style={styles.label}>Select Icon</CustomText>
              <View style={styles.iconGrid}>
                {HABIT_ICONS.map(item => {
                  const isSelected = selectedIcon === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.iconBox,
                        isSelected && styles.iconBoxSelected,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => handleSelectBuiltInIcon(item.id)}
                    >
                      <CustomText style={styles.iconEmoji}>{item.emoji}</CustomText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Custom Icon Upload — optional image that replaces the emoji above */}
            <View style={styles.inputGroup}>
              <CustomText style={styles.label}>Upload Icon</CustomText>

              {pickedIconUri ? (
                <View style={styles.uploadRow}>
                  <View style={styles.uploadPreviewBox}>
                    <Image
                      source={{ uri: pickedIconUri }}
                      style={styles.uploadPreviewImage}
                      resizeMode="cover"
                    />
                    {uploadingIcon ? (
                      <View style={styles.uploadSpinner}>
                        <ActivityIndicator color="#FFFFFF" />
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.uploadActions}>
                    <TouchableOpacity
                      style={styles.uploadActionBtn}
                      activeOpacity={0.8}
                      onPress={handlePickCustomIcon}
                      disabled={uploadingIcon}
                    >
                      <Ionicons name="swap-horizontal" size={16} color="#0D9488" />
                      <CustomText style={styles.uploadActionText}>
                        {uploadingIcon ? 'Uploading…' : 'Change'}
                      </CustomText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.uploadActionBtn, styles.uploadActionBtnDanger]}
                      activeOpacity={0.8}
                      onPress={handleRemoveCustomIcon}
                      disabled={uploadingIcon}
                    >
                      <Ionicons name="trash-outline" size={16} color="#DC2626" />
                      <CustomText
                        style={[styles.uploadActionText, styles.uploadActionTextDanger]}
                      >
                        Remove
                      </CustomText>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadBox}
                  activeOpacity={0.8}
                  onPress={handlePickCustomIcon}
                >
                  <Ionicons name="image-outline" size={26} color="#0D9488" />
                  <CustomText style={styles.uploadBoxTitle}>
                    Upload from Gallery
                  </CustomText>
                  <CustomText style={styles.uploadBoxHint}>
                    JPG, PNG or WEBP · up to 2 MB
                  </CustomText>
                </TouchableOpacity>
              )}

              <CustomText style={styles.uploadFootnote}>
                Optional — an uploaded image replaces the icon you selected above.
              </CustomText>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Submit Button — outside KeyboardAvoidingView, always stays at bottom */}
        <TouchableOpacity
          style={styles.submitButton}
          activeOpacity={0.8}
          onPress={handleCreateHabit}
          disabled={loading || uploadingIcon}
        >
          {loading || uploadingIcon ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <CustomText style={styles.submitButtonText}>START TRACKING</CustomText>
          )}
        </TouchableOpacity>
      </View>

      {/* Reminder Time Dropdown Modal (1 to 12 and AM/PM Picker) */}
      <Modal
        visible={showTimeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTimeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTimeModal(false)}
        >
          <View style={styles.modalContent}>
            <CustomText style={styles.modalTitle}>Select Reminder Time</CustomText>

            <View style={styles.pickerRow}>
              {/* Hour Column (1 to 12) */}
              <View style={styles.pickerColumn}>
                <CustomText style={styles.pickerHeader}>Hour</CustomText>
                <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
                  {HOURS.map(h => (
                    <TouchableOpacity
                      key={h}
                      style={[
                        styles.pickerItem,
                        selectedHour === h && styles.pickerItemActive,
                      ]}
                      onPress={() => setSelectedHour(h)}
                    >
                      <CustomText
                        style={[
                          styles.pickerItemText,
                          selectedHour === h && styles.pickerItemTextActive,
                        ]}
                      >
                        {h}
                      </CustomText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Minute Column (00, 15, 30, 45) */}
              <View style={styles.pickerColumn}>
                <CustomText style={styles.pickerHeader}>Minute</CustomText>
                <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
                  {MINUTES.map(m => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.pickerItem,
                        selectedMinute === m && styles.pickerItemActive,
                      ]}
                      onPress={() => setSelectedMinute(m)}
                    >
                      <CustomText
                        style={[
                          styles.pickerItemText,
                          selectedMinute === m && styles.pickerItemTextActive,
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
                <View style={{ gap: 6, marginTop: 4 }}>
                  {PERIODS.map(p => (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.pickerItem,
                        selectedPeriod === p && styles.pickerItemActive,
                      ]}
                      onPress={() => setSelectedPeriod(p)}
                    >
                      <CustomText
                        style={[
                          styles.pickerItemText,
                          selectedPeriod === p && styles.pickerItemTextActive,
                        ]}
                      >
                        {p}
                      </CustomText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Confirm Button */}
            <TouchableOpacity
              style={styles.modalDoneButton}
              activeOpacity={0.8}
              onPress={() => setShowTimeModal(false)}
            >
              <CustomText style={styles.modalDoneText}>DONE ({reminderTimeDisplay})</CustomText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScreenContainer>
  );
};

export default CreateHabitScreen;

const styles = StyleSheet.create({
  mainSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderColor: '#F87171',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 14,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 22,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  subBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0D9488',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0F172A',
  },
  freqScroll: {
    gap: 8,
    paddingBottom: 8,
  },
  freqPill: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  freqPillActive: {
    backgroundColor: '#E6F4F1',
    borderColor: '#0D9488',
  },
  freqText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  freqTextActive: {
    color: '#0D9488',
    fontWeight: '800',
  },
  daysSection: {
    marginTop: 10,
  },
  daysSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: '#0D9488',
  },
  dayButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  dayButtonTextSelected: {
    color: '#FFFFFF',
  },
  dropdownInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownValueText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D9488',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#64748B',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-start',
  },
  iconBox: {
    width: '28%',
    height: 70,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  iconBoxSelected: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  iconEmoji: {
    fontSize: 32,
    lineHeight: 42,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  /* Custom Icon Upload Styles */
  uploadBox: {
    height: 132,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#0D9488',
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    padding: 16,
  },
  uploadBoxTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0D9488',
  },
  uploadBoxHint: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  uploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  uploadPreviewBox: {
    width: 84,
    height: 84,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#0D9488',
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadPreviewImage: {
    width: '100%',
    height: '100%',
  },
  uploadSpinner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadActions: {
    flex: 1,
    gap: 10,
  },
  uploadActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0D9488',
    backgroundColor: '#E6F4F1',
  },
  uploadActionBtnDanger: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  uploadActionText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0D9488',
  },
  uploadActionTextDanger: {
    color: '#DC2626',
  },
  uploadFootnote: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: '#0D9488',
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20, // Add bottom margin so it doesn't hug the bottom edge
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  /* Reminder Time Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 16,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: 180,
    marginBottom: 16,
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  pickerHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
  },
  pickerScroll: {
    width: '100%',
  },
  pickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 2,
    backgroundColor: '#F8FAFC',
  },
  pickerItemActive: {
    backgroundColor: '#0D9488',
  },
  pickerItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  pickerItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  modalDoneButton: {
    backgroundColor: '#0D9488',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDoneText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  headerLeft: {
    width: 36,
  },
  headerRight: {
    width: 30,
    alignItems: 'flex-end',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
});
