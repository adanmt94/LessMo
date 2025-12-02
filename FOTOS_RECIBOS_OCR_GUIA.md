# 📸 Guía de Implementación: Fotos de Recibos con OCR

## ✅ Estado Actual

**COMPLETADO:**
- ✅ Campo `receiptPhoto` agregado al tipo `Expense`
- ✅ `expo-image-picker` ya instalado

**PENDIENTE (Requiere configuración nativa):**
- ❌ OCR (extracción automática de montos)
- ❌ Upload de fotos a Firebase Storage

---

## 🎯 Implementación Básica (Sin OCR)

### 1. Modificar AddExpenseScreen

Agregar botón para seleccionar foto:

```tsx
import * as ImagePicker from 'expo-image-picker';

// State
const [receiptPhoto, setReceiptPhoto] = useState<string | null>(null);

// Función para seleccionar foto
const pickImage = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
  if (status !== 'granted') {
    Alert.alert('Permiso denegado', 'Necesitamos acceso a tus fotos');
    return;
  }

  const result = await ImagePicker.launchImagePickerAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.7,
  });

  if (!result.canceled) {
    setReceiptPhoto(result.assets[0].uri);
  }
};

// Función para tomar foto
const takePhoto = async () => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  
  if (status !== 'granted') {
    Alert.alert('Permiso denegado', 'Necesitamos acceso a tu cámara');
    return;
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.7,
  });

  if (!result.canceled) {
    setReceiptPhoto(result.assets[0].uri);
  }
};

// UI
<View style={styles.receiptSection}>
  <Text style={styles.label}>Foto del Recibo (Opcional)</Text>
  
  {receiptPhoto ? (
    <View style={styles.receiptPreview}>
      <Image source={{ uri: receiptPhoto }} style={styles.receiptImage} />
      <TouchableOpacity 
        style={styles.removePhotoButton}
        onPress={() => setReceiptPhoto(null)}
      >
        <Text>✕ Quitar</Text>
      </TouchableOpacity>
    </View>
  ) : (
    <View style={styles.receiptButtons}>
      <Button title="📷 Tomar Foto" onPress={takePhoto} variant="outline" />
      <Button title="🖼️ Galería" onPress={pickImage} variant="outline" />
    </View>
  )}
</View>
```

### 2. Subir Foto a Firebase Storage

```tsx
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const uploadReceiptPhoto = async (uri: string, expenseId: string): Promise<string> => {
  const storage = getStorage();
  const storageRef = ref(storage, `receipts/${expenseId}.jpg`);
  
  // Convertir URI a Blob
  const response = await fetch(uri);
  const blob = await response.blob();
  
  // Subir
  await uploadBytes(storageRef, blob);
  
  // Obtener URL pública
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
};

// En handleSave:
const handleSave = async () => {
  // ... validaciones

  let photoURL: string | undefined = undefined;
  
  if (receiptPhoto) {
    // Crear expense ID temporal
    const tempExpenseId = Date.now().toString();
    photoURL = await uploadReceiptPhoto(receiptPhoto, tempExpenseId);
  }

  await addExpense(
    paidBy,
    amount,
    description,
    category,
    beneficiaries,
    splitType,
    customSplits,
    photoURL // Pasar URL de la foto
  );
};
```

### 3. Actualizar función `addExpense` en Firebase

```typescript
export const addExpense = async (
  paidBy: string,
  amount: number,
  description: string,
  category: ExpenseCategory,
  beneficiaries: string[],
  splitType: 'equal' | 'custom' = 'equal',
  customSplits?: { [participantId: string]: number },
  receiptPhoto?: string // Nuevo parámetro
): Promise<string> => {
  // ...código existente

  const expenseData: any = {
    eventId,
    paidBy,
    amount,
    description,
    category,
    date: new Date(),
    beneficiaries,
    splitType,
    createdAt: new Date(),
  };

  if (customSplits) {
    expenseData.customSplits = customSplits;
  }

  if (receiptPhoto) {
    expenseData.receiptPhoto = receiptPhoto; // Guardar URL
  }

  const docRef = await addDoc(collection(db, 'expenses'), expenseData);
  // ...resto del código
};
```

### 4. Mostrar Foto en ExpenseList

```tsx
// En cada gasto
{expense.receiptPhoto && (
  <TouchableOpacity onPress={() => openReceiptPhoto(expense.receiptPhoto)}>
    <Image 
      source={{ uri: expense.receiptPhoto }} 
      style={styles.receiptThumbnail} 
    />
  </TouchableOpacity>
)}
```

