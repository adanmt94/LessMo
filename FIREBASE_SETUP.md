# Configuración de Firebase

Para que la aplicación LessMo funcione correctamente, necesitas configurar Firebase:

## 1. Crear proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto llamado "LessMo"
3. Habilita Google Analytics (opcional)

## 2. Configurar Authentication

1. En Firebase Console, ve a **Authentication** > **Sign-in method**
2. Habilita los siguientes proveedores:
   - Email/Password
   - Google (opcional)
   - Apple (opcional - solo para iOS)

## 3. Configurar Firestore Database

1. En Firebase Console, ve a **Firestore Database**
2. Crea una base de datos en modo **producción**
3. Configura las reglas de seguridad:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regla para usuarios
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Regla para eventos
    match /events/{eventId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.createdBy == request.auth.uid;
    }
    
    // Regla para participantes
    match /participants/{participantId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Regla para gastos
    match /expenses/{expenseId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## 4. Obtener configuración de Firebase

1. En Firebase Console, ve a **Project Settings** (⚙️)
2. En la sección **Your apps**, selecciona **Web** (</>)
3. Registra tu app con el nombre "LessMo Web"
4. Copia los valores de `firebaseConfig`

## 5. Actualizar archivo firebase.ts

Abre el archivo `/src/services/firebase.ts` y reemplaza estos valores:

```typescript
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

## 6. Configuración para iOS (Apple Sign In)

Si quieres habilitar Apple Sign In:

1. En Firebase Console > Authentication > Sign-in method > Apple
2. Sigue las instrucciones para configurar Apple Developer
3. Agrega tu Bundle ID de iOS

## 7. Configuración para Android (Google Sign In)

Si quieres habilitar Google Sign In en Android:

1. Genera el SHA-1 de tu keystore:
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
2. En Firebase Console > Project Settings > Your apps > Android
3. Agrega el SHA-1 generado

## ⚠️ Seguridad

**NUNCA** subas tu archivo `firebase.ts` con las credenciales reales a un repositorio público.

Para producción, considera usar variables de entorno:

1. Instala `expo-constants`:
   ```bash
   npm install expo-constants
   ```

2. Crea archivo `app.config.js`:
   ```javascript
   export default {
     expo: {
       extra: {
         firebaseApiKey: process.env.FIREBASE_API_KEY,
         firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
         // ... resto de variables
       }
     }
   }
   ```

3. Usa en tu código:
   ```typescript
   import Constants from 'expo-constants';
   
   const firebaseConfig = {
     apiKey: Constants.expoConfig?.extra?.firebaseApiKey,
     // ...
   };
   ```
