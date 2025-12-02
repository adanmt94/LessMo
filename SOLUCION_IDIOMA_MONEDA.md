# 🌍 Solución: Idioma y Moneda no se Actualizan Visualmente

## ❗ PROBLEMA IDENTIFICADO

El sistema de idiomas y monedas **funciona correctamente** a nivel de:
- ✅ Estado global (Context API)
- ✅ AsyncStorage (persistencia)
- ✅ Eventos globales (LANGUAGE_CHANGED, CURRENCY_CHANGED)
- ✅ Remount de la app (appKey incrementa correctamente)

**PERO** el UI no se actualiza porque:
❌ Muchas pantallas tienen **textos hardcodeados** en lugar de usar `t('key')`
❌ Algunos símbolos de moneda están hardcodeados como '€'

## 🔍 EJEMPLOS DE CÓDIGO PROBLEMÁTICO

### SettingsScreen.tsx (líneas problemáticas):

```tsx
// ❌ MAL - Hardcodeado
<Text style={styles.sectionTitle}>Preferencias</Text>
<Text style={styles.sectionTitle}>Datos y privacidad</Text>
<Text style={styles.sectionTitle}>Acerca de</Text>
<Text style={styles.signOutText}>Cerrar sesión</Text>

// ✅ BIEN - Usando t()
<Text style={styles.title}>{t('settings.title')}</Text>
<Text style={styles.sectionTitle}>{t('auth.name')}</Text>
```

## 🛠️ SOLUCIÓN PASO A PASO

### 1. Buscar todos los textos hardcodeados

```bash
# En terminal:
grep -r "<Text.*>.*</Text>" src/screens/ --include="*.tsx" | grep -v "{t("
```

### 2. Para cada archivo encontrado:

#### A. Importar useLanguage
```tsx
import { useLanguage } from '../context/LanguageContext';

// En el componente:
const { t } = useLanguage();
```

#### B. Agregar keys al archivo de traducción

**src/i18n/es.json**:
```json
{
  "settings": {
    "title": "Configuración",
    "preferences": "Preferencias",
    "dataPrivacy": "Datos y privacidad",
    "about": "Acerca de",
    "signOut": "Cerrar sesión",
    "theme": "Tema",
    "language": "Idioma",
    "currency": "Moneda"
  }
}
```

**src/i18n/en.json**:
```json
{
  "settings": {
    "title": "Settings",
    "preferences": "Preferences",
    "dataPrivacy": "Data & Privacy",
    "about": "About",
    "signOut": "Sign Out",
    "theme": "Theme",
    "language": "Language",
    "currency": "Currency"
  }
}
```

#### C. Reemplazar texto hardcodeado con t()
```tsx
// ANTES:
<Text style={styles.sectionTitle}>Preferencias</Text>

// DESPUÉS:
<Text style={styles.sectionTitle}>{t('settings.preferences')}</Text>
```

### 3. Archivos que necesitan conversión

Los siguientes archivos probablemente tienen textos hardcodeados:

```
src/screens/
  ├── SettingsScreen.tsx          ⚠️ CRÍTICO - pantalla de idioma
  ├── EventsScreen.tsx            ⚠️ CRÍTICO  
  ├── GroupsScreen.tsx            ⚠️ CRÍTICO
  ├── EventDetailScreen.tsx       ⚠️ ALTO
  ├── GroupEventsScreen.tsx       ⚠️ ALTO
  ├── CreateEventScreen.tsx       📝 MEDIO
  ├── CreateGroupScreen.tsx       📝 MEDIO
  ├── JoinEventScreen.tsx         📝 MEDIO
  ├── AddExpenseScreen.tsx        📝 MEDIO
  └── ProfileScreen.tsx           📝 BAJO
```

## 🧪 CÓMO PROBAR LA SOLUCIÓN

1. **Agregar logging temporal**:
```tsx
const { t, currentLanguage } = useLanguage();

useEffect(() => {
  console.log('🌍 Current Language:', currentLanguage.code);
  console.log('🌍 Translation test:', t('settings.title'));
}, [currentLanguage]);
```

2. **Cambiar idioma** en Settings

3. **Verificar logs**:
```
🌍 Current Language: en
🌍 Translation test: Settings
```

4. **Verificar UI**: El texto debe cambiar inmediatamente

