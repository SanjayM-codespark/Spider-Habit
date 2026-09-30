import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomText } from './CustomText';
import { colors } from '../theme/color';
import { fonts } from '../theme/fonts';
import ArrowLeftIcon from '../assets/icons/arrowleftblack.svg';

interface AppToolbarProps {
  title: string;
  onBackPress?: () => void;
}

const AppToolbar: React.FC<AppToolbarProps> = ({ title, onBackPress }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 ,marginTop:24}]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBack}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <ArrowLeftIcon width={34} height={34} color={colors.text.primary} />
      </TouchableOpacity>

      <CustomText style={styles.title} numberOfLines={1}>
        {title}
      </CustomText>

      {/* Spacer to keep title centred when there's no right action */}
      <View style={styles.rightPlaceholder} />
    </View>
  );
};

export default AppToolbar;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontFamily: fonts.families.bold,
    color: colors.text.primary,
    marginLeft: 12,
  },
  rightPlaceholder: {
    width: 36,
  },
});
