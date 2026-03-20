/**
 * LessMo Design System
 * Shared typography, spacing, border radius, shadows, and gradient definitions.
 */
import { Platform, TextStyle, ViewStyle } from 'react-native';

// ─── Spacing Scale ───────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

// ─── Border Radius ───────────────────────────────────────────────
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 999,
} as const;

// ─── Typography ──────────────────────────────────────────────────
export const Typography = {
  largeTitle: {
    fontSize: 34,
    fontWeight: '800' as TextStyle['fontWeight'],
    letterSpacing: -0.5,
  },
  title1: {
    fontSize: 28,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: -0.3,
  },
  title2: {
    fontSize: 22,
    fontWeight: '700' as TextStyle['fontWeight'],
  },
  title3: {
    fontSize: 20,
    fontWeight: '600' as TextStyle['fontWeight'],
  },
  headline: {
    fontSize: 17,
    fontWeight: '600' as TextStyle['fontWeight'],
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as TextStyle['fontWeight'],
  },
  callout: {
    fontSize: 15,
    fontWeight: '400' as TextStyle['fontWeight'],
  },
  subhead: {
    fontSize: 14,
    fontWeight: '400' as TextStyle['fontWeight'],
  },
  footnote: {
    fontSize: 13,
    fontWeight: '400' as TextStyle['fontWeight'],
  },
  caption1: {
    fontSize: 12,
    fontWeight: '400' as TextStyle['fontWeight'],
  },
  caption2: {
    fontSize: 11,
    fontWeight: '400' as TextStyle['fontWeight'],
  },
} as const;

// ─── Shadow Presets ──────────────────────────────────────────────
export const Shadows = {
  sm: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    android: { elevation: 2 },
    default: {},
  })!,
  md: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
    default: {},
  })!,
  lg: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    },
    android: { elevation: 8 },
    default: {},
  })!,
  primary: (primaryColor: string) =>
    Platform.select<ViewStyle>({
      ios: {
        shadowColor: primaryColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
      default: {},
    })!,
} as const;

// ─── Gradient Definitions ────────────────────────────────────────
export const Gradients = {
  primary: ['#6366F1', '#8B5CF6'] as const,
  primaryDark: ['#4F46E5', '#7C3AED'] as const,
  surface: ['#F9FAFB', '#FFFFFF'] as const,
  surfaceDark: ['#1A1A1A', '#0A0A0A'] as const,
  success: ['#10B981', '#059669'] as const,
  warm: ['#F59E0B', '#EF4444'] as const,
  cool: ['#3B82F6', '#6366F1'] as const,
  hero: ['#6366F1', '#A855F7', '#EC4899'] as const,
  heroDark: ['#4F46E5', '#7C3AED', '#DB2777'] as const,
} as const;
