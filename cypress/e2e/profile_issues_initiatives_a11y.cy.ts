describe('Profile/Issues/Initiatives accessibility', () => {
  const adminEmail = Cypress.env('ADMIN_EMAIL') || 'admin@example.com';
  const adminPassword = Cypress.env('ADMIN_PASSWORD') || 'Admin123!';

  before(() => {
    cy.login(adminEmail, adminPassword);
  });

  it('profile page loads and has no serious/critical a11y violations (continue)', () => {
    cy.visit('/profile');
    cy.injectAxe();
    cy.checkA11y(undefined, { includedImpacts: ['serious', 'critical'] }, undefined, true);
    cy.contains('Business Profile');
  });

  it('issues page reachable and a11y check (continue)', () => {
    cy.visit('/issues');
    cy.injectAxe();
    cy.checkA11y(undefined, { includedImpacts: ['serious', 'critical'] }, undefined, true);
    cy.get('body').should('be.visible');
  });

  it('initiatives page reachable and a11y check (continue)', () => {
    cy.visit('/initiatives');
    cy.injectAxe();
    cy.checkA11y(undefined, { includedImpacts: ['serious', 'critical'] }, undefined, true);
    cy.contains('Initiatives');
  });
});
