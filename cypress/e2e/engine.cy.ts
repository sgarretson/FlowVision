describe('Engine core flow', () => {
  const adminEmail = Cypress.env('ADMIN_EMAIL') || 'admin@example.com';
  const adminPassword = Cypress.env('ADMIN_PASSWORD') || 'Admin123!';

  before(() => {
    cy.login(adminEmail, adminPassword);
  });
  it('create initiative from issues via API (deterministic)', () => {
    const issues = [
      {
        id: 'dummy-1',
        description: `Cypress auto-generated issue ${Date.now()}`,
        heatmapScore: 75,
        votes: 3,
      },
    ];

    cy.request({
      method: 'POST',
      url: '/api/initiatives/from-issues',
      body: { issues },
    }).then((resp) => {
      expect(resp.status).to.be.oneOf([200, 201]);
      const initiativeId = resp.body?.id;
      expect(initiativeId, 'initiative id').to.be.a('string').and.have.length.greaterThan(0);
      cy.visit(`/initiatives/${initiativeId}`);
      cy.location('pathname', { timeout: 15000 }).should('include', `/initiatives/${initiativeId}`);
    });
  });
});
