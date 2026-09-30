import CustomText from '../components/CustomText';
import React, { useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { AppLogo } from '../components/AppLogo';
import { useAuth } from '../context/AuthContext';
import { logger } from '../utils/logger';

const TAG = 'Splashscreen';

const Splashscreen: React.FC = () => {
  const { user } = useAuth();

  useEffect(() => {
    logger.info(TAG, 'Splashscreen user session', {
      loggedInUserID: user?.id ?? null,
      clientUserID: user?.clientUserID ?? null,
      isSubscribed: user?.isSubscribed ?? null,
      email: user?.email ?? null,
    });
  }, [user]);

  return (
    <ScreenContainer backgroundColor="#FFFFFF" barStyle="dark-content">
      <View style={styles.container}>
        <AppLogo width={280} />
        <CustomText style={styles.subtitle}>
          Build your best self, one day at a time.
        </CustomText>
        <ActivityIndicator size="large" color="#0D9488" style={styles.loader} />
      </View>
    </ScreenContainer>
  );
};

export default Splashscreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  loader: {
    marginTop: 20,
  },
});
