import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { CountryPicker } from 'react-native-country-codes-picker';
import CustomText from './CustomText';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface CountryCodePickerProps {
  value: string;
  onChange: (code: string) => void;
}

const CountryCodePicker: React.FC<CountryCodePickerProps> = ({ value, onChange }) => {
  const [show, setShow] = useState(false);

  return (
    <View>
      <TouchableOpacity
        style={styles.pickerButton}
        activeOpacity={0.8}
        onPress={() => setShow(true)}
      >
        <CustomText style={styles.pickerText}>{value}</CustomText>
        <Ionicons name="chevron-down" size={14} color="#64748B" />
      </TouchableOpacity>

      <CountryPicker
        show={show}
        lang="en"
        initialState={value}
        pickerButtonOnPress={(item) => {
          onChange(item.dial_code);
          setShow(false);
        }}
        onBackdropPress={() => setShow(false)}
        style={{
          modal: {
            height: '70%',
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          },
          backdrop: {
            backgroundColor: 'rgba(0,0,0,0.5)',
          },
          textInput: {
            backgroundColor: '#F8FAFC',
            borderWidth: 1,
            borderColor: '#E2E8F0',
            borderRadius: 12,
            height: 48,
            paddingHorizontal: 14,
            fontSize: 15,
            color: '#0F172A',
          },
          countryButtonStyles: {
            height: 52,
            borderBottomWidth: 1,
            borderBottomColor: '#F1F5F9',
          },
          dialCode: {
            fontSize: 14,
            fontWeight: '700',
            color: '#0D9488',
          },
          countryName: {
            fontSize: 14,
            color: '#334155',
          },
          flag: {
            fontSize: 22,
          },
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  pickerButton: {
    flex: 0,
    width: 85,
    marginRight: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  pickerText: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '700',
  },
});

export default CountryCodePicker;
