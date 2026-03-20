# LessMo — Build & Test Guide

This guide covers every way to compile, test, and install LessMo on iOS (and Android).

---

## Prerequisites

| Tool | Required Version | Install |
|------|-----------------|---------|
| Node.js | 20.x (LTS) | `nvm install 20 && nvm use 20` |
| Xcode | 15+ | Mac App Store |
| CocoaPods | latest | `sudo gem install cocoapods` |
| EAS CLI | latest | `npm install -g eas-cli` |
| Expo CLI | (bundled) | via `npx expo` |

Ensure you're logged in to EAS:
```bash
eas login
```

---

## 1. Local Development (Expo Go / Dev Client)

### Start the Metro bundler
```bash
npx expo start
```
- Press **i** → open in iOS Simulator
- Press **a** → open in Android emulator
- Scan QR with Expo Go on physical device

> **Note:** Some native features (Sentry, Stripe, Widgets) require a dev client, not Expo Go.

---

## 2. Local Native Build (iOS Simulator)

Build the native iOS project locally and run on the simulator:

```bash
# Generate native project files
npx expo prebuild --clean

# Build & run on iOS Simulator
npx expo run:ios
```

To target a specific simulator:
```bash
npx expo run:ios --device "iPhone 16 Pro"
```

---

## 3. Local Native Build (Physical iPhone)

Connect your iPhone via USB, then:

```bash
npx expo prebuild --clean
npx expo run:ios --device
```

You'll be prompted to select your connected device. Requires:
- Apple Developer account configured in Xcode
- Device registered in your provisioning profile
- Signing certificates set up (Xcode > Signing & Capabilities)

### Manual Xcode Build
```bash
npx expo prebuild --clean
open ios/LessMo.xcworkspace
```
Then in Xcode:
1. Select your device in the top toolbar
2. Set your Team under Signing & Capabilities
3. Press **Cmd+R** to build & run

---

## 4. EAS Build (Cloud)

### Development Build (internal testing)
```bash
eas build --platform ios --profile development
```

### Preview / Ad-hoc Build (device testing)
```bash
eas build --platform ios --profile preview
```
Install via the link EAS provides or scan the QR code.

### Production Build (App Store)
```bash
eas build --platform ios --profile production
```

### Android APK
```bash
eas build --platform android --profile adhoc
```

---

## 5. EAS Submit (App Store / Google Play)

### iOS → App Store Connect
```bash
eas submit --platform ios
```

### Android → Google Play
```bash
eas submit --platform android
```

---

## 6. Testing

### TypeScript Type Check
```bash
npx tsc --noEmit
```

### Run Jest Tests
```bash
npm test
```

### Run specific test file
```bash
npm test -- --testPathPattern="MyComponent"
```

### Lint Check
```bash
npx eslint src/ --ext .ts,.tsx
```

---

## 7. Build Profiles Summary

| Profile | Purpose | Distribution | Simulator |
|---------|---------|-------------|-----------|
| `development` | Dev client with hot reload | Internal | No |
| `preview` | Ad-hoc testing on devices | Internal (ad-hoc) | No |
| `adhoc` | Internal testing (APK for Android) | Internal (ad-hoc) | No |
| `production` | App Store / Play Store release | Store | No |

---

## 8. Quick Reference Commands

```bash
# Full clean rebuild cycle
npx expo prebuild --clean && npx expo run:ios

# Check for errors before building
npx tsc --noEmit

# Install deps after pulling changes
npm install && cd ios && pod install && cd ..

# Clear Metro cache
npx expo start --clear

# Reset Xcode build cache
cd ios && xcodebuild clean && cd ..

# View bundle size
npx react-native-bundle-visualizer

# Update Expo SDK
npx expo install --fix
```

---

## 9. Environment & Config

- **Bundle ID (iOS):** `com.lessmo.app`
- **Package (Android):** `com.lessmo.app`
- **EAS Project ID:** `6efb7e40-76ab-461f-8c48-691488aef80c`
- **iOS Deployment Target:** 16.0
- **Scheme:** `lessmo`

Environment variables (`.env` or EAS secrets):
- `FIREBASE_API_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `SENTRY_ORG`, `SENTRY_PROJECT`
- `APPLE_MERCHANT_ID`

---

## 10. Troubleshooting

| Problem | Solution |
|---------|----------|
| Pod install fails | `cd ios && pod install --repo-update` |
| Sentry CLI errors | Ensure `SENTRY_DISABLE_AUTO_UPLOAD=true` in `.xcode.env.local` |
| Signing issues | Open `.xcworkspace` in Xcode, fix Team under Signing |
| Metro stuck | `npx expo start --clear` |
| "No bundle URL" | Kill Metro, rebuild: `npx expo run:ios` |
| Simulator black screen | Reset simulator: Device → Erase All Content |
