import React, { useCallback, useEffect, useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import CustomText from './CustomText';
import { onServerError, onServerRecovered } from '../utils/apiEvents';

/**
 * Global connectivity modals:
 *  - "No Internet Connection" while the device is offline (closes by itself
 *    once the connection returns).
 *  - "Server Error" when any API call fails with a 5xx or the server can't
 *    be reached while the device is online.
 */
export const NetworkStatusBanner = () => {
  const [offline, setOffline] = useState(false);
  const [serverError, setServerError] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setOffline(state.isConnected === false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => onServerError(() => setServerError(true)), []);
  useEffect(() => onServerRecovered(() => setServerError(false)), []);

  const retryConnection = useCallback(async () => {
    setChecking(true);
    try {
      const state = await NetInfo.fetch();
      setOffline(state.isConnected === false);
    } finally {
      setChecking(false);
    }
  }, []);

  return (
    <>
      <Modal visible={offline} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <View style={[styles.iconCircle, styles.iconOffline]}>
              <CustomText style={styles.iconText}>!</CustomText>
            </View>
            <CustomText style={styles.title}>No Internet Connection</CustomText>
            <CustomText style={styles.message}>
              Please check your Wi-Fi or mobile data and try again.
            </CustomText>
            <TouchableOpacity
              style={styles.button}
              onPress={retryConnection}
              disabled={checking}
              activeOpacity={0.8}
            >
              <CustomText style={styles.buttonText}>
                {checking ? 'Checking...' : 'Try Again'}
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={serverError && !offline}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setServerError(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <View style={[styles.iconCircle, styles.iconServer]}>
              <CustomText style={styles.iconText}>!</CustomText>
            </View>
            <CustomText style={styles.title}>Something Went Wrong</CustomText>
            <CustomText style={styles.message}>
              We're having trouble reaching our server. Please try again in a moment.
            </CustomText>
            <TouchableOpacity
              style={styles.button}
              onPress={() => setServerError(false)}
              activeOpacity={0.8}
            >
              <CustomText style={styles.buttonText}>OK</CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  iconOffline: { backgroundColor: '#DC2626' },
  iconServer: { backgroundColor: '#F97316' },
  iconText: { color: '#FFFFFF', fontSize: 28, fontWeight: 'bold' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0F172A', marginBottom: 8 },
  message: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    alignSelf: 'stretch',
    backgroundColor: '#d60201',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
});
