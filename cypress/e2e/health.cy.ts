describe('App health', () => {
  it('loads home and auth', () => {
    cy.visit('/');
    cy.request('/api/health').its('status').should('eq', 200);
    cy.visit('/auth');
  });
});
