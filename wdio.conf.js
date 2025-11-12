/**
 * Configuración de WebDriverIO para Appium
 * Tests automatizados para LessMo en iOS y Android
 */

export const config = {
  // Runner
  runner: 'local',
  
  // Specs
  specs: [
    './tests/appium/**/*.test.js'
  ],
  
  // Capabilities
  capabilities: [{
    // Android
    platformName: 'Android',
    'appium:deviceName': 'Android Emulator',
    'appium:platformVersion': '13.0',
    'appium:automationName': 'UiAutomator2',
    'appium:app': './android/app/build/outputs/apk/debug/app-debug.apk',
    'appium:appWaitActivity': '.MainActivity',
    'appium:newCommandTimeout': 240,
  }],
  
  // Test Configurations
  logLevel: 'info',
  bail: 0,
  baseUrl: 'http://localhost',
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  
  // Services
  services: ['appium'],
  
  // Framework
  framework: 'mocha',
  reporters: ['spec'],
  
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000
  },
  
  // Hooks
  before: function (capabilities, specs) {
    console.log('🚀 Iniciando tests de LessMo...');
  },
  
  after: function (result, capabilities, specs) {
    console.log('✅ Tests completados');
  }
};
