import React, { useState } from 'react';
import {
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CustomTextInput from './CustomTextInput';

/**
 * Password field with an eye icon that shows / hides the typed text.
 * Takes the same props as a text input; `style` styles the input itself.
 */
export const PasswordInput: React.FC<TextInputProps> = ({ style, ...props }) => {
  const [visible, setVisible] = useState(false);

  return (
    <View>
      <CustomTextInput
        {...props}
        style={[style, styles.inputWithIcon]}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity
        style={styles.eyeButton}
        onPress={() => setVisible(prev => !prev)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
      >
        <Ionicons
          name={visible ? 'eye-off-outline' : 'eye-outline'}
          size={22}
          color="#64748B"
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  inputWithIcon: { paddingRight: 48 },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
});

export default PasswordInput;
