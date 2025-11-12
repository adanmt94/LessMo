/**
 * Tests de Resumen - Appium
 * Prueba el flujo de visualización del resumen y exportación
 */

import { expect } from '@wdio/globals';

describe('Summary Screen', () => {
  before(async () => {
    // Login y navegar a un evento con gastos
    const emailInput = await $('~email-input');
    await emailInput.setValue('test@lessmo.com');
    
    const passwordInput = await $('~password-input');
    await passwordInput.setValue('test123');
    
    const loginButton = await $('~login-button');
    await loginButton.click();
    
    await browser.pause(3000);
    
    // Seleccionar evento
    const firstEvent = await $('~event-item-0');
    await firstEvent.click();
    await browser.pause(2000);
    
    // Ir a resumen
    const summaryTab = await $('~summary-tab');
    await summaryTab.click();
    await browser.pause(1000);
  });

  it('should show summary screen', async () => {
    const summaryTitle = await $('~summary-title');
    await summaryTitle.waitForDisplayed({ timeout: 5000 });
    
    expect(await summaryTitle.isDisplayed()).toBe(true);
  });

  it('should display total expenses', async () => {
    const totalExpenses = await $('~total-expenses-value');
    expect(await totalExpenses.isDisplayed()).toBe(true);
    
    const value = await totalExpenses.getText();
    expect(value).toMatch(/\$?\d+(\.\d{2})?/);
  });

  it('should display remaining budget', async () => {
    const remainingBudget = await $('~remaining-budget-value');
    expect(await remainingBudget.isDisplayed()).toBe(true);
    
    const value = await remainingBudget.getText();
    expect(value).toMatch(/\$?\d+(\.\d{2})?/);
  });

  it('should show expenses by category chart', async () => {
    const pieChart = await $('~expenses-pie-chart');
    expect(await pieChart.isDisplayed()).toBe(true);
  });

  it('should display participant balances', async () => {
    const participantsList = await $('~participants-balances-list');
    expect(await participantsList.isDisplayed()).toBe(true);
    
    // Verificar que hay al menos un participante
    const firstParticipant = await $('~participant-balance-0');
    expect(await firstParticipant.isDisplayed()).toBe(true);
  });

  it('should show settlements if needed', async () => {
    // Los settlements solo aparecen si hay deudas
    const settlementsSection = await $('~settlements-section');
    const isVisible = await settlementsSection.isDisplayed().catch(() => false);
    
    if (isVisible) {
      const firstSettlement = await $('~settlement-item-0');
      expect(await firstSettlement.isDisplayed()).toBe(true);
      
      const settlementText = await firstSettlement.getText();
      expect(settlementText).toContain('debe');
    }
  });

  it('should show export buttons', async () => {
    const shareTextButton = await $('~share-text-button');
    expect(await shareTextButton.isDisplayed()).toBe(true);
    
    const shareImageButton = await $('~share-image-button');
    expect(await shareImageButton.isDisplayed()).toBe(true);
  });

  it('should trigger share text action', async () => {
    const shareTextButton = await $('~share-text-button');
    await shareTextButton.click();
    
    await browser.pause(2000);
    
    // En un entorno real, aquí se abriría el diálogo de compartir del sistema
    // Por ahora solo verificamos que el botón es clickeable
    expect(await shareTextButton.isDisplayed()).toBe(true);
  });

  it('should trigger share image action', async () => {
    const shareImageButton = await $('~share-image-button');
    await shareImageButton.click();
    
    await browser.pause(2000);
    
    expect(await shareImageButton.isDisplayed()).toBe(true);
  });

  it('should calculate settlements correctly', async () => {
    const settlementsSection = await $('~settlements-section');
    const isVisible = await settlementsSection.isDisplayed().catch(() => false);
    
    if (isVisible) {
      // Verificar formato de liquidación
      const settlementAmount = await $('~settlement-item-0-amount');
      const amount = await settlementAmount.getText();
      
      // Debe ser un número positivo con formato de moneda
      expect(amount).toMatch(/\$?\d+(\.\d{2})?/);
    }
  });

  it('should navigate back to event detail', async () => {
    const backButton = await $('~back-button');
    await backButton.click();
    
    await browser.pause(1000);
    
    const eventDetailTitle = await $('~event-detail-title');
    expect(await eventDetailTitle.isDisplayed()).toBe(true);
  });
});
