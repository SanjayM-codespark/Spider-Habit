import CustomText from '../components/CustomText';
import React from 'react';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { buildPublicUrl } from '../config/apiConfig';

export const HABIT_ICONS = [
  { id: 'runner', emoji: '🏃', label: 'Running' },
  { id: 'book', emoji: '📖', label: 'Reading' },
  { id: 'water', emoji: '🥛', label: 'Water' },
  { id: 'meditation', emoji: '🧘', label: 'Meditation' },
  { id: 'workout', emoji: '💪', label: 'Workout' },
  { id: 'coffee', emoji: '☕', label: 'Coffee' },
  { id: 'food', emoji: '🍎', label: 'Nutrition' },
  { id: 'sleep', emoji: '😴', label: 'Sleep' },
  { id: 'drop', emoji: '💧', label: 'Hydration' },
];

export const getHabitEmoji = (iconId: string): string => {
  const found = HABIT_ICONS.find(i => i.id === iconId);
  return found ? found.emoji : '🎯';
};

interface HabitIconBadgeProps {
  iconId: string;
  /** Backend path of a user-uploaded icon. Falls back to the emoji when empty. */
  iconImageUrl?: string;
  /** Width and height of the badge in dp. */
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Single place that decides how a habit icon looks: an uploaded image when the
 * habit has one, otherwise its built-in emoji. Every screen rendering a habit
 * icon should use this so the fallback stays consistent.
 */
export const HabitIconBadge: React.FC<HabitIconBadgeProps> = ({
  iconId,
  iconImageUrl,
  size = 32,
  style,
}) => {
  const box = { width: size, height: size };

  return (
    <View style={[styles.badge, box, style]}>
      {iconImageUrl ? (
        <Image
          source={{ uri: buildPublicUrl(iconImageUrl) }}
          style={box}
          resizeMode="cover"
        />
      ) : (
        <CustomText
          style={[
            styles.emojiGlyph,
            { fontSize: size * 0.72, lineHeight: size * 0.95 },
          ]}
        >
          {getHabitEmoji(iconId)}
        </CustomText>
      )}
    </View>
  );
};

interface HabitIconProps {
  iconId: string;
  size?: number;
}

export const HabitIconView: React.FC<HabitIconProps> = ({ iconId, size = 28 }) => {
  return (
    <View style={[styles.iconContainer, { width: size + 12, height: size + 12 }]}>
      <CustomText style={{ fontSize: size }}>{getHabitEmoji(iconId)}</CustomText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiGlyph: {
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
