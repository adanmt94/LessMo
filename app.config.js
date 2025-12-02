import 'dotenv/config';

export default {
  expo: {
    name: "LessMo",
    slug: "lessmo",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    scheme: "lessmo",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#6366F1"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.lessmo.app",
      googleServicesFile: "./GoogleService-Info.plist",
      config: {
        googleSignIn: {
          reservedClientId: "com.googleusercontent.apps.364537925711-vtgqi80bk7i7f3ioqo8gilafo7hjj0vc"
        }
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#6366F1"
      },
      package: "com.lessmo.app",
      googleServicesFile: "./google-services.json"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      eas: {
        projectId: "6efb7e40-76ab-461f-8c48-691488aef80c"
      },
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
      googleAndroidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID,
      googleIosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
      googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID,
      // Configuración de pagos
      PAYPAL_ME_USERNAME: process.env.PAYPAL_ME_USERNAME,
      STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
      BANK_ACCOUNT_NAME: process.env.BANK_ACCOUNT_NAME,
      BANK_ACCOUNT_NUMBER: process.env.BANK_ACCOUNT_NUMBER,
      BANK_NAME: process.env.BANK_NAME,
      BANK_SWIFT_BIC: process.env.BANK_SWIFT_BIC
    }
  }
};
