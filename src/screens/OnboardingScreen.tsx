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
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Gradients, Spacing, Radius, Typography } from '../theme/designSystem';

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
    <LinearGradient
      colors={theme.isDark ? Gradients.heroDark : Gradients.hero}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBg}
    >
      <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
        {/* Skip button */}
        {!isLastStep && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
          </TouchableOpacity>
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Emoji with glass container */}
          <View style={styles.emojiContainer}>
            <Text style={styles.emoji}>{step.emoji}</Text>
          </View>

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
    </LinearGradient>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  gradientBg: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 16,
    right: Spacing.xxl,
    zIndex: 10,
    padding: Spacing.sm,
  },
  skipText: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emojiContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxxl,
  },
  emoji: {
    fontSize: 80,
  },
  title: {
    ...Typography.largeTitle,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  description: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  progressContainer: {
    width: '80%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.xxl,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
  navigationContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xxl,
    paddingBottom: 40,
    gap: Spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonFullWidth: {
    flex: 1,
  },
  buttonPrimary: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonPrimaryText: {
    color: '#6366F1',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonSecondary: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  buttonSecondaryText: {
    color: '#FFFFFF',
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
