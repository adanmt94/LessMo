/**
 * OnboardingScreen - Tutorial inicial a pantalla completa
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');
const ONBOARDING_KEY = '@LessMo:onboarding_completed';

interface OnboardingStep {
  emoji: string;
  title: string;
  description: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    emoji: '👋',
    title: 'Bienvenido a LessMo',
    description: 'La forma más simple de dividir gastos con amigos y familia. Viajes, cenas, eventos... ¡todo en un solo lugar!',
  },
  {
    emoji: '🎉',
    title: 'Crea Eventos',
    description: 'Organiza cualquier actividad: viajes, cenas, fiestas. Define el presupuesto y añade participantes fácilmente.',
  },
  {
    emoji: '💰',
    title: 'Registra Gastos',
    description: 'Añade cada gasto y selecciona quién lo pagó y entre quiénes dividir. LessMo calcula todo automáticamente.',
  },
  {
    emoji: '📊',
    title: 'Ve el Resumen',
    description: 'Consulta quién debe a quién, cuánto se ha gastado y cuánto queda del presupuesto. Todo claro y transparente.',
  },
  {
    emoji: '👥',
    title: 'Comparte con Grupos',
    description: 'Crea grupos para eventos recurrentes. Ideal para compañeros de piso, grupos de amigos o familias.',
  },
  {
    emoji: '🚀',
    title: '¡Comencemos!',
    description: 'Estás listo para empezar. Crea tu primer evento o únete a uno existente con un código de invitación.',
  },
];

interface Props {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<Props> = ({ onComplete }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [currentStep, setCurrentStep] = useState(0);

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  const handleNext = async () => {
    if (isLastStep) {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    onComplete();
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip button */}
      {!isLastStep && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Saltar</Text>
        </TouchableOpacity>
      )}

      {/* Content */}
      <View style={styles.content}>
        {/* Emoji */}
        <Text style={styles.emoji}>{step.emoji}</Text>

        {/* Title */}
        <Text style={styles.title}>{step.title}</Text>

        {/* Description */}
        <Text style={styles.description}>{step.description}</Text>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>

        {/* Steps indicator */}
        <View style={styles.dotsContainer}>
          {ONBOARDING_STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentStep && styles.dotActive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Navigation buttons */}
      <View style={styles.navigationContainer}>
        {currentStep > 0 && (
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={handleBack}
          >
            <Text style={styles.buttonSecondaryText}>← Atrás</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            styles.buttonPrimary,
            currentStep === 0 && styles.buttonFullWidth,
          ]}
          onPress={handleNext}
        >
          <Text style={styles.buttonPrimaryText}>
            {isLastStep ? '¡Empezar!' : 'Siguiente →'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emoji: {
    fontSize: 120,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 50,
    paddingHorizontal: 10,
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  dotActive: {
    backgroundColor: theme.colors.primary,
    width: 24,
  },
  navigationContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonFullWidth: {
    flex: 1,
  },
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonSecondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  buttonSecondaryText: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
});

// Función helper para verificar si se debe mostrar el onboarding
export const shouldShowOnboarding = async (): Promise<boolean> => {
  try {
    const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
    return completed !== 'true';
  } catch {
    return true;
  }
};

// Función para resetear el onboarding (útil para testing)
export const resetOnboarding = async (): Promise<void> => {
  await AsyncStorage.removeItem(ONBOARDING_KEY);
};
