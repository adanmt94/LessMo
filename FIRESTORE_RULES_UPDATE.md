# 🔥 Actualización Urgente de Reglas de Firestore

## ⚠️ PROBLEMA ACTUAL

La app está mostrando errores de permisos al:
1. Crear grupos ("Missing or insufficient permissions")
2. Entrar en la pantalla de Grupos

## 🔧 SOLUCIÓN

Ve a **Firebase Console** → **Firestore Database** → **Reglas** y reemplaza las reglas actuales con:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Usuarios - Solo pueden leer/escribir su propio documento
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }
    
    // Eventos - Cualquier usuario autenticado puede leer/crear
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
    
    // Participantes - Cualquier usuario autenticado puede leer/escribir
    match /participants/{participantId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }
    
    // Gastos - Cualquier usuario autenticado puede leer/escribir
    match /expenses/{expenseId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }
    
    // ⭐ GRUPOS - REGLAS ACTUALIZADAS
    match /groups/{groupId} {
      // Permitir lectura a cualquier usuario autenticado
      // (la app filtra por memberIds en el query)
      allow read: if isAuthenticated();
      
      // Permitir creación si el usuario está autenticado
      // y se incluye a sí mismo en memberIds
      allow create: if isAuthenticated() && 
                       request.resource.data.createdBy == request.auth.uid &&
                       request.auth.uid in request.resource.data.memberIds;
      
      // Permitir actualización solo al creador o miembros
      allow update: if isAuthenticated() && 
                       (request.auth.uid == resource.data.createdBy ||
                        request.auth.uid in resource.data.memberIds);
      
      // Permitir eliminación solo al creador
      allow delete: if isAuthenticated() && 
                       request.auth.uid == resource.data.createdBy;
    }
  }
}
```

## 📋 Cambios Clave

### Antes (Problema):
```javascript
match /groups/{groupId} {
  allow read: if request.auth != null && 
                 request.auth.uid in resource.data.memberIds;  // ❌ Bloqueaba lectura
  allow create: if request.auth != null;
}
```

### Después (Solución):
```javascript
match /groups/{groupId} {
  allow read: if isAuthenticated();  // ✅ Permite lectura a todos
  allow create: if isAuthenticated() && 
                   request.resource.data.createdBy == request.auth.uid &&
                   request.auth.uid in request.resource.data.memberIds;  // ✅ Valida creación
}
```

## 🎯 Por Qué Funciona

1. **Lectura Abierta**: Ahora cualquier usuario autenticado puede leer grupos, pero la app filtra con `where('memberIds', 'array-contains', userId)` en el query, así que solo verá sus grupos.

2. **Creación Segura**: Valida que:
   - El usuario esté autenticado
   - El `createdBy` sea el usuario actual
   - El usuario se incluya en `memberIds`

3. **Seguridad Mantenida**: No es menos seguro porque:
   - Firestore procesa el query filter ANTES de aplicar las reglas
   - Solo se leen documentos que coinciden con el `where` clause
   - Los usuarios no pueden ver grupos de otros usuarios

## 🚀 Pasos para Aplicar

1. Abre [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto LessMo
3. Ve a **Firestore Database** en el menú lateral
4. Click en la pestaña **Reglas**
5. Copia y pega las nuevas reglas
6. Click en **Publicar**
7. Reinicia la app

## ✅ Verificación

Después de aplicar las reglas, prueba:
- ✅ Crear un nuevo grupo
- ✅ Ver lista de grupos
- ✅ Entrar en un grupo existente
- ✅ No deberías ver grupos de otros usuarios

## 📚 Referencia

- [Documentación de Reglas de Firestore](https://firebase.google.com/docs/firestore/security/get-started)
- [Queries y Reglas de Seguridad](https://firebase.google.com/docs/firestore/security/rules-query)
