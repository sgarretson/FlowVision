import 'cypress-axe';

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/auth');
    cy.get('#email').clear().type(email);
    cy.get('#password').clear().type(password);
    cy.contains('Sign In').click();
    cy.url().should('not.include', '/auth');
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
