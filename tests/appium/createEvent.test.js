/**
 * Tests de Crear Evento - Appium
 * Prueba el flujo de creación de eventos y adición de participantes
 */

import { expect } from '@wdio/globals';

describe('Create Event', () => {
  before(async () => {
    // Login primero
    const emailInput = await $('~email-input');
    await emailInput.setValue('test@lessmo.com');
    
    const passwordInput = await $('~password-input');
    await passwordInput.setValue('test123');
    
    const loginButton = await $('~login-button');
    await loginButton.click();
    
    await browser.pause(3000);
    
    // Ir a crear evento
    const createEventButton = await $('~create-event-fab');
    await createEventButton.click();
    await browser.pause(1000);
  });

  it('should show create event form', async () => {
    const eventNameInput = await $('~event-name-input');
    await eventNameInput.waitForDisplayed({ timeout: 5000 });
    
    expect(await eventNameInput.isDisplayed()).toBe(true);
  });

  it('should create event with participants', async () => {
    // Nombre del evento
    const eventNameInput = await $('~event-name-input');
    await eventNameInput.setValue('Viaje a la Playa');
    
    // Descripción
    const descriptionInput = await $('~event-description-input');
    await descriptionInput.setValue('Viaje de verano 2025');
    
    // Presupuesto inicial
    const budgetInput = await $('~initial-budget-input');
    await budgetInput.setValue('1000');
    
    // Seleccionar moneda (USD por defecto)
    
    // Agregar participante 1
    const participant1Name = await $('~participant-0-name-input');
    await participant1Name.setValue('Juan');
    
    const participant1Budget = await $('~participant-0-budget-input');
    await participant1Budget.setValue('500');
    
    // Agregar segundo participante
    const addParticipantButton = await $('~add-participant-button');
    await addParticipantButton.click();
    await browser.pause(500);
    
    const participant2Name = await $('~participant-1-name-input');
    await participant2Name.setValue('María');
    
    const participant2Budget = await $('~participant-1-budget-input');
    await participant2Budget.setValue('500');
    
    // Crear evento
    const createButton = await $('~create-event-button');
    await createButton.click();
    
    await browser.pause(3000);
    
    // Verificar que navegamos al detalle del evento
    const eventDetailTitle = await $('~event-detail-title');
    expect(await eventDetailTitle.isDisplayed()).toBe(true);
    expect(await eventDetailTitle.getText()).toContain('Viaje a la Playa');
  });

  it('should validate required fields', async () => {
    // Volver a home
    const backButton = await $('~back-button');
    await backButton.click();
    await browser.pause(1000);
    
    // Ir a crear nuevo evento
    const createEventButton = await $('~create-event-fab');
    await createEventButton.click();
    await browser.pause(1000);
    
    // Intentar crear sin llenar campos
    const createButton = await $('~create-event-button');
    await createButton.click();
    
    await browser.pause(1000);
    
    // Verificar que seguimos en la pantalla de creación
    const eventNameInput = await $('~event-name-input');
    expect(await eventNameInput.isDisplayed()).toBe(true);
  });

  it('should add and remove participants dynamically', async () => {
    // Agregar participante
    const addButton = await $('~add-participant-button');
    await addButton.click();
    await browser.pause(500);
    
    const participant1 = await $('~participant-1-name-input');
    expect(await participant1.isDisplayed()).toBe(true);
    
    // Eliminar participante
    const removeButton = await $('~remove-participant-1-button');
    await removeButton.click();
    await browser.pause(500);
    
    const isParticipant1Visible = await participant1.isDisplayed().catch(() => false);
    expect(isParticipant1Visible).toBe(false);
  });
});