---

## 🤖 Implementación Avanzada (Con OCR)

### Opción A: Google ML Kit (Recomendado)

**Instalar:**
```bash
npx expo install expo-image-manipulator
npm install react-native-vision-camera
npm install vision-camera-ocr
```

**Usar:**
```tsx
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useTextRecognition } from 'vision-camera-ocr';

const extractTextFromImage = async (imageUri: string) => {
  // Procesar imagen
  const result = await useTextRecognition(imageUri);
  
  // Buscar números (montos)
  const amounts = result.text.match(/\d+[.,]\d{2}/g);
  
  if (amounts && amounts.length > 0) {
    // Tomar el monto más grande (normalmente es el total)
    const maxAmount = Math.max(...amounts.map(a => parseFloat(a.replace(',', '.'))));
    setAmount(maxAmount.toString());
  }
};
```

### Opción B: Tesseract.js (Más simple, menos preciso)

**Instalar:**
```bash
npm install tesseract.js
```

**Usar:**
```tsx
import Tesseract from 'tesseract.js';

const extractTextFromImage = async (imageUri: string) => {
  const { data: { text } } = await Tesseract.recognize(imageUri, 'spa', {
    logger: m => console.log(m)
  });
  
  // Buscar números
  const amounts = text.match(/\d+[.,]\d{2}/g);
  
  if (amounts) {
    const maxAmount = Math.max(...amounts.map(a => parseFloat(a.replace(',', '.'))));
    setAmount(maxAmount.toString());
    Alert.alert('Monto detectado', `Se encontró: €${maxAmount}`);
  }
};

// Llamar después de seleccionar foto
const pickImage = async () => {
  // ...código de selección
  if (!result.canceled) {
    const uri = result.assets[0].uri;
    setReceiptPhoto(uri);
    
    // Extraer texto automáticamente
    await extractTextFromImage(uri);
  }
};
```

---

## 📝 Estilos CSS

```tsx
receiptSection: {
  marginBottom: 16,
},
receiptButtons: {
  flexDirection: 'row',
  gap: 8,
},
receiptPreview: {
  position: 'relative',
},
receiptImage: {
  width: '100%',
  height: 200,
  borderRadius: 8,
  resizeMode: 'cover',
},
removePhotoButton: {
  position: 'absolute',
  top: 8,
  right: 8,
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 16,
},
receiptThumbnail: {
  width: 60,
  height: 60,
  borderRadius: 4,
  marginTop: 8,
},
```

---

## ⚙️ Configuración de Permisos

### iOS (app.json)
```json
{
  "expo": {
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "La app necesita acceso a tus fotos para adjuntar recibos",
          "cameraPermission": "La app necesita acceso a tu cámara para tomar fotos de recibos"
        }
      ]
    ]
  }
}
```

### Android (app.json)
```json
{
  "expo": {
    "android": {
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    }
  }
}
```

---

## 🔒 Reglas de Firebase Storage

Agregar en Firebase Console → Storage → Rules:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /receipts/{receiptId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
        && request.resource.size < 5 * 1024 * 1024 // Max 5MB
        && request.resource.contentType.matches('image/.*');
    }
  }
}
```

---

## 🚀 Próximos Pasos

1. ✅ Implementar selección de foto (básico)
2. ⏳ Configurar Firebase Storage
3. ⏳ Subir fotos al storage
4. ⏳ Mostrar thumbnails en lista
5. ⏳ Modal de vista completa de foto
6. ⏳ Implementar OCR con ML Kit
7. ⏳ Auto-rellenar monto detectado

---

## 💡 Tips

- **Compresión**: Usar `quality: 0.7` para reducir tamaño
- **Aspect Ratio**: `[4, 3]` es el estándar para recibos
- **Cache**: Guardar fotos localmente antes de subir
- **Offline**: Queue de upload cuando vuelva conexión
- **OCR Accuracy**: Funciona mejor con buena iluminación y enfoque

---

## 📊 Estimación de Tiempo

- Básico (solo foto): **1-2 horas**
- Con upload a Storage: **2-3 horas**
- Con OCR simple (Tesseract): **3-4 horas**
- Con OCR avanzado (ML Kit): **6-8 horas** (requiere configuración nativa)

---

**ESTADO ACTUAL**: Implementación básica lista, pendiente configuración de Storage y OCR.
