// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Firebase
jest.mock('./src/services/firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
    },
  },
  db: {},
  storage: {},
  registerWithEmail: jest.fn(),
  signInWithEmail: jest.fn(),
  signOut: jest.fn(),
  getEvent: jest.fn(),
  createEvent: jest.fn(),
  updateEvent: jest.fn(),
  deleteEvent: jest.fn(),
  addExpense: jest.fn(),
  updateExpense: jest.fn(),
  deleteExpense: jest.fn(),
  addParticipant: jest.fn(),
  updateParticipant: jest.fn(),
  deleteParticipant: jest.fn(),
}));

// Mock Expo modules
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        firebaseApiKey: 'test-api-key',
        firebaseAuthDomain: 'test.firebaseapp.com',
        firebaseProjectId: 'test-project',
        firebaseStorageBucket: 'test.appspot.com',
        firebaseMessagingSenderId: '123456',
        firebaseAppId: 'test-app-id',
      },
      scheme: 'lessmo',
    },
  },
  Constants: {
    expoConfig: {
      extra: {
        firebaseApiKey: 'test-api-key',
      },
      scheme: 'lessmo',
    },
  },
}));

jest.mock('expo-auth-session', () => ({
  useAuthRequest: jest.fn(() => [null, null, jest.fn()]),
  makeRedirectUri: jest.fn(() => 'lessmo://'),
  ResponseType: { Code: 'code' },
}));

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  requestCameraPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ uri: 'test://image.jpg' }],
    })
  ),
  launchCameraAsync: jest.fn(() =>
    Promise.resolve({
      canceled: false,
      assets: [{ uri: 'test://photo.jpg' }],
    })
  ),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-view-shot', () => ({
  __esModule: true,
  default: 'ViewShot',
  captureRef: jest.fn(() => Promise.resolve('test://screenshot.jpg')),
}));

jest.mock('react-native-chart-kit', () => ({
  PieChart: 'PieChart',
}));

// Mock i18n
jest.mock('./src/i18n/config', () => ({
  default: {
    t: (key) => key,
    changeLanguage: jest.fn(() => Promise.resolve()),
    language: 'es',
  },
}));

// Silence the warning: Animated: `useNativeDriver` is not supported
// jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockReset = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
      reset: mockReset,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: jest.fn(),
  };
});

// Global test utilities
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    blob: () => Promise.resolve(new Blob()),
  })
);

// Suppress console errors in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};
