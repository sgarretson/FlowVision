describe('Admin pages accessibility', () => {
  const adminEmail = Cypress.env('ADMIN_EMAIL') || 'admin@example.com';
  const adminPassword = Cypress.env('ADMIN_PASSWORD') || 'Admin123!';

  before(() => {
    cy.login(adminEmail, adminPassword);
  });

  it('admin dashboard a11y (serious/critical only, continue on failure)', () => {
    cy.visit('/admin');
    cy.injectAxe();
    cy.checkA11y(undefined, { includedImpacts: ['serious', 'critical'] }, null, true);
    cy.contains('Admin');
  });
});
