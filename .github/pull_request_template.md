## Summary

Describe the change and why. Link issues (e.g., #10) and milestone.

## Screenshots / Demos

Add before/after or short clip for UI changes.

## Checklist

- [ ] Scope: one issue per PR, small and focused
- [ ] Conventional title: `type(scope): summary`
- [ ] Tests: unit/integration/e2e updated or added as needed
- [ ] Accessibility: axe serious/critical = 0 on changed pages
- [ ] Analytics: events added if applicable
- [ ] Audit Log: key user actions recorded
- [ ] Docs: PRD/README/CHANGELOG updated if applicable

## Validation

- [ ] `npm run lint` passed
- [ ] `npm test` passed
- [ ] `npm run build` passed
- [ ] `npx prisma validate && npx prisma generate` passed

# Pull Request

## Description

Brief description of what this PR does and why.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [ ] Test updates

## Related Issues

Fixes #(issue number)
Relates to #(issue number)

## Changes Made

- Change 1
- Change 2
- Change 3

## Testing

- [ ] Unit tests pass (`npm test`)
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] No console errors in browser
- [ ] Responsive design tested
- [ ] Database migrations tested (if applicable)

## Database Changes

- [ ] No database changes
- [ ] Schema changes included
- [ ] Migration script provided
- [ ] Seed data updated

## Security Considerations

- [ ] No security implications
- [ ] Input validation added/updated
- [ ] Authentication/authorization checks added
- [ ] Secrets properly managed

## Performance Impact

- [ ] No performance impact expected
- [ ] Potential performance improvement
- [ ] Performance testing completed
- [ ] Database query optimization reviewed

## Documentation

- [ ] README updated (if needed)
- [ ] API documentation updated (if needed)
- [ ] Code comments added for complex logic
- [ ] JSDoc comments added for new functions

## Screenshots (if applicable)

<!-- Add screenshots here if UI changes were made -->

## Deployment Notes

Any special instructions for deployment or configuration changes:

## Checklist

- [ ] I have followed the Cursor rules in `.cursorrules`
- [ ] My code follows the project's coding standards
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Additional Notes

Any additional information or context for reviewers.
