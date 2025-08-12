describe('Engine core flow', () => {
  const adminEmail = Cypress.env('ADMIN_EMAIL') || 'admin@example.com';
  const adminPassword = Cypress.env('ADMIN_PASSWORD') || 'Admin123!';

  before(() => {
    cy.login(adminEmail, adminPassword);
  });
  it('multi-select issues → create initiative', () => {
    cy.visit('/issues');
    // wait for issues to load (stable selector)
    cy.get('.card-secondary', { timeout: 10000 }).should('exist');
    cy.get('[data-cy=issue-checkbox]', { timeout: 10000 })
      .its('length')
      .should('be.greaterThan', 0);
    cy.get('[data-cy=issue-checkbox]').first().check({ force: true });
    cy.contains('Create Initiative from Selected').click();
    cy.location('pathname', { timeout: 15000 }).should('match', /\/initiatives\//);
  });
});
