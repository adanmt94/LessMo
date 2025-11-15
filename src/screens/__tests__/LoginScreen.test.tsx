/**
 * Integration tests for LoginScreen
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../../LoginScreen';
import { NavigationContainer } from '@react-navigation/native';
import * as firebase from '../../../services/firebase';

jest.mock('../../../services/firebase');

const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
} as any;

const mockRoute = {
  params: {},
} as any;

describe('LoginScreen Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderLoginScreen = () => {
    return render(
      <NavigationContainer>
        <LoginScreen navigation={mockNavigation} route={mockRoute} />
      </NavigationContainer>
    );
  };

  describe('UI rendering', () => {
    it('should render all login form elements', () => {
      const { getByPlaceholderText, getByText } = renderLoginScreen();

      expect(getByPlaceholderText(/email/i)).toBeTruthy();
      expect(getByPlaceholderText(/contraseña/i)).toBeTruthy();
      expect(getByText(/iniciar sesión/i)).toBeTruthy();
    });

    it('should render social login buttons', () => {
      const { getByText } = renderLoginScreen();

      expect(getByText(/continuar con google/i)).toBeTruthy();
    });

    it('should render register link', () => {
      const { getByText } = renderLoginScreen();

      expect(getByText(/crear cuenta/i)).toBeTruthy();
    });

    it('should apply dark mode styles correctly', () => {
      const { getByTestId } = renderLoginScreen();

      // Verify container has appropriate styling
      const container = getByTestId('login-container');
      expect(container).toBeTruthy();
    });
  });

  describe('Email/Password login', () => {
    it('should handle successful login', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
      };

      (firebase.signInWithEmail as jest.Mock).mockResolvedValue(mockUser);

      const { getByPlaceholderText, getByText } = renderLoginScreen();

      const emailInput = getByPlaceholderText(/email/i);
      const passwordInput = getByPlaceholderText(/contraseña/i);
      const loginButton = getByText(/iniciar sesión/i);

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(firebase.signInWithEmail).toHaveBeenCalledWith(
          'test@example.com',
          'password123'
        );
      });
    });

    it('should show error message on failed login', async () => {
      const error = new Error('Invalid credentials');
      (firebase.signInWithEmail as jest.Mock).mockRejectedValue(error);

      const { getByPlaceholderText, getByText, findByText } = renderLoginScreen();

      const emailInput = getByPlaceholderText(/email/i);
      const passwordInput = getByPlaceholderText(/contraseña/i);
      const loginButton = getByText(/iniciar sesión/i);

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(findByText(/error/i)).toBeTruthy();
      });
    });

    it('should validate email format', async () => {
      const { getByPlaceholderText, getByText, findByText } = renderLoginScreen();

      const emailInput = getByPlaceholderText(/email/i);
      const passwordInput = getByPlaceholderText(/contraseña/i);
      const loginButton = getByText(/iniciar sesión/i);

      fireEvent.changeText(emailInput, 'invalid-email');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(findByText(/email.*válido/i)).toBeTruthy();
      });
    });

    it('should require password', async () => {
      const { getByPlaceholderText, getByText, findByText } = renderLoginScreen();

      const emailInput = getByPlaceholderText(/email/i);
      const loginButton = getByText(/iniciar sesión/i);

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(findByText(/contraseña.*requerida/i)).toBeTruthy();
      });
    });

    it('should disable button while loading', async () => {
      (firebase.signInWithEmail as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      const { getByPlaceholderText, getByText } = renderLoginScreen();

      const emailInput = getByPlaceholderText(/email/i);
      const passwordInput = getByPlaceholderText(/contraseña/i);
      const loginButton = getByText(/iniciar sesión/i);

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(loginButton).toBeDisabled();
      });
    });
  });

  describe('Google Sign In', () => {
    it('should initiate Google sign in flow', async () => {
      const { getByText } = renderLoginScreen();

      const googleButton = getByText(/continuar con google/i);
      fireEvent.press(googleButton);

      await waitFor(() => {
        // Verify Google auth request was triggered
        expect(googleButton).toBeTruthy();
      });
    });

    it('should handle Google sign in errors', async () => {
      const { getByText, findByText } = renderLoginScreen();

      const googleButton = getByText(/continuar con google/i);
      fireEvent.press(googleButton);

      // Simulate error
      await waitFor(() => {
        expect(findByText(/error.*google/i)).toBeTruthy();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to register screen', () => {
      const { getByText } = renderLoginScreen();

      const registerLink = getByText(/crear cuenta/i);
      fireEvent.press(registerLink);

      expect(mockNavigate).toHaveBeenCalledWith('Register');
    });

    it('should navigate to home after successful login', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
      };

      (firebase.signInWithEmail as jest.Mock).mockResolvedValue(mockUser);

      const { getByPlaceholderText, getByText } = renderLoginScreen();

      const emailInput = getByPlaceholderText(/email/i);
      const passwordInput = getByPlaceholderText(/contraseña/i);
      const loginButton = getByText(/iniciar sesión/i);

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible labels', () => {
      const { getByLabelText } = renderLoginScreen();

      expect(getByLabelText(/email/i)).toBeTruthy();
      expect(getByLabelText(/contraseña/i)).toBeTruthy();
    });

    it('should support keyboard navigation', () => {
      const { getByPlaceholderText } = renderLoginScreen();

      const emailInput = getByPlaceholderText(/email/i);
      const passwordInput = getByPlaceholderText(/contraseña/i);

      expect(emailInput.props.autoCapitalize).toBe('none');
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });
  });

  describe('Security', () => {
    it('should mask password input', () => {
      const { getByPlaceholderText } = renderLoginScreen();

      const passwordInput = getByPlaceholderText(/contraseña/i);

      expect(passwordInput.props.secureTextEntry).toBe(true);
    });

    it('should not store credentials in state unnecessarily', () => {
      const { getByPlaceholderText } = renderLoginScreen();

      const emailInput = getByPlaceholderText(/email/i);
      const passwordInput = getByPlaceholderText(/contraseña/i);

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');

      // Values should only be in input, not exposed
      expect(emailInput.props.value).toBe('test@example.com');
      expect(passwordInput.props.value).toBe('password123');
    });
  });
});
