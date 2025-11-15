/**
 * Tests for OnboardingScreen
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { OnboardingScreen, shouldShowOnboarding, resetOnboarding } from '../../OnboardingScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('OnboardingScreen Tests', () => {
  const mockOnComplete = jest.fn();

  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe('UI rendering', () => {
    it('should render first step on mount', () => {
      const { getByText } = render(<OnboardingScreen onComplete={mockOnComplete} />);

      expect(getByText(/¡Bienvenido a LessMo!/i)).toBeTruthy();
      expect(getByText(/👋/)).toBeTruthy();
    });

    it('should show progress indicator', () => {
      const { getByText } = render(<OnboardingScreen onComplete={mockOnComplete} />);

      expect(getByText(/1\/6/)).toBeTruthy();
    });

    it('should render navigation buttons', () => {
      const { getByText } = render(<OnboardingScreen onComplete={mockOnComplete} />);

      expect(getByText(/Siguiente/i)).toBeTruthy();
      expect(getByText(/Saltar/i)).toBeTruthy();
    });

    it('should hide back button on first step', () => {
      const { queryByText } = render(<OnboardingScreen onComplete={mockOnComplete} />);

      expect(queryByText(/Atrás/i)).toBeNull();
    });

    it('should show all 6 step indicators', () => {
      const { getAllByTestId } = render(<OnboardingScreen onComplete={mockOnComplete} />);

      const dots = getAllByTestId(/step-indicator/i);
      expect(dots).toHaveLength(6);
    });
  });

  describe('Navigation between steps', () => {
    it('should navigate to next step', () => {
      const { getByText } = render(<OnboardingScreen onComplete={mockOnComplete} />);

      const nextButton = getByText(/Siguiente/i);
      fireEvent.press(nextButton);

      expect(getByText(/2\/6/)).toBeTruthy();
      expect(getByText(/Crea eventos fácilmente/i)).toBeTruthy();
    });

    it('should navigate back to previous step', () => {
      const { getByText } = render(<OnboardingScreen onComplete={mockOnComplete} />);

      // Go to step 2
      const nextButton = getByText(/Siguiente/i);
      fireEvent.press(nextButton);

      // Go back to step 1
      const backButton = getByText(/Atrás/i);
      fireEvent.press(backButton);

      expect(getByText(/1\/6/)).toBeTruthy();
      expect(getByText(/¡Bienvenido a LessMo!/i)).toBeTruthy();
    });

    it('should navigate through all steps', () => {
      const { getByText } = render(<OnboardingScreen onComplete={mockOnComplete} />);

      const steps = [
        { title: /¡Bienvenido a LessMo!/i, emoji: '👋' },
        { title: /Crea eventos fácilmente/i, emoji: '🎉' },
        { title: /Registra gastos al instante/i, emoji: '💰' },
        { title: /Visualiza gastos por categoría/i, emoji: '📊' },
        { title: /Divide gastos entre participantes/i, emoji: '👥' },
        { title: /¡Listo para empezar!/i, emoji: '🚀' },
      ];

      steps.forEach((step, index) => {
        expect(getByText(step.title)).toBeTruthy();
        expect(getByText(step.emoji)).toBeTruthy();
        expect(getByText(`${index + 1}/6`)).toBeTruthy();

        if (index < steps.length - 1) {
          const nextButton = getByText(/Siguiente/i);
          fireEvent.press(nextButton);
        }
      });
    });

    it('should show "¡Empezar!" button on last step', () => {
      const { getByText } = render(<OnboardingScreen onComplete={mockOnComplete} />);

      // Navigate to last step
      for (let i = 0; i < 5; i++) {
        const nextButton = getByText(/Siguiente/i);
        fireEvent.press(nextButton);
      }

      expect(getByText(/¡Empezar!/i)).toBeTruthy();
    });
  });

  describe('Skip functionality', () => {
    it('should complete onboarding when skip is pressed', async () => {
      const { getByText } = render(<OnboardingScreen onComplete={mockOnComplete} />);

      const skipButton = getByText(/Saltar/i);
      fireEvent.press(skipButton);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled();
      });
    });

    it('should mark onboarding as completed', async () => {
      const { getByText } = render(<OnboardingScreen onComplete={mockOnComplete} />);

      const skipButton = getByText(/Saltar/i);
      fireEvent.press(skipButton);

      await waitFor(async () => {
        const completed = await AsyncStorage.getItem('@LessMo:onboarding_completed');
        expect(completed).toBe('true');
      });
    });
  });

  describe('Complete functionality', () => {
    it('should complete onboarding on final step', async () => {
      const { getByText } = render(<OnboardingScreen onComplete={mockOnComplete} />);

      // Navigate to last step
      for (let i = 0; i < 5; i++) {
        const nextButton = getByText(/Siguiente/i);
        fireEvent.press(nextButton);
      }

      const startButton = getByText(/¡Empezar!/i);
      fireEvent.press(startButton);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled();
      });
    });

    it('should persist completion state', async () => {
      const { getByText } = render(<OnboardingScreen onComplete={mockOnComplete} />);

      // Navigate to last step
      for (let i = 0; i < 5; i++) {
        const nextButton = getByText(/Siguiente/i);
        fireEvent.press(nextButton);
      }

      const startButton = getByText(/¡Empezar!/i);
      fireEvent.press(startButton);

      await waitFor(async () => {
        const completed = await AsyncStorage.getItem('@LessMo:onboarding_completed');
        expect(completed).toBe('true');
      });
    });
  });

  describe('Progress indicators', () => {
    it('should highlight current step', () => {
      const { getAllByTestId, getByText } = render(
        <OnboardingScreen onComplete={mockOnComplete} />
      );

      const dots = getAllByTestId(/step-indicator/i);
      expect(dots[0].props.style).toHaveProperty('backgroundColor');
    });

    it('should update active dot on navigation', () => {
      const { getAllByTestId, getByText } = render(
        <OnboardingScreen onComplete={mockOnComplete} />
      );

      const nextButton = getByText(/Siguiente/i);
      fireEvent.press(nextButton);

      const dots = getAllByTestId(/step-indicator/i);
      expect(dots[1].props.style).toHaveProperty('backgroundColor');
    });
  });

  describe('Persistence utilities', () => {
    it('shouldShowOnboarding returns true when not completed', async () => {
      const shouldShow = await shouldShowOnboarding();
      expect(shouldShow).toBe(true);
    });

    it('shouldShowOnboarding returns false when completed', async () => {
      await AsyncStorage.setItem('@LessMo:onboarding_completed', 'true');
      
      const shouldShow = await shouldShowOnboarding();
      expect(shouldShow).toBe(false);
    });

    it('resetOnboarding clears completion state', async () => {
      await AsyncStorage.setItem('@LessMo:onboarding_completed', 'true');
      
      await resetOnboarding();
      
      const completed = await AsyncStorage.getItem('@LessMo:onboarding_completed');
      expect(completed).toBeNull();
    });
  });

  describe('Content verification', () => {
    it('should display correct emoji for each step', () => {
      const { getByText } = render(<OnboardingScreen onComplete={mockOnComplete} />);

      const emojis = ['👋', '🎉', '💰', '📊', '👥', '🚀'];
      
      emojis.forEach((emoji, index) => {
        if (index > 0) {
          const nextButton = getByText(/Siguiente/i);
          fireEvent.press(nextButton);
        }
        expect(getByText(emoji)).toBeTruthy();
      });
    });

    it('should display description for each step', () => {
      const { getByText } = render(<OnboardingScreen onComplete={mockOnComplete} />);

      const descriptions = [
        /La forma más fácil de dividir gastos/i,
        /Crea eventos para viajes/i,
        /Añade gastos en segundos/i,
        /Gráficos claros de tus gastos/i,
        /Calcula automáticamente quién debe a quién/i,
        /¡Comienza a usar LessMo ahora!/i,
      ];

      descriptions.forEach((desc, index) => {
        if (index > 0) {
          const nextButton = getByText(/Siguiente/i);
          fireEvent.press(nextButton);
        }
        expect(getByText(desc)).toBeTruthy();
      });
    });
  });

  describe('Edge cases', () => {
    it('should not go back from first step', () => {
      const { getByText, queryByText } = render(
        <OnboardingScreen onComplete={mockOnComplete} />
      );

      expect(queryByText(/Atrás/i)).toBeNull();
      expect(getByText(/1\/6/)).toBeTruthy();
    });

    it('should not go forward from last step without completing', () => {
      const { getByText } = render(<OnboardingScreen onComplete={mockOnComplete} />);

      // Navigate to last step
      for (let i = 0; i < 5; i++) {
        const nextButton = getByText(/Siguiente/i);
        fireEvent.press(nextButton);
      }

      // Should show start button instead of next
      expect(getByText(/¡Empezar!/i)).toBeTruthy();
      const nextButton = getByText(/Siguiente/i);
      expect(nextButton).toBeUndefined();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible labels', () => {
      const { getByLabelText } = render(<OnboardingScreen onComplete={mockOnComplete} />);

      expect(getByLabelText(/siguiente/i)).toBeTruthy();
      expect(getByLabelText(/saltar/i)).toBeTruthy();
    });

    it('should support screen readers', () => {
      const { getByTestId } = render(<OnboardingScreen onComplete={mockOnComplete} />);

      const container = getByTestId('onboarding-container');
      expect(container.props.accessible).toBeTruthy();
    });
  });
});
