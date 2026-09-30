import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Modal, StyleSheet, View, TouchableOpacity, TouchableWithoutFeedback, Animated } from 'react-native';
import CustomText from '../components/CustomText';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

interface AlertContextType {
  showAlert: (title: string, message?: string, buttons?: AlertButton[]) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions | null>(null);

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.95));

  const showAlert = (title: string, message?: string, buttons?: AlertButton[]) => {
    setOptions({ title, message, buttons });
    setVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideAlert = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setOptions(null);
    });
  };

  const handleButtonPress = (btn: AlertButton) => {
    hideAlert();
    if (btn.onPress) {
      // Execute after animation closes to match native behavior
      setTimeout(() => btn.onPress!(), 150);
    }
  };

  const defaultButtons: AlertButton[] = [{ text: 'OK', onPress: () => hideAlert() }];
  const buttonsToRender = options?.buttons || defaultButtons;

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={hideAlert}
      >
        <TouchableWithoutFeedback onPress={hideAlert}>
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
            <TouchableWithoutFeedback>
              <Animated.View style={[styles.alertContainer, { transform: [{ scale: scaleAnim }] }]}>
                <CustomText style={styles.title}>{options?.title}</CustomText>
                {options?.message && <CustomText style={styles.message}>{options.message}</CustomText>}
                
                <View style={styles.buttonContainer}>
                  {buttonsToRender.map((btn, index) => {
                    const isDestructive = btn.style === 'destructive';
                    const isCancel = btn.style === 'cancel';
                    
                    return (
                      <TouchableOpacity
                        key={index}
                        activeOpacity={0.8}
                        style={[
                          styles.button,
                          buttonsToRender.length > 1 && styles.multiButton,
                          isDestructive && styles.destructiveButton,
                          isCancel && styles.cancelButton,
                          !isDestructive && !isCancel && styles.primaryButton
                        ]}
                        onPress={() => handleButtonPress(btn)}
                      >
                        <CustomText
                          style={[
                            styles.buttonText,
                            isDestructive && styles.destructiveButtonText,
                            isCancel && styles.cancelButtonText,
                            !isDestructive && !isCancel && styles.primaryButtonText
                          ]}
                        >
                          {btn.text}
                        </CustomText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Modal>
    </AlertContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  multiButton: {
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#0D9488',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  destructiveButton: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  destructiveButtonText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 15,
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  cancelButtonText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 15,
  },
});
