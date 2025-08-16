# 🔀 Pull Request Template

## 📋 **PR Summary**

**Title**: [Brief, descriptive title following conventional commits]  
**Type**: [feat/fix/docs/style/refactor/test/chore]  
**Sprint**: Sprint [X] - [Sprint Name]  
**Story**: [Story ID] (e.g., SPRINT-11-1)

---

## 📝 **Description**

### **What Changed**

[Clear description of what was implemented, fixed, or changed]

### **Why This Change**

[Business justification or technical reasoning for the change]

### **How It Works**

[Technical explanation of the implementation approach]

---

## 🔗 **Related Issues**

### **Closes/Fixes**

- Closes #[issue-number]
- Fixes #[issue-number]

### **Related**

- Related to #[issue-number]
- Part of Epic: #[epic-issue-number]

---

## 🧪 **Testing**

### **Test Coverage**

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated (if applicable)
- [ ] Manual testing completed

### **Test Results**

```bash
# Paste test results here
npm test
npm run lint
npm run build
```

### **Manual Testing Steps**

1. [Step 1 to manually verify the change]
2. [Step 2 to test edge cases]
3. [Step 3 to verify no regression]

---

## ✅ **Code Review Checklist**

### **Naming Conventions** 🏷️

- [ ] **NO subjective qualifiers**: enhanced, optimized, improved, advanced, better, new, custom, special
- [ ] **Uses functional descriptors**: service, manager, handler, engine, processor, validator, factory
- [ ] **Follows domain-driven pattern**: `{domain}-{function}.ts`
- [ ] **Consistent casing**: kebab-case for files, PascalCase for types, camelCase for variables

### **Code Quality** 💻

- [ ] **TypeScript strict compliance** with proper type definitions
- [ ] **Single responsibility** functions and components
- [ ] **Error handling** implemented with try/catch blocks
- [ ] **Input validation** for all public functions
- [ ] **No hardcoded values** (uses constants or environment variables)

### **Security & Performance** 🔒

- [ ] **No exposed secrets** or API keys
- [ ] **Input sanitization** for user data
- [ ] **Authentication/authorization** checks where needed
- [ ] **Efficient database queries** and caching strategies
- [ ] **Performance impact** considered and documented

### **Documentation** 📝

- [ ] **JSDoc comments** for complex functions
- [ ] **README updates** for new features
- [ ] **API documentation** updated
- [ ] **Architecture docs** updated for significant changes

---

## 🚀 **Deployment**

### **Environment Impact**

- [ ] **Development**: Tested locally
- [ ] **Staging**: Ready for staging deployment
- [ ] **Production**: Ready for production (if applicable)

### **Migration Requirements**

- [ ] **Database migrations**: [None/Description of required migrations]
- [ ] **Environment variables**: [None/List new variables needed]
- [ ] **Dependencies**: [None/List new dependencies added]

### **Rollback Plan**

[Description of how to rollback this change if needed]

---

## 📊 **Impact Assessment**

### **Breaking Changes**

- [ ] **No breaking changes**
- [ ] **Breaking changes documented** (describe below)

**Breaking Change Details** (if applicable):
[Description of breaking changes and migration guide]

### **Performance Impact**

- [ ] **No performance impact**
- [ ] **Performance improvement**
- [ ] **Performance impact documented** (describe below)

**Performance Details** (if applicable):
[Benchmark results or performance analysis]

### **Bundle Size Impact** (Frontend changes)

- [ ] **No significant bundle size increase**
- [ ] **Bundle size impact documented**

---

## 🎯 **Business Value**

### **User Impact**

[How this change benefits end users]

### **Technical Debt**

- [ ] **Reduces technical debt**
- [ ] **No technical debt impact**
- [ ] **Adds technical debt** (justified below)

**Technical Debt Justification** (if applicable):
[Explanation of why technical debt is being added and plan to address it]

---

## 📸 **Screenshots/Demos** (UI Changes)

### **Before**

[Screenshots or GIFs showing current state]

### **After**

[Screenshots or GIFs showing new state]

### **Mobile/Responsive**

[Screenshots showing mobile responsiveness if applicable]

---

## 🔍 **Reviewer Notes**

### **Focus Areas**

- [Specific areas reviewers should focus on]
- [Complex logic that needs careful review]
- [Potential edge cases to consider]

### **Testing Instructions**

1. [Specific steps for reviewers to test the change]
2. [Edge cases to verify]
3. [Performance scenarios to check]

### **Questions for Reviewers**

- [Any specific questions or areas where feedback is needed]
- [Architecture decisions that need validation]
- [Alternative approaches considered]

---

## 📈 **Sprint Context**

### **Story Progress**

- **Story Points**: [X points]
- **Estimation Accuracy**: [On track/Over/Under]
- **Completion Status**: [% complete]

### **Learning & Insights**

- [Key learnings from implementation]
- [Process improvements identified]
- [Knowledge gained for future work]

### **Next Steps**

- [Follow-up work needed]
- [Future enhancements planned]
- [Dependencies for other stories]

---

## 🎉 **Definition of Done**

### **Code Quality Gates**

- [ ] All acceptance criteria met
- [ ] Code follows naming conventions
- [ ] TypeScript compiles without errors
- [ ] All tests pass (unit, integration, e2e)
- [ ] ESLint and Prettier checks pass
- [ ] Security scan shows no high/critical issues

### **Review Gates**

- [ ] Code review completed by senior team member
- [ ] All feedback addressed
- [ ] Performance impact assessed
- [ ] Documentation updated
- [ ] Ready for deployment

---

## 📝 **Additional Notes**

### **Implementation Details**

[Any additional technical details, gotchas, or considerations]

### **Future Considerations**

[Impact on future development, potential extension points]

### **References**

- [Links to relevant documentation, specs, or discussions]
- [Related PRs or issues]

---

**Reviewers**: @[reviewer1] @[reviewer2]  
**Assignees**: @[author]  
**Labels**: `sprint-[X]`, `[type]`, `[priority]`, `ready-for-review`  
**Milestone**: Sprint [X] - [Sprint Name]

---

_PR created: [Date]_  
_Last updated: [Date]_  
_Template version: 1.0_
