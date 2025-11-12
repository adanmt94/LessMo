/**
 * Tests de Agregar Gasto - Appium
 * Prueba el flujo de agregar gastos a un evento
 */

import { expect } from '@wdio/globals';

describe('Add Expense', () => {
  before(async () => {
    // Login y navegar a un evento existente
    const emailInput = await $('~email-input');
    await emailInput.setValue('test@lessmo.com');
    
    const passwordInput = await $('~password-input');
    await passwordInput.setValue('test123');
    
    const loginButton = await $('~login-button');
    await loginButton.click();
    
    await browser.pause(3000);
    
    // Seleccionar primer evento
    const firstEvent = await $('~event-item-0');
    await firstEvent.click();
    await browser.pause(2000);
    
    // Ir a agregar gasto
    const addExpenseButton = await $('~add-expense-fab');
    await addExpenseButton.click();
    await browser.pause(1000);
  });

  it('should show add expense form', async () => {
    const descriptionInput = await $('~expense-description-input');
    await descriptionInput.waitForDisplayed({ timeout: 5000 });
    
    expect(await descriptionInput.isDisplayed()).toBe(true);
  });

  it('should add expense successfully', async () => {
    // Descripción
    const descriptionInput = await $('~expense-description-input');
    await descriptionInput.setValue('Cena restaurante');
    
    // Monto
    const amountInput = await $('~expense-amount-input');
    await amountInput.setValue('150');
    
    // Seleccionar categoría
    const categoryPicker = await $('~expense-category-picker');
    await categoryPicker.click();
    await browser.pause(500);
    
    const foodCategory = await $('~category-food');
    await foodCategory.click();
    await browser.pause(500);
    
    // Seleccionar quien pagó
    const paidByPicker = await $('~paid-by-picker');
    await paidByPicker.click();
    await browser.pause(500);
    
    const firstParticipant = await $('~participant-option-0');
    await firstParticipant.click();
    await browser.pause(500);
    
    // Seleccionar beneficiarios (marcar todos)
    const beneficiary1 = await $('~beneficiary-checkbox-0');
    await beneficiary1.click();
    
    const beneficiary2 = await $('~beneficiary-checkbox-1');
    await beneficiary2.click();
    
    // Guardar gasto
    const saveButton = await $('~save-expense-button');
    await saveButton.click();
    
    await browser.pause(3000);
    
    // Verificar que volvemos al detalle del evento
    const expensesList = await $('~expenses-list');
    expect(await expensesList.isDisplayed()).toBe(true);
  });

  it('should validate required fields', async () => {
    // Ir a agregar nuevo gasto
    const addExpenseButton = await $('~add-expense-fab');
    await addExpenseButton.click();
    await browser.pause(1000);
    
    // Intentar guardar sin llenar campos
    const saveButton = await $('~save-expense-button');
    await saveButton.click();
    
    await browser.pause(1000);
    
    // Verificar que seguimos en el formulario
    const descriptionInput = await $('~expense-description-input');
    expect(await descriptionInput.isDisplayed()).toBe(true);
  });

  it('should validate positive amount', async () => {
    const amountInput = await $('~expense-amount-input');
    await amountInput.setValue('0');
    
    const saveButton = await $('~save-expense-button');
    await saveButton.click();
    
    await browser.pause(1000);
    
    expect(await amountInput.isDisplayed()).toBe(true);
  });

  it('should show expense in list after creation', async () => {
    // Volver a la lista
    const backButton = await $('~back-button');
    await backButton.click();
    await browser.pause(1000);
    
    // Verificar que el gasto aparece
    const expenseItem = await $('~expense-item-0');
    expect(await expenseItem.isDisplayed()).toBe(true);
    
    const expenseDescription = await $('~expense-item-0-description');
    expect(await expenseDescription.getText()).toContain('Cena');
  });

  it('should categorize expense correctly', async () => {
    const expenseCategory = await $('~expense-item-0-category');
    expect(await expenseCategory.getText()).toContain('Comida');
  });
});
