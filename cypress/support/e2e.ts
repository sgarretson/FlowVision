import 'cypress-axe';

// Programmatic login via NextAuth credentials provider to avoid flakiness
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    // Get CSRF token
    cy.request('GET', '/api/auth/csrf').then((res) => {
      const csrfToken = res.body?.csrfToken;
      expect(csrfToken, 'csrfToken').to.be.a('string').and.to.have.length.greaterThan(0);
      // Submit credentials to NextAuth callback
      cy.request({
        method: 'POST',
        url: '/api/auth/callback/credentials',
        form: true,
        body: {
          csrfToken,
          email,
          password,
          callbackUrl: '/',
          json: 'true',
        },
        followRedirect: false,
      }).then((resp) => {
        // Should set auth cookies; navigate to home
        expect([200, 302, 303], 'auth response status').to.include(resp.status);
        cy.visit('/');
        cy.location('pathname', { timeout: 10000 }).should('not.include', '/auth');
      });
    });
  });
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
    }
  }
}
