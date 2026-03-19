# 💰 LessMo - Gestión de Gastos Compartidos

LessMo es una aplicación móvil desarrollada con **React Native + Expo** para gestionar gastos compartidos en viajes, eventos o presupuestos grupales.

## 🚀 Características principales

- ✅ Autenticación con Firebase (Email/Password + Google/Apple)
- 📊 Gestión de eventos con presupuesto inicial configurable
- 💸 Registro de gastos con categorías y división automática
- 👥 Múltiples participantes con presupuestos individuales
- 📈 Gráficos y resúmenes de gastos por categoría
- 🔄 Cálculo automático de liquidaciones entre participantes
- 🌍 Soporte multi-moneda (EUR, USD, GBP, MXN, ARS, COP, CLP, BRL, etc.)
- 📱 Interfaz moderna y responsive

## 📋 Requisitos previos

- Node.js (v16 o superior)
- npm o yarn
- Expo CLI
- Cuenta de Firebase configurada
- Dispositivo móvil o emulador con Expo Go

## 🛠️ Instalación

### 1. Clonar el repositorio (si aplica)

```bash
git clone <tu-repo>
cd LessMo
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto o usa uno existente
3. Habilita **Authentication** (Email/Password, Google, Apple)
4. Crea una base de datos **Firestore**
5. Copia tu configuración de Firebase
6. Abre `src/services/firebase.ts` y reemplaza los valores:

```typescript
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto-id",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

**📌 Ver instrucciones detalladas en:** `FIREBASE_SETUP.md`

### 4. Configurar reglas de Firestore

En Firebase Console > Firestore Database > Rules, pega:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /events/{eventId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.createdBy == request.auth.uid;
    }
    
    match /participants/{participantId} {
      allow read, write: if request.auth != null;
    }
    
    match /expenses/{expenseId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🏃 Ejecutar la aplicación

### Modo desarrollo

```bash
npm start
# o
npx expo start
```

Luego:
- Escanea el código QR con **Expo Go** (Android/iOS)
- Presiona `i` para abrir en **simulador iOS**
- Presiona `a` para abrir en **emulador Android**
- Presiona `w` para abrir en **navegador web**

### Compilar para producción

```bash
# Android
npx expo build:android

# iOS
npx expo build:ios
```

## 📁 Estructura del proyecto

```
LessMo/
├── src/
│   ├── components/       # Componentes reutilizables
│   │   └── lovable/      # Componentes UI (Button, Input, Card, etc.)
│   ├── context/          # Contextos de React (AuthContext)
│   ├── hooks/            # Custom hooks (useAuth, useExpenses)
│   ├── navigation/       # Configuración de navegación
│   ├── screens/          # Pantallas de la app
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── CreateEventScreen.tsx
│   │   ├── EventDetailScreen.tsx
│   │   ├── AddExpenseScreen.tsx
│   │   └── SummaryScreen.tsx
│   ├── services/         # Servicios externos (Firebase)
│   └── types/            # Tipos TypeScript
├── App.tsx               # Punto de entrada principal
├── package.json          # Dependencias
└── tsconfig.json         # Configuración TypeScript
```

## 🎯 Flujo de la aplicación

1. **Login/Registro**: Autenticación con Firebase
2. **Home**: Lista de eventos creados
3. **Crear Evento**: Configurar presupuesto, moneda y participantes
4. **Detalle del Evento**: Ver gastos, participantes y resumen
5. **Agregar Gasto**: Registrar gastos con categoría y división
6. **Resumen**: Visualizar gráficos y liquidaciones sugeridas

## 💡 Uso de GitHub Copilot Pro+

Para aprovechar Copilot en el desarrollo:

1. **Autocompletado**: Escribe comentarios descriptivos antes de funciones
2. **Refactorización**: Selecciona código y pide a Copilot mejoras
3. **Validaciones**: Agrega comentarios como `// TODO: Validar email` y deja que Copilot sugiera
4. **Tests**: Copilot puede generar tests unitarios para tus funciones

### Ejemplos de prompts útiles:

```typescript
// Crear una función que valide el formato de email
// Copilot generará automáticamente la función

// Agregar validación para números negativos
// Copilot sugerirá el código de validación

// Formatear fecha a formato DD/MM/YYYY
// Copilot completará la implementación
```

## 🐛 Troubleshooting

### Error: Firebase not initialized
- Verifica que hayas configurado correctamente `firebaseConfig` en `src/services/firebase.ts`

### Error: Navigation not working
- Asegúrate de que todas las dependencias de React Navigation estén instaladas
- Ejecuta `npm install` de nuevo

### Error: TypeScript errors
- Ejecuta `npx tsc --noEmit` para verificar errores
- Revisa que todas las interfaces en `src/types/index.ts` estén correctas

### Problemas con Expo
- Limpia la caché: `npx expo start -c`
- Reinstala node_modules: `rm -rf node_modules && npm install`

## 📚 Tecnologías utilizadas

- **React Native** - Framework móvil
- **Expo** - Plataforma de desarrollo
- **TypeScript** - Tipado estático
- **Firebase** - Backend (Auth + Firestore)
- **React Navigation** - Navegación
- **React Native Chart Kit** - Gráficos
- **Async Storage** - Almacenamiento local

## 🎨 Paleta de colores

- **Primario**: #6366F1 (Índigo)
- **Secundario**: #10B981 (Verde)
- **Peligro**: #EF4444 (Rojo)
- **Fondo**: #F9FAFB (Gris claro)

## 📝 Próximas características (roadmap)

- [ ] Exportar resumen a PDF
- [ ] Compartir evento por enlace
- [ ] Notificaciones push
- [ ] Soporte para imágenes de gastos
- [ ] División personalizada de gastos
- [ ] Modo offline
- [ ] Temas claro/oscuro

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 👨‍💻 Autor

Desarrollado con ❤️ usando React Native + Expo + Firebase

---

**¿Necesitas ayuda?** Abre un issue en GitHub o contacta al equipo de desarrollo.
