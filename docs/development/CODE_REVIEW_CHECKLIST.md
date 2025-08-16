# 🔍 Code Review Checklist

## 🎯 **Overview**

This checklist ensures consistent, high-quality code reviews that maintain FlowVision's professional standards and naming conventions.

---

## ✅ **MANDATORY CHECKS**

### **1. Naming Conventions** 🏷️

#### **File Naming**

- [ ] **NO subjective qualifiers**: enhanced, optimized, improved, advanced, better, new, custom, special
- [ ] **Uses functional descriptors**: service, manager, handler, engine, processor, validator, factory
- [ ] **Follows domain-driven pattern**: `{domain}-{function}.ts` (e.g., `ai-service.ts`, `user-authentication.ts`)
- [ ] **Uses kebab-case** for files and directories
- [ ] **Names describe functionality**, not quality or version

#### **Type/Interface Naming**

- [ ] **PascalCase** for classes, interfaces, types, enums
- [ ] **Descriptive names** that explain purpose (e.g., `AuthenticatedUser`, not `EnhancedUser`)
- [ ] **No version indicators** in type names (v1, v2, old, new)
- [ ] **Consistent with domain** language and business terms

#### **Variable/Function Naming**

- [ ] **camelCase** for variables, functions, methods
- [ ] **Descriptive action verbs** for functions (e.g., `validateUserInput`, not `doValidation`)
- [ ] **Clear intent** without abbreviations or cryptic names
- [ ] **Consistent terminology** across the codebase

### **2. Code Quality** 💻

#### **TypeScript Standards**

- [ ] **Strict mode compliance** with no `any` types without justification
- [ ] **Proper type definitions** for all function parameters and returns
- [ ] **Interface definitions** for complex objects and API responses
- [ ] **Null safety** with proper optional chaining and null checks

#### **Function Design**

- [ ] **Single responsibility** - functions do one thing well
- [ ] **Reasonable length** (< 50 lines for most functions)
- [ ] **Clear parameter names** and types
- [ ] **Error handling** with proper try/catch blocks
- [ ] **Input validation** for public functions

#### **Code Organization**

- [ ] **Logical file structure** with related code grouped together
- [ ] **Clear imports** with no unused imports
- [ ] **Consistent indentation** and formatting (Prettier compliance)
- [ ] **Meaningful comments** for complex logic only

### **3. Security & Performance** 🔒

#### **Security Checks**

- [ ] **No hardcoded secrets** or API keys
- [ ] **Input sanitization** for user-provided data
- [ ] **Proper authentication** checks for protected routes
- [ ] **RBAC compliance** for permission-based operations
- [ ] **SQL injection prevention** with parameterized queries

#### **Performance Considerations**

- [ ] **Efficient database queries** with proper indexing
- [ ] **Appropriate caching** for expensive operations
- [ ] **Memory management** with no obvious leaks
- [ ] **Async/await patterns** used correctly
- [ ] **Bundle size impact** considered for frontend changes

### **4. Testing & Documentation** 📝

#### **Test Coverage**

- [ ] **Unit tests** for new functions and components
- [ ] **Integration tests** for API endpoints
- [ ] **Error case testing** with proper assertions
- [ ] **Edge case coverage** for boundary conditions
- [ ] **Mock usage** is appropriate and not excessive

#### **Documentation**

- [ ] **JSDoc comments** for public functions and complex logic
- [ ] **README updates** for new features or breaking changes
- [ ] **API documentation** updated for new endpoints
- [ ] **Architecture documentation** updated for significant changes
- [ ] **Inline comments** explain "why" not "what"

---

## 🔍 **SPECIFIC REVIEW CATEGORIES**

### **Frontend (React/Next.js)**

#### **Component Design**

- [ ] **Functional components** with hooks instead of class components
- [ ] **Proper key props** for lists and dynamic elements
- [ ] **Accessibility compliance** with ARIA labels and semantic HTML
- [ ] **Responsive design** considerations for mobile devices
- [ ] **Error boundaries** for component error handling

#### **State Management**

- [ ] **Appropriate state location** (local vs global)
- [ ] **Immutable updates** for state changes
- [ ] **Effect dependencies** properly declared
- [ ] **Performance optimizations** (memo, callback, useMemo) used judiciously

### **Backend (API Routes)**

#### **API Design**

- [ ] **RESTful conventions** followed for HTTP methods and endpoints
- [ ] **Consistent response formats** with proper status codes
- [ ] **Input validation** with Zod or similar schema validation
- [ ] **Error handling** with meaningful error messages
- [ ] **Rate limiting** considerations for public endpoints

