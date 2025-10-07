// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Add custom commands for NavEaze V4
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-button"]').click();
});

interface EventData {
  name: string;
  description: string;
}

Cypress.Commands.add('createEvent', (eventData: EventData) => {
  cy.visit('/events/create');
  cy.get('[data-testid="event-name-input"]').type(eventData.name);
  cy.get('[data-testid="event-description-input"]').type(eventData.description);
  cy.get('[data-testid="create-event-button"]').click();
});

// Global error handling
Cypress.on('uncaught:exception', (err) => {
  // Returning false here prevents Cypress from failing the test
  // on uncaught exceptions that we expect in development
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  return true;
});

// Prevent TypeScript from treating this as a script
export {};