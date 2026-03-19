/**
 * Expo Config Plugin para establecer el iOS deployment target mínimo.
 * Necesario porque react-native-skia requiere iOS 16.0+
 * Modifica tanto el Podfile como el proyecto Xcode.
 */
const { withPodfileProperties, withXcodeProject } = require('expo/config-plugins');

function withIosDeploymentTarget(config, { deploymentTarget = '16.0' } = {}) {
  // 1. Set Podfile deployment target
  config = withPodfileProperties(config, (config) => {
    config.modResults['ios.deploymentTarget'] = deploymentTarget;
    return config;
  });

  // 2. Set Xcode project deployment target
  config = withXcodeProject(config, (config) => {
    const project = config.modResults;
    const configurations = project.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      const buildSettings = configurations[key].buildSettings;
      if (buildSettings && buildSettings.IPHONEOS_DEPLOYMENT_TARGET) {
        buildSettings.IPHONEOS_DEPLOYMENT_TARGET = deploymentTarget;
      }
    }
    return config;
  });

  return config;
}

module.exports = withIosDeploymentTarget;
