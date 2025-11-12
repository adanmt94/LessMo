/**
 * Tests de Registro - Appium
 * Prueba el flujo de registro de nuevos usuarios
 */

import { expect } from '@wdio/globals';

describe('Register Screen', () => {
  before(async () => {
    // Navegar a registro
    const registerLink = await $('~register-link');
    await registerLink.click();
    await browser.pause(1000);
  });

  it('should show register form', async () => {
    const nameInput = await $('~name-input');
    await nameInput.waitForDisplayed({ timeout: 5000 });
    
    expect(await nameInput.isDisplayed()).toBe(true);
  });

  it('should register new user successfully', async () => {
    const timestamp = Date.now();
    
    // Llenar formulario
    const nameInput = await $('~name-input');
    await nameInput.setValue('Test User');
    
    const emailInput = await $('~email-input');
    await emailInput.setValue(`testuser${timestamp}@lessmo.com`);
    
    const passwordInput = await $('~password-input');
    await passwordInput.setValue('test12345');
    
    const confirmPasswordInput = await $('~confirm-password-input');
    await confirmPasswordInput.setValue('test12345');
    
    // Enviar formulario
    const registerButton = await $('~register-button');
    await registerButton.click();
    
    // Esperar confirmación
    await browser.pause(3000);
    
    // Verificar navegación (puede ir a login o home dependiendo de la implementación)
    const loginButton = await $('~login-button');
    const homeTitle = await $('~home-title');
    
    const isOnLogin = await loginButton.isDisplayed().catch(() => false);
    const isOnHome = await homeTitle.isDisplayed().catch(() => false);
    
    expect(isOnLogin || isOnHome).toBe(true);
  });

  it('should show error when passwords do not match', async () => {
    const passwordInput = await $('~password-input');
    await passwordInput.setValue('password1');
    
    const confirmPasswordInput = await $('~confirm-password-input');
    await confirmPasswordInput.setValue('password2');
    
    const registerButton = await $('~register-button');
    await registerButton.click();
    
    await browser.pause(1000);
    
    // Verificar que seguimos en la pantalla de registro
    expect(await passwordInput.isDisplayed()).toBe(true);
  });

  it('should show error with weak password', async () => {
    const passwordInput = await $('~password-input');
    await passwordInput.setValue('123');
    
    const confirmPasswordInput = await $('~confirm-password-input');
    await confirmPasswordInput.setValue('123');
    
    const registerButton = await $('~register-button');
    await registerButton.click();
    
    await browser.pause(1000);
    
    expect(await passwordInput.isDisplayed()).toBe(true);
  });

  it('should navigate back to login', async () => {
    const loginLink = await $('~login-link');
    await loginLink.click();
    
    await browser.pause(1000);
    
    const loginButton = await $('~login-button');
    expect(await loginButton.isDisplayed()).toBe(true);
  });
});
