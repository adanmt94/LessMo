const {
  withAppDelegate,
  withInfoPlist,
  withEntitlementsPlist,
  withXcodeProject,
} = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

/**
 * Plugin de Expo para configurar Widgets nativos, App Intents y Spotlight en iOS
 */
const withLessmoWidget = (config) => {
  // 1. Configurar Info.plist principal
  config = withInfoPlist(config, (config) => {
    if (!config.modResults.NSUserActivityTypes) {
      config.modResults.NSUserActivityTypes = [];
    }
    
    // Register activity types for Spotlight donations
    const activityTypes = [
      'com.lessmo.app.quick-expense',
      'com.lessmo.app.view-event',
      'com.lessmo.app.view-summary',
    ];
    for (const type of activityTypes) {
      if (!config.modResults.NSUserActivityTypes.includes(type)) {
        config.modResults.NSUserActivityTypes.push(type);
      }
    }
    
    // Add Siri usage description
    if (!config.modResults.NSSiriUsageDescription) {
      config.modResults.NSSiriUsageDescription = 
        'LessMo usa Siri para que puedas añadir gastos y consultar tu balance con la voz.';
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
    // App Intents (LessmoIntents.swift) deben añadirse al target principal

    return config;
  });

  return config;
};

module.exports = withLessmoWidget;
