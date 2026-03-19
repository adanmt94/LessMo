const {
  withAppDelegate,
  withInfoPlist,
  withEntitlementsPlist,
  withXcodeProject,
} = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

/**
 * Plugin de Expo para configurar Widgets nativos en iOS
 */
const withLessmoWidget = (config) => {
  // 1. Configurar Info.plist principal
  config = withInfoPlist(config, (config) => {
    if (!config.modResults.NSUserActivityTypes) {
      config.modResults.NSUserActivityTypes = [];
    }
    
    // Agregar App Groups
    if (!config.modResults.CFBundleDocumentTypes) {
      config.modResults.CFBundleDocumentTypes = [];
    }

    return config;
  });

  // 2. Configurar Entitlements
  config = withEntitlementsPlist(config, (config) => {
    config.modResults['com.apple.security.application-groups'] = [
      'group.com.lessmo.app.widgets',
    ];

    return config;
  });

  // 3. Configurar Xcode Project (agregar Widget Extension)
  config = withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    const targetName = 'LessmoWidget';
    const targetDisplayName = 'LessmoWidget';

    // Nota: Esta es una configuración básica
    // La Widget Extension se debe agregar manualmente en Xcode
    // Este plugin solo prepara el entorno

    return config;
  });

  return config;
};

module.exports = withLessmoWidget;
