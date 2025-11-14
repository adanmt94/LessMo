/**
 * OnboardingModal - Modal de guía rápida para nuevos usuarios
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from './Button';

const { width } = Dimensions.get('window');

interface OnboardingModalProps {
  visible: boolean;
  onClose: () => void;
}

interface StepData {
  emoji: string;
  title: string;
  description: string;
  features?: string[];
}

const STEPS: StepData[] = [
  {
    emoji: '👋',
    title: '¡Bienvenido a LessMo!',
    description: 'La forma más fácil de gestionar gastos compartidos con amigos y familia.',
    features: [
      'Divide gastos automáticamente',
      'Calcula quién debe a quién',
      'Exporta informes a Excel',
      'Notificaciones de gastos',
    ],
  },
  {
    emoji: '📅',
    title: 'Crea Eventos',
    description: 'Organiza viajes, cenas, fiestas o cualquier actividad con gastos compartidos.',
    features: [
      'Añade participantes',
      '🌟 EXCLUSIVO: Define presupuesto máximo individual',
      '🔔 Notificaciones al acercarse al límite',
      'Soporte multi-moneda',
      'Agrupa eventos relacionados',
    ],
  },
  {
    emoji: '💰',
    title: 'Registra Gastos',
    description: 'Añade gastos fácilmente y divide entre participantes.',
    features: [
      'División equitativa o personalizada',
      'Categorías de gastos',
      'Edita gastos en cualquier momento',
      'Desliza para eliminar',
    ],
  },
  {
    emoji: '📊',
    title: 'Resumen y Liquidación',
    description: 'Visualiza gráficos y calcula liquidaciones simplificadas.',
    features: [
      'Gráficos de gastos por categoría',
      'Balance de cada participante',
      'Liquidaciones optimizadas',
      'Exporta a Excel/Compartir',
    ],
  },
  {
    emoji: '👥',
    title: 'Grupos',
    description: 'Organiza múltiples eventos relacionados en grupos.',
    features: [
      'Agrupa eventos de piso, viajes, etc.',
      'Personaliza icono y color',
      'Gestiona miembros',
      'Vista consolidada de gastos',
    ],
  },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  visible,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.stepIndicator}>
              {currentStep + 1} / {STEPS.length}
            </Text>
            <TouchableOpacity onPress={handleSkip}>
              <Text style={styles.skipText}>Saltar</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.emoji}>{step.emoji}</Text>
            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.description}>{step.description}</Text>

            {step.features && (
              <View style={styles.featuresContainer}>
                {step.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Text style={styles.featureBullet}>✓</Text>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Pagination Dots */}
          <View style={styles.pagination}>
            {STEPS.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentStep && styles.dotActive,
                ]}
              />
            ))}
          </View>

          {/* Navigation Buttons */}
          <View style={styles.navigation}>
            {currentStep > 0 && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
              >
                <Text style={styles.backButtonText}>← Atrás</Text>
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }} />
            <Button
              title={isLastStep ? '¡Empezar!' : 'Siguiente'}
              onPress={handleNext}
              style={styles.nextButton}
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    maxHeight: '85%',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  stepIndicator: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  skipText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 72,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  featuresContainer: {
    width: '100%',
    paddingHorizontal: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  featureBullet: {
    fontSize: 18,
    color: '#10B981',
    marginRight: 12,
    fontWeight: '700',
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    lineHeight: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#6366F1',
    width: 24,
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6366F1',
    fontWeight: '600',
  },
  nextButton: {
    minWidth: 120,
  },
});
