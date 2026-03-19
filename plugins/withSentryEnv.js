/**
 * Expo Config Plugin para inyectar variables de entorno en .xcode.env.local
 * Asegura que SENTRY_DISABLE_AUTO_UPLOAD y NODE_BINARY sobrevivan a prebuild --clean
 */
const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function withSentryEnv(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const xcodeEnvLocal = path.join(config.modRequest.platformProjectRoot, '.xcode.env.local');

      // Detectar ruta real de node (soporta nvm)
      let nodeBinary;
      try {
        nodeBinary = execSync('which node', { encoding: 'utf8' }).trim();
      } catch {
        nodeBinary = '/usr/local/bin/node';
      }

      const lines = [
        `export NODE_BINARY=${nodeBinary}`,
        'export SENTRY_DISABLE_AUTO_UPLOAD=true',
      ];

      fs.writeFileSync(xcodeEnvLocal, lines.join('\n') + '\n');

      return config;
    },
  ]);
}

module.exports = withSentryEnv;
