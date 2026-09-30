import CustomText from '../components/CustomText';
import React from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppLogo } from '../components/AppLogo';
import { HabitIllustration } from '../components/HabitIllustration';

type AuthStackParamList = {
  Welcome: undefined;
  Register: undefined;
  Login: undefined;
};

type WelcomeScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Welcome'
>;

interface Props {
  navigation: WelcomeScreenNavigationProp;
}

const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <ScreenContainer backgroundColor="#FFFFFF" barStyle="dark-content">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Top Header with Branding Logo & Tagline */}
        <View style={styles.headerContainer}>
          <AppLogo width={240} />
          <CustomText style={styles.subtitle}>
            Build your best self,{'\n'}one day at a time.
          </CustomText>
        </View>

        {/* Center Vector Illustration */}
        <View style={styles.illustrationContainer}>
          <HabitIllustration />
        </View>

        {/* Bottom Action Buttons */}
        <View style={styles.buttonContainer}>
          {/* Primary Action: REGISTER */}
          <TouchableOpacity
            style={styles.registerButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Register')}
          >
            <CustomText style={styles.registerButtonText}>REGISTER</CustomText>
          </TouchableOpacity>

          {/* Secondary Action: LOG IN */}
          <TouchableOpacity
            style={styles.loginButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Login')}
          >
            <CustomText style={styles.loginButtonText}>LOG IN</CustomText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 6,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#475569',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  buttonContainer: {
    width: '100%',
    gap: 14,
    marginBottom: 8,
  },
  registerButton: {
    backgroundColor: '#0D9488',
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  loginButton: {
    backgroundColor: 'transparent',
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#0D9488',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
