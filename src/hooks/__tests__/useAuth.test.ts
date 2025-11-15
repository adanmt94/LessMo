/**
 * Tests for useAuth hook
 */
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAuth } from '../useAuth';
import * as firebase from '../../services/firebase';

jest.mock('../../services/firebase');

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signIn', () => {
    it('should sign in with email and password successfully', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
      };

      (firebase.signInWithEmail as jest.Mock).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const user = await result.current.signIn('test@example.com', 'password123');
        expect(user).toEqual(mockUser);
      });

      expect(firebase.signInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should handle sign in errors', async () => {
      const error = new Error('Invalid credentials');
      (firebase.signInWithEmail as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useAuth());

      await expect(
        result.current.signIn('test@example.com', 'wrong-password')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should validate email format', async () => {
      const { result } = renderHook(() => useAuth());

      await expect(
        result.current.signIn('invalid-email', 'password123')
      ).rejects.toThrow();
    });
  });

  describe('signUp', () => {
    it('should register new user successfully', async () => {
      const mockUser = {
        uid: 'new-user-id',
        email: 'newuser@example.com',
        displayName: 'New User',
      };

      (firebase.registerWithEmail as jest.Mock).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        const user = await result.current.signUp(
          'newuser@example.com',
          'password123',
          'New User'
        );
        expect(user).toEqual(mockUser);
      });

      expect(firebase.registerWithEmail).toHaveBeenCalledWith(
        'newuser@example.com',
        'password123',
        'New User'
      );
    });

    it('should handle registration errors', async () => {
      const error = new Error('Email already in use');
      (firebase.registerWithEmail as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useAuth());

      await expect(
        result.current.signUp('test@example.com', 'password123', 'Test User')
      ).rejects.toThrow('Email already in use');
    });

    it('should validate password strength', async () => {
      const { result } = renderHook(() => useAuth());

      await expect(
        result.current.signUp('test@example.com', '123', 'Test User')
      ).rejects.toThrow();
    });
  });

  describe('signOut', () => {
    it('should sign out user successfully', async () => {
      (firebase.signOut as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signOut();
      });

      expect(firebase.signOut).toHaveBeenCalled();
    });

    it('should handle sign out errors', async () => {
      const error = new Error('Sign out failed');
      (firebase.signOut as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useAuth());

      await expect(result.current.signOut()).rejects.toThrow('Sign out failed');
    });
  });

  describe('user state', () => {
    it('should return current user', () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.user).toBeTruthy();
    });

    it('should update loading state during authentication', async () => {
      (firebase.signInWithEmail as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.signIn('test@example.com', 'password123');
      });

      // Should be loading
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });
    });
  });
});
