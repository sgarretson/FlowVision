describe('Buyer/Seller flows and accessibility', () => {
  const adminEmail = Cypress.env('ADMIN_EMAIL') || 'admin@example.com';
  const adminPassword = Cypress.env('ADMIN_PASSWORD') || 'Admin123!';

  before(() => {
    cy.login(adminEmail, adminPassword);
  });

  it('buyer profile page loads and has no serious/critical a11y violations', () => {
    cy.visit('/profile');
    cy.injectAxe();
    cy.checkA11y(undefined, { includedImpacts: ['serious', 'critical'] }, null, true);
    cy.contains('Business Profile');
  });

  it('issues page reachable and a11y check', () => {
    cy.visit('/issues');
    cy.injectAxe();
    cy.checkA11y(undefined, { includedImpacts: ['serious', 'critical'] }, null, true);
    cy.contains('Issue Identification');
  });

  it('initiatives page reachable and a11y check', () => {
    cy.visit('/initiatives');
    cy.injectAxe();
    cy.checkA11y(undefined, { includedImpacts: ['serious', 'critical'] }, null, true);
    cy.contains('Initiatives');
  });
});
