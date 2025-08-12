describe('Admin pages accessibility', () => {
  const adminEmail = Cypress.env('ADMIN_EMAIL') || 'admin@example.com';
  const adminPassword = Cypress.env('ADMIN_PASSWORD') || 'Admin123!';

  beforeEach(() => {
    cy.login(adminEmail, adminPassword);
  });

  it('admin dashboard a11y', () => {
    cy.visit('/admin');
    cy.injectAxe();
    cy.checkA11y(undefined, { includedImpacts: ['critical'] });
    cy.contains('Admin');
  });
});
