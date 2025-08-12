describe('Engine core flow', () => {
  it('multi-select issues → create initiative', () => {
    cy.visit('/issues');
    cy.get('input[type="checkbox"]').first().check({ force: true });
    cy.get('input[type="checkbox"]').eq(1).check({ force: true });
    cy.contains('Create Initiative from Selected').click();
    cy.url().should('include', '/initiatives/');
  });
});
