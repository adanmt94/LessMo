# Configuración de Reglas de Firestore

Para que la app funcione correctamente con grupos y eventos, necesitas actualizar las reglas de seguridad de Firestore en Firebase Console.

## 📋 Reglas de Firestore Necesarias

Ve a Firebase Console → Firestore Database → Reglas y reemplaza con:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Usuarios - Solo pueden leer/escribir su propio documento
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Eventos - Pueden ser leídos por cualquiera autenticado, escritos por el creador
    match /events/{eventId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
                              (request.auth.uid == resource.data.createdBy || 
                               request.auth.uid in resource.data.participantIds);
    }
    
    // Participantes - Pueden ser leídos/escritos por usuarios autenticados del evento
    match /participants/{participantId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;
    }
    
    // Gastos - Pueden ser leídos/escritos por usuarios autenticados del evento
    match /expenses/{expenseId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;
    }
    
    // Grupos - Pueden ser leídos/escritos por miembros del grupo
    match /groups/{groupId} {
      allow read: if request.auth != null && 
                     request.auth.uid in resource.data.memberIds;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
                              request.auth.uid == resource.data.createdBy;
    }
  }
}
```

## ⚠️ IMPORTANTE

Estas reglas son para **desarrollo**. Para producción, necesitarás reglas más estrictas que validen:
- Que los usuarios solo puedan unirse a eventos con inviteCode válido
- Que los gastos solo puedan ser modificados por participantes del evento
- Que los grupos solo permitan agregar eventos creados por miembros

## 🔒 Reglas de Producción (Más Seguras)

Para producción, considera estas reglas más restrictivas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }
    
    match /events/{eventId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && 
                       request.resource.data.createdBy == request.auth.uid;
      allow update: if isAuthenticated() && 
                       (request.auth.uid == resource.data.createdBy ||
                        request.auth.uid in resource.data.participantIds);
      allow delete: if isAuthenticated() && 
                       request.auth.uid == resource.data.createdBy;
    }
    
    match /participants/{participantId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() &&
                       (request.auth.uid == resource.data.userId ||
                        request.auth.uid == get(/databases/$(database)/documents/events/$(resource.data.eventId)).data.createdBy);
      allow delete: if isAuthenticated() &&
                       request.auth.uid == get(/databases/$(database)/documents/events/$(resource.data.eventId)).data.createdBy;
    }
    
    match /expenses/{expenseId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() &&
                               request.auth.uid == resource.data.paidBy;
    }
    
    match /groups/{groupId} {
      allow read: if isAuthenticated() && 
                     request.auth.uid in resource.data.memberIds;
      allow create: if isAuthenticated() &&
                       request.resource.data.createdBy == request.auth.uid &&
                       request.auth.uid in request.resource.data.memberIds;
      allow update: if isAuthenticated() && 
                       request.auth.uid in resource.data.memberIds;
      allow delete: if isAuthenticated() && 
                       request.auth.uid == resource.data.createdBy;
    }
  }
}
```

## 📝 Cómo Aplicar las Reglas

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto LessMo
3. En el menú lateral, ve a **Firestore Database**
4. Haz clic en la pestaña **Reglas**
5. Copia y pega las reglas de desarrollo
6. Haz clic en **Publicar**
7. Espera unos segundos a que se apliquen

## ✅ Verificar que Funcionan

Una vez aplicadas las reglas, la app debería poder:
- ✅ Crear eventos con código de invitación
- ✅ Ver la lista de eventos
- ✅ Crear grupos (sin error de permisos)
- ✅ Ver la lista de grupos
- ✅ Continuar sin registro (autenticación anónima)

## 🐛 Solución de Problemas

Si sigues viendo errores de permisos:

1. **Verifica que las reglas se publicaron**: Ve a Reglas y verifica que aparece la fecha/hora actual
2. **Limpia caché de Firestore**: En el código, a veces tarda unos segundos en aplicar
3. **Verifica la autenticación**: Asegúrate de que `request.auth != null` en los logs
4. **Revisa la consola de Firebase**: Ve a Firestore → Uso para ver errores específicos
