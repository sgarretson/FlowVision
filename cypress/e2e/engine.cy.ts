describe('Engine core flow', () => {
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