#### **Database Operations**

- [ ] **Prisma best practices** with proper error handling
- [ ] **Transaction usage** for multi-table operations
- [ ] **Query optimization** to avoid N+1 problems
- [ ] **Data validation** before database operations
- [ ] **Proper indexing** for query performance

### **AI/LLM Integration**

#### **AI Service Usage**

- [ ] **Configuration validation** before AI service calls
- [ ] **Error handling** for AI service failures
- [ ] **Response validation** and confidence scoring
- [ ] **Usage tracking** and cost monitoring
- [ ] **Fallback strategies** when AI services are unavailable

#### **Prompt Engineering**

- [ ] **Clear, concise prompts** with proper context
- [ ] **Input sanitization** before sending to AI services
- [ ] **Response parsing** with error handling
- [ ] **Caching strategies** for expensive AI operations

---

## 🚀 **REVIEW PROCESS**

### **Before Requesting Review**

#### **Self-Review Checklist**

- [ ] **Run all tests** locally and ensure they pass
- [ ] **Check TypeScript compilation** with no errors
- [ ] **Run linting** and fix all issues
- [ ] **Verify functionality** manually in development environment
- [ ] **Review own code** line by line for obvious issues

#### **PR Preparation**

- [ ] **Descriptive title** that summarizes the change
- [ ] **Clear description** explaining what and why
- [ ] **Link to related issues** or tickets
- [ ] **Screenshots/demos** for UI changes
- [ ] **Breaking changes** documented with migration notes

### **During Review**

#### **Reviewer Responsibilities**

- [ ] **Review within 24 hours** of assignment
- [ ] **Test functionality** locally if possible
- [ ] **Check all items** in this checklist
- [ ] **Provide constructive feedback** with specific suggestions
- [ ] **Approve only when confident** in code quality

#### **Review Focus Areas**

1. **Critical Issues**: Security vulnerabilities, performance problems, breaking changes
2. **Code Quality**: Naming conventions, structure, maintainability
3. **Functionality**: Does the code work as intended?
4. **Standards Compliance**: Follows team conventions and best practices
5. **Future Impact**: How will this affect future development?

### **After Review**

#### **Author Actions**

- [ ] **Address all feedback** with code changes or explanations
- [ ] **Re-request review** after significant changes
- [ ] **Update tests** if functionality changes
- [ ] **Document decisions** for future reference

#### **Final Checks**

- [ ] **All CI/CD checks pass** including tests, linting, and security scans
- [ ] **No merge conflicts** with target branch
- [ ] **Approval from required reviewers** obtained
- [ ] **Documentation updated** if necessary

---

## 📊 **REVIEW METRICS**

### **Quality Indicators**

- **Review Turnaround Time**: Target < 24 hours
- **Defect Detection Rate**: Issues caught in review vs production
- **Code Consistency**: Adherence to naming and style guidelines
- **Test Coverage**: Maintained or improved with changes

### **Process Improvements**

- **Common Issues**: Track frequently missed items for team training
- **Review Effectiveness**: Measure code quality improvement over time
- **Knowledge Sharing**: Use reviews as learning opportunities
- **Standard Updates**: Evolve checklist based on team experience

---

## 🎯 **ANTI-PATTERNS TO AVOID**

### **Naming Anti-Patterns**

❌ **Subjective Qualifiers**: enhanced, optimized, improved, advanced  
❌ **Temporal Indicators**: v2, new, old, latest  
❌ **Quality Descriptors**: best, super, mega, ultra  
❌ **Cryptic Abbreviations**: usr, btn, mgr, cfg

### **Code Anti-Patterns**

❌ **God Functions**: Functions that do too many things  
❌ **Magic Numbers**: Hardcoded values without explanation  
❌ **Callback Hell**: Deeply nested callbacks instead of async/await  
❌ **Silent Failures**: Catching errors without proper handling

### **Review Anti-Patterns**

❌ **Rubber Stamp Reviews**: Approving without proper examination  
❌ **Nitpicking**: Focusing on trivial issues while missing important ones  
❌ **Late Reviews**: Delaying reviews that block team progress  
❌ **Unclear Feedback**: Comments without specific actionable suggestions

---

## ✅ **CONCLUSION**

This checklist ensures that every code change meets FlowVision's high standards for quality, security, and maintainability. By following these guidelines, we maintain a professional, scalable codebase that supports rapid development and long-term success.

**Remember**: The goal is not perfection, but continuous improvement and consistent quality that enables team success.

---

_Checklist version: 1.0_  
_Last updated: August 2025_  
_Maintained by: Development Team_
