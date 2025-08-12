describe('Executive dashboard accessibility', () => {
  const adminEmail = Cypress.env('ADMIN_EMAIL') || 'admin@example.com';
  const adminPassword = Cypress.env('ADMIN_PASSWORD') || 'Admin123!';

  before(() => {
    cy.login(adminEmail, adminPassword);
  });

  it('loads executive dashboard and has no critical a11y issues', () => {
    cy.visit('/executive');
    cy.injectAxe();
    cy.checkA11y(undefined, { includedImpacts: ['critical'] });
    cy.contains('Executive');
  });
});
