describe('Engine core flow', () => {
  const adminEmail = Cypress.env('ADMIN_EMAIL') || 'admin@example.com';
  const adminPassword = Cypress.env('ADMIN_PASSWORD') || 'Admin123!';

  before(() => {
    cy.login(adminEmail, adminPassword);
  });
  it('multi-select issues → create initiative', () => {
    cy.visit('/issues');
    // wait for issues to load
    cy.contains('Issue Identification', { timeout: 10000 });
    cy.get('.card-secondary input[type="checkbox"]', { timeout: 10000 }).should(
      'have.length.greaterThan',
      1
    );
    cy.get('.card-secondary input[type="checkbox"]').eq(0).check({ force: true });
    cy.get('.card-secondary input[type="checkbox"]').eq(1).check({ force: true });
    cy.contains('Create Initiative from Selected').click();
    cy.location('pathname', { timeout: 15000 }).should('match', /\/initiatives\//);
  });
});
