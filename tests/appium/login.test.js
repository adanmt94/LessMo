/**
 * Tests de Login - Appium
 * Prueba el flujo de inicio de sesión con email/password y Google
 */

import { expect } from '@wdio/globals';

describe('Login Screen', () => {
  it('should show login screen', async () => {
    // Esperar a que cargue la pantalla de login
    const emailInput = await $('~email-input');
    await emailInput.waitForDisplayed({ timeout: 10000 });
    
    expect(await emailInput.isDisplayed()).toBe(true);
  });

  it('should login with valid credentials', async () => {
    // Ingresar email
    const emailInput = await $('~email-input');
    await emailInput.setValue('test@lessmo.com');
    
    // Ingresar contraseña
    const passwordInput = await $('~password-input');
    await passwordInput.setValue('test123');
    
    // Presionar botón de login
    const loginButton = await $('~login-button');
    await loginButton.click();
    
    // Verificar que se navega a Home
    const homeTitle = await $('~home-title');
    await homeTitle.waitForDisplayed({ timeout: 10000 });
    expect(await homeTitle.isDisplayed()).toBe(true);
  });

  it('should show error with invalid credentials', async () => {
    const emailInput = await $('~email-input');
    await emailInput.setValue('invalid@test.com');
    
    const passwordInput = await $('~password-input');
    await passwordInput.setValue('wrong');
    
    const loginButton = await $('~login-button');
    await loginButton.click();
    
    // Esperar alerta de error
    await browser.pause(2000);
    
    // Verificar que aún estamos en login (no navegó)
    expect(await emailInput.isDisplayed()).toBe(true);
  });

  it('should navigate to register screen', async () => {
    const registerLink = await $('~register-link');
    await registerLink.click();
    
    // Verificar que estamos en registro
    const registerTitle = await $('~register-title');
    await registerTitle.waitForDisplayed({ timeout: 5000 });
    expect(await registerTitle.isDisplayed()).toBe(true);
  });

  it('should show Google Sign-In button', async () => {
    const googleButton = await $('~google-signin-button');
    expect(await googleButton.isDisplayed()).toBe(true);
    expect(await googleButton.getText()).toContain('Google');
  });
});
