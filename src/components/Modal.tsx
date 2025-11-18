import React from 'react';
import { Modal, View, StyleSheet, Platform, TouchableWithoutFeedback, KeyboardAvoidingView, ScrollView, Text, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sharedStyles } from '../theme/sharedStyles';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: number;
  title?: string;
  dismissOnBackdropPress?: boolean;
  footer?: React.ReactNode;
  header?: React.ReactNode;
};

/**
 * Modal reutilizable con diseño minimalista tipo card
 * Inspirado en las mejores prácticas de Expo Router web modals
 * 
 * Características:
 * - Animación de entrada/salida suave (fade)
 * - Overlay semi-transparente optimizado (40%)
 * - Sombras mejoradas para web
 * - Respeta SafeArea en móviles
 * - Altura máxima del 85vh en web para mejor UX
 * - Footer con botones estilo quick actions de las cards
 */
export default function ElegantModal({ 
  visible, 
  onClose, 
  children, 
  maxWidth = 600, 
  title, 
  dismissOnBackdropPress = true, 
  footer,
  header 
}: Props) {
  // Animación inspirada en Expo Router (fade in/out)
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <Animated.View 
        style={[
          sharedStyles.modalOverlay, 
          Platform.OS === 'web' && sharedStyles.webModalOverlay,
          { opacity: fadeAnim }
        ] as any}
      >
        <TouchableWithoutFeedback onPress={dismissOnBackdropPress ? onClose : undefined}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
        
        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.avoidingView}
          >
            <SafeAreaView 
              style={[sharedStyles.modalSafeArea, Platform.OS === 'web' && sharedStyles.webModalSafeArea] as any}
              edges={['bottom']}
            >
              <View style={[
                sharedStyles.modalContent, 
                Platform.OS === 'web' ? sharedStyles.webModalContent : {},
                { maxWidth }
              ] as any}>
                {/* Header personalizable o por defecto */}
                {header ? (
                  header
                ) : title ? (
                  <View style={sharedStyles.modalHeader}>
                    <Text style={sharedStyles.modalTitle}>{title}</Text>
                    <TouchableOpacity 
                      onPress={onClose} 
                      accessibilityLabel="Cerrar modal" 
                      accessibilityRole="button"
                      style={styles.closeButton}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.closeText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {/* Body con scroll optimizado */}
                <ScrollView 
                  style={styles.scrollView}
                  contentContainerStyle={styles.scrollContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={Platform.OS === 'web'}
                  bounces={Platform.OS === 'ios'}
                >
                  <View style={sharedStyles.modalBody}>
                    {children}
                  </View>
                </ScrollView>

                {/* Footer con botones estilo quick actions */}
                {footer ? (
                  <View style={sharedStyles.modalFooter}>
                    {footer}
                  </View>
                ) : null}
              </View>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  avoidingView: {
    flex: 1,
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
    alignItems: 'center',
  },
  scrollView: {
    maxHeight: Platform.OS === 'web' ? 'calc(85vh - 120px)' as any : undefined, // Inspirado en Expo: mejor viewport usage
  },
  scrollContent: {
    flexGrow: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 8,
    zIndex: 10,
    borderRadius: 6,
    // Hover effect en web
    ...(Platform.OS === 'web' && {
      cursor: 'pointer' as any,
      transition: 'background-color 0.15s ease' as any,
    }),
  },
  closeText: {
    fontSize: 22,
    color: '#6B7280',
    fontWeight: '300',
    lineHeight: 22,
  },
});
