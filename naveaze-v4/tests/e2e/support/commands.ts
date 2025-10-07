/// <reference types="cypress" />

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createEvent(eventData: any): Chainable<void>;
      uploadFloorplan(filePath: string): Chainable<void>;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createAd(adData: any): Chainable<void>;
    }
  }
}

// Custom command for file upload
Cypress.Commands.add('uploadFloorplan', (filePath: string) => {
  cy.get('[data-testid="floorplan-upload"]').selectFile(filePath);
});

// Custom command for creating AR ads
// eslint-disable-next-line @typescript-eslint/no-explicit-any
Cypress.Commands.add('createAd', (adData: any) => {
  cy.visit('/ads/create');
  cy.get('[data-testid="ad-title-input"]').type(adData.title);
  cy.get('[data-testid="ad-content-input"]').type(adData.content);
  cy.get('[data-testid="create-ad-button"]').click();
});

// Prevent TypeScript from treating this as a script
export {};