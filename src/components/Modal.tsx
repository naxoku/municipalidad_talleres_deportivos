  import React from 'react';
  import { Modal, View, StyleSheet, Platform, TouchableWithoutFeedback, KeyboardAvoidingView, ScrollView, Text, TouchableOpacity, Animated } from 'react-native';
  import { SafeAreaView } from 'react-native-safe-area-context';
  import { sharedStyles } from '../theme/sharedStyles';
  import { colors, borderRadius, spacing } from '../theme/colors';
  import { useResponsive } from '../hooks/useResponsive';

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
    // Obtenemos los estados de responsive
    const { isWeb, isNative, isMobile } = useResponsive();
    
    // Estado interno para controlar el montaje/desmontaje del Modal
    const [showModal, setShowModal] = React.useState(false);

    // Animación para el overlay (opacidad)
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    // Animación para el contenido (deslizamiento vertical)
    const slideAnim = React.useRef(new Animated.Value(1000)).current; 

    // Determinar si se usa el estilo de "hoja inferior" (Bottom Sheet)
    const useMobileStyle = isNative || (isWeb && isMobile);

    React.useEffect(() => {
      if (visible) {
        // Si visible pasa a true, mostramos el Modal inmediatamente (para iniciar la animación)
        setShowModal(true);

        // 1. Mostrar Overlay (Fade In)
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: Platform.OS !== 'web', 
        }).start();

        if (useMobileStyle) {
          // 2. Deslizar contenido desde abajo (Slide Up)
          Animated.timing(slideAnim, {
            toValue: 0, 
            duration: 300,
            useNativeDriver: Platform.OS !== 'web',
          }).start();
        } else {
          // Para web centrado, solo aseguramos que no haya traslación y que el fade se vea bien
          slideAnim.setValue(0);
        }
      } else {
        // Si visible pasa a false, iniciamos la animación de cierre

        if (useMobileStyle) {
          // 1. Deslizar contenido hacia abajo (Slide Down)
          Animated.timing(slideAnim, {
            toValue: 1000, 
            duration: 250,
            useNativeDriver: Platform.OS !== 'web',
          }).start(() => {
              // 2. Ocultar Overlay (Fade Out) después de deslizar
              Animated.timing(fadeAnim, {
                  toValue: 0,
                  duration: 150,
                  useNativeDriver: Platform.OS !== 'web',
              }).start(() => {
                  // 3. Desmontar el modal SOLO después de que ambas animaciones terminen
                  setShowModal(false);
              });
          });
        } else {
          // 1. Ocultar Overlay (Fade Out) para Web Centrado
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: Platform.OS !== 'web',
          }).start(() => {
              // 2. Desmontar el modal SOLO después del fade
              setShowModal(false);
          });
        }
      }
    }, [visible, fadeAnim, slideAnim, useMobileStyle]);

    // Si showModal es false, no renderizamos el Modal, lo que permite su desmontaje.
    if (!showModal) {
      return null;
    }

    // --- Estilos Responsivos ---
    
    const modalContainerStyle = useMobileStyle
      ? styles.modalContainerMobile 
      : styles.modalContainerWeb; 

    const modalContentStyle = useMobileStyle
      ? {
          ...sharedStyles.modalContent,
          width: '100%',
          marginHorizontal: 0,
          borderRadius: 0,
          borderTopLeftRadius: borderRadius.lg,
          borderTopRightRadius: borderRadius.lg,
          borderWidth: 0, 
      }
      : {
          ...sharedStyles.modalContent,
          ...sharedStyles.webModalContent,
          maxWidth,
          borderRadius: borderRadius.lg,
          borderTopLeftRadius: borderRadius.lg,
          borderTopRightRadius: borderRadius.lg,
      };
      
    return (
      <Modal
        // Usamos showModal como prop visible
        visible={showModal} 
        transparent
        animationType="none" 
        onRequestClose={onClose}
        statusBarTranslucent
        presentationStyle="overFullScreen"
      >
        <Animated.View 
          // El overlay solo usa el fadeAnim
          style={[
            styles.modalOverlay, 
            modalContainerStyle,
            // La opacidad ahora se aplica directamente al overlay para el fade out
            { opacity: fadeAnim } 
          ] as any}
        >
          {/* Backdrop para cerrar el modal */}
          <TouchableWithoutFeedback onPress={dismissOnBackdropPress ? onClose : undefined}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={modalContainerStyle}
            >
              {/* Contenedor animado para el contenido */}
              <Animated.View style={[{ 
                  transform: [{ translateY: slideAnim }], 
                  flex: useMobileStyle ? 1 : undefined, 
                  width: useMobileStyle ? '100%' : undefined,
                  alignItems: useMobileStyle ? 'stretch' : 'center',
                  justifyContent: useMobileStyle ? 'flex-end' : 'center',
              }] as any}>
                <SafeAreaView 
                  style={[
                    useMobileStyle ? styles.safeAreaMobile : styles.safeAreaWeb
                  ] as any}
                  edges={useMobileStyle ? ['bottom'] : []}
                >
                  <View style={modalContentStyle as any}>
                    {/* Header personalizable o por defecto con título y botón de cierre */}
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

                    {/* Contenido principal con scroll */}
                    <ScrollView 
                      style={styles.scrollView}
                      contentContainerStyle={styles.scrollContent}
                      keyboardShouldPersistTaps="handled"
                      showsVerticalScrollIndicator={isWeb}
                      bounces={Platform.OS === 'ios'}
                    >
                      <View style={sharedStyles.modalBody}>
                        {children}
                      </View>
                    </ScrollView>

                    {/* Footer para botones de acción */}
                    {footer ? (
                      <View style={sharedStyles.modalFooter}>
                        {footer}
                      </View>
                    ) : null}
                  </View>
                </SafeAreaView>
              </Animated.View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </Animated.View>
      </Modal>
    );
  }

  const styles = StyleSheet.create({
    modalOverlay: { 
      flex: 1, 
      backgroundColor: colors.overlay,
    },
    // Estilo para Web/Tablet (Centrado, flotante)
    modalContainerWeb: {
      flex: 1,
      justifyContent: 'center', 
      alignItems: 'center',
      padding: spacing.xl,
    },
    // Estilo para Mobile (Bottom Sheet)
    modalContainerMobile: {
      flex: 1,
      justifyContent: 'flex-end', 
      alignItems: 'stretch',
      padding: 0,
    },
    // SafeAreaView para contener la altura en móvil/web móvil (efecto bottom sheet)
    safeAreaMobile: {
      width: '100%',
      maxHeight: '90%', 
    },
    safeAreaWeb: {
      maxHeight: '100%',
    },
    scrollView: {
      flex: 1, 
      maxHeight: Platform.OS === 'web' ? 'calc(100vh - 120px)' as any : undefined,
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
      // Estilo de cursor y hover en web
      ...(Platform.OS === 'web' && {
        cursor: 'pointer' as any,
        transition: 'background-color 0.15s ease' as any,
        ':hover': {
          backgroundColor: colors.background.secondary,
        } as any,
      }),
    },
    closeText: {
      fontSize: 22,
      color: colors.text.secondary,
      fontWeight: '300',
      lineHeight: 22,
    },
  });