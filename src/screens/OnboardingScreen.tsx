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
import { useLanguage } from '../context/LanguageContext';

const { width, height } = Dimensions.get('window');
const ONBOARDING_KEY = '@LessMo:onboarding_completed';

interface OnboardingStep {
  emoji: string;
  title: string;
  description: string;
}

// This will be dynamically generated using translations
const getOnboardingSteps = (t: (key: string) => string): OnboardingStep[] => [
  {
    emoji: '👋',
    title: t('onboarding.step1Title'),
    description: t('onboarding.step1Description'),
  },
  {
    emoji: '🎉',
    title: t('onboarding.step2Title'),
    description: t('onboarding.step2Description'),
  },
  {
    emoji: '💰',
    title: t('onboarding.step3Title'),
    description: t('onboarding.step3Description'),
  },
  {
    emoji: '📊',
    title: t('onboarding.step4Title'),
    description: t('onboarding.step4Description'),
  },
  {
    emoji: '👥',
    title: t('onboarding.step5Title'),
    description: t('onboarding.step5Description'),
  },
  {
    emoji: '🚀',
    title: t('onboarding.step6Title'),
    description: t('onboarding.step6Description'),
  },
];

interface Props {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<Props> = ({ onComplete }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = getStyles(theme);
  const [currentStep, setCurrentStep] = useState(0);

  const ONBOARDING_STEPS = getOnboardingSteps(t);
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
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* Skip button */}
      {!isLastStep && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
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
            <Text style={styles.buttonSecondaryText}>{t('onboarding.back')}</Text>
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
            {isLastStep ? t('onboarding.start') : t('onboarding.next')}
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
    paddingHorizontal: 20,
  },
  emoji: {
    fontSize: 120,
    marginBottom: 24,
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
    marginBottom: 24,
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
    color: theme.colors.card,
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

// Función para marcar el onboarding como completado
export const markOnboardingComplete = async (): Promise<void> => {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
};
