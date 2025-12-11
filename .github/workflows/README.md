# GitHub Actions Workflows para LessMo

Este directorio contiene los workflows de CI/CD para automatizar testing, building y deployment.

## 📁 Workflows Disponibles

### 1. `ci-cd.yml` - Pipeline Principal
Pipeline completo que ejecuta en cada push a master/main/develop y en PRs.

**Jobs incluidos:**
- ✅ **Lint & Type Check**: ESLint + TypeScript
- 🧪 **Tests**: Jest con coverage
- 🏗️ **Build Check**: Verificación de build
- 🔒 **Security Audit**: npm audit
- 📱 **Preview Deploy**: Expo publish en PRs
- 🚀 **Production Deploy**: EAS Build en master

### 2. `test.yml` - Tests Automatizados
Se ejecuta en cambios a código fuente (`src/`, `__tests__/`).

**Características:**
- Matrix strategy: Node 18 y 20
- Coverage reports
- Artifacts de coverage
- Summary en GitHub

## 🔐 Secrets Requeridos

Para que los workflows funcionen correctamente, configura estos secrets en GitHub:

```bash
# Settings > Secrets and variables > Actions > New repository secret
```

### Required Secrets:

1. **`EXPO_TOKEN`**
   - Token de Expo para publicar y hacer builds
   - Obtener en: https://expo.dev/accounts/[username]/settings/access-tokens
   ```bash
   expo login
   expo whoami
   # Crear token en la web
   ```

2. **`CODECOV_TOKEN`** (Opcional)
   - Token para subir coverage a Codecov
   - Obtener en: https://codecov.io/

## 🚀 Uso

### Desarrollo Local
```bash
# Simular lint check
npm run lint

# Simular type check
npx tsc --noEmit --skipLibCheck

# Simular tests
npm test -- --ci --coverage
```

### Triggers

- **Push a `master`/`main`**: Deploy a producción
- **Push a `develop`**: Tests + checks
- **Pull Request**: Tests + preview deploy
- **Cambios en código**: Tests automatizados

## 📊 Coverage Reports

Los reports de coverage se suben como artifacts y están disponibles en:
- GitHub Actions > Run > Artifacts
- Summary de cada run
- Codecov (si está configurado)

## 🔧 Configuración EAS

Para builds de producción, asegúrate de tener configurado `eas.json`:

```json
{
  "build": {
    "production": {
      "ios": {
        "buildType": "release"
      },
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

## 🐛 Troubleshooting

### Build falla en GitHub Actions
- Verificar que `EXPO_TOKEN` esté configurado
- Revisar logs en Actions tab
- Verificar compatibilidad de Node version

### Tests fallan en CI pero pasan local
- Verificar que `jest.config.js` esté commiteado
- Revisar dependencias en `package.json`
- Usar `npm ci` en lugar de `npm install`

### Preview deploy no funciona
- Verificar que el PR venga de una branch del mismo repo
- Forks no tienen acceso a secrets por seguridad

## 📝 Mantenimiento

- **Actualizar Node versions**: Editar `matrix.node-version`
- **Cambiar triggers**: Modificar `on:` en cada workflow
- **Agregar jobs**: Seguir el patrón existente
- **Deshabilitar workflow**: Renombrar `.yml` a `.yml.disabled`
