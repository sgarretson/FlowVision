import 'cypress-axe';

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/auth');
    cy.get('#email', { timeout: 10000 }).should('be.visible').clear();
    cy.get('#email').type(email, { log: false });
    cy.get('#password').should('be.visible').clear();
    cy.get('#password').type(password, { log: false });
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