## 💰 PROBLEMA DE MONEDA

Similar al idioma, buscar símbolos hardcodeados:

```bash
grep -r "€" src/screens/ --include="*.tsx"
grep -r "\$" src/screens/ --include="*.tsx"
```

### Solución para moneda:

```tsx
import { useCurrency } from '../hooks/useCurrency';

const { currentCurrency } = useCurrency();

// ANTES:
<Text>1000€</Text>

// DESPUÉS:
<Text>{1000}{currentCurrency.symbol}</Text>
```

## 📊 EJEMPLO COMPLETO: SettingsScreen Fixed

```tsx
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../hooks/useCurrency';

export const SettingsScreen = () => {
  const { t, currentLanguage, changeLanguage } = useLanguage();
  const { currentCurrency } = useCurrency();

  return (
    <ScrollView>
      <Text style={styles.title}>{t('settings.title')}</Text>
      
      {/* Sección Preferencias */}
      <Text style={styles.sectionTitle}>{t('settings.preferences')}</Text>
      
      <SettingRow
        icon="🌍"
        title={t('settings.language')}
        subtitle={currentLanguage.nativeName}
        onPress={() => navigation.navigate('LanguageSelect')}
      />
      
      <SettingRow
        icon="💰"
        title={t('settings.currency')}
        subtitle={`${currentCurrency.name} (${currentCurrency.symbol})`}
        onPress={() => navigation.navigate('CurrencySelect')}
      />
      
      {/* Botón cerrar sesión */}
      <TouchableOpacity onPress={handleSignOut}>
        <Text style={styles.signOutText}>{t('settings.signOut')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};
```

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Por cada archivo:

- [ ] Importar `useLanguage`
- [ ] Extraer `t` del hook
- [ ] Buscar todos los `<Text>hardcoded text</Text>`
- [ ] Agregar keys a `es.json` y `en.json`
- [ ] Reemplazar con `{t('key')}`
- [ ] Probar cambio de idioma
- [ ] Verificar que el texto cambia

### Moneda:

- [ ] Buscar símbolos hardcodeados (€, $)
- [ ] Importar `useCurrency`
- [ ] Reemplazar con `{currentCurrency.symbol}`
- [ ] Probar cambio de moneda

## 🚀 PRIORIDAD DE IMPLEMENTACIÓN

### 1. **CRÍTICO** (hacer YA):
- SettingsScreen.tsx - La pantalla donde cambias el idioma!
- EventsScreen.tsx - Pantalla principal
- GroupsScreen.tsx - Pantalla principal

### 2. **ALTO** (siguiente):
- EventDetailScreen.tsx
- GroupEventsScreen.tsx

### 3. **MEDIO**:
- Pantallas de creación/edición
- Modales y alerts

### 4. **BAJO**:
- Pantallas secundarias
- Mensajes de error (pueden quedarse en español temporalmente)

## 📝 NOTAS IMPORTANTES

1. **No todos los textos necesitan traducción**:
   - Nombres de usuarios: NO traducir
   - Emails: NO traducir
   - Datos dinámicos: NO traducir

2. **Cuidado con los Alerts**:
```tsx
// También necesitan traducción:
Alert.alert(
  t('common.confirm'),  // Título
  t('event.deleteConfirm'),  // Mensaje
  [
    { text: t('common.cancel') },
    { text: t('common.delete') }
  ]
);
```

3. **Testing después de cada cambio**:
   - Cambiar idioma en Settings
   - Verificar que TODO el texto de esa pantalla cambia
   - Si algo no cambia, buscar el hardcoding

## 🎯 RESULTADO ESPERADO

Después de implementar:
1. Cambiar idioma en Settings → **TODO el UI cambia inmediatamente**
2. Cambiar moneda en Settings → **Todos los símbolos cambian**
3. Reiniciar app → **Idioma/moneda persisten**
4. Sin errores en consola
5. Sin "translation missing" warnings

## ⚡ ATAJO RÁPIDO - Script de Búsqueda

```bash
# Encontrar archivos con textos problemáticos:
cd src/screens
for file in *.tsx; do
  echo "=== $file ==="
  grep -n "<Text[^>]*>[^{]" "$file" | head -5
done
```

Esto te mostrará los primeros 5 textos hardcodeados de cada archivo.
