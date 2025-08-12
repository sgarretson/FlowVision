describe('Buyer/Seller flows and accessibility', () => {
  const adminEmail = Cypress.env('ADMIN_EMAIL') || 'admin@example.com';
  const adminPassword = Cypress.env('ADMIN_PASSWORD') || 'Admin123!';

  beforeEach(() => {
    cy.login(adminEmail, adminPassword);
  });

  it('buyer profile page loads and has no critical a11y violations', () => {
    cy.visit('/profile');
    cy.injectAxe();
    cy.checkA11y(undefined, { includedImpacts: ['critical'] });
    cy.contains('Business Profile');
  });

  it('issues page reachable and a11y check', () => {
    cy.visit('/issues');
    cy.injectAxe();
    cy.checkA11y(undefined, { includedImpacts: ['critical'] });
    cy.contains('Issue Identification');
  });

  it('initiatives page reachable and a11y check', () => {
    cy.visit('/initiatives');
    cy.injectAxe();
    cy.checkA11y(undefined, { includedImpacts: ['critical'] });
    cy.contains('Initiatives');
  });
});
