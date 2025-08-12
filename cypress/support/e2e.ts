import 'cypress-axe';

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/auth');
    cy.get('#email', { timeout: 10000 })
      .should('be.visible')
      .then(($el) => {
        cy.wrap($el).invoke('val', '').trigger('input');
        cy.wrap($el).invoke('val', email).trigger('input');
      });
    cy.get('#password')
      .should('be.visible')
      .then(($el) => {
        cy.wrap($el).invoke('val', '').trigger('input');
        cy.wrap($el).invoke('val', password).trigger('input');
      });
    cy.get('button[type="submit"]').click();
    cy.location('pathname', { timeout: 10000 }).should('not.include', '/auth');
  });
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
    }
  }
}
