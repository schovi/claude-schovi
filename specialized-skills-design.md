# Specialized Skills Design Proposal

**Current State**: 3 auto-detection skills (Jira, GitHub PR, Datadog)
**Proposed**: 15+ specialized auto-detection skills for seamless context enrichment

---

## Design Philosophy

### Core Principles for Skills

1. **Proactive Intelligence** - Auto-detect without user having to invoke commands
2. **Pattern Recognition** - Identify meaningful patterns in natural conversation
3. **Context Enrichment** - Fetch just enough context to be helpful
4. **Non-Intrusive** - Don't slow down conversation or over-fetch
5. **Smart Filtering** - Distinguish actual references from casual mentions

### Skill Activation Pattern

```
User mentions pattern → Skill detects → Evaluates intent → Fetches context → Enriches response
```

### Intent Classification (Critical)

Skills must distinguish:
- ✅ **Active interest**: "What is X?" → FETCH
- ✅ **Problem-solving**: "Debug X" → FETCH
- ❌ **Past reference**: "I fixed X yesterday" → SKIP
- ❌ **Casual mention**: "Similar to X" → SKIP

---

## Current Skills Analysis

### ✅ What's Working Well

**jira-auto-detector**:
- Pattern: `[A-Z]{2,10}-\d{1,6}` (EC-1234)
- Intent: Distinguishes questions from casual mentions
- Integration: Calls jira-analyzer subagent
- Token savings: ~90% (15k → 800 tokens)

**gh-pr-auto-detector**:
- Patterns: URLs, `owner/repo#123`, `#123`
- Intent: Full context, reviews, CI status
- Integration: Calls gh-pr-analyzer subagent
- Token savings: ~95% (50k → 1000 tokens)

**datadog-auto-detector**:
- Patterns: Datadog URLs, service names, natural language
- Intent: Metrics, logs, traces, incidents
- Integration: Calls datadog-analyzer subagent
- Token savings: ~90% (20k → 1200 tokens)

### 🎯 Common Pattern

All skills follow same structure:
1. **Pattern Recognition** - Regex, keywords, URLs
2. **Intent Classification** - Active vs. passive mention
3. **Subagent Delegation** - Fetch via context-isolated subagent
4. **Summary Integration** - Return condensed context

---

## Proposed Specialized Skills

### 1. 🐛 ERROR PATTERN AUTO-DETECTOR

**Skill**: `error-pattern-auto-detector`

**Purpose**: Auto-detect error messages, stack traces, exceptions

**Patterns to Detect**:

```javascript
// Exception patterns
"TypeError: Cannot read property 'id' of undefined"
"ReferenceError: user is not defined"
"Error: ECONNREFUSED"
"NullPointerException at line 45"

// Stack trace patterns
"at UserService.getUser (user-service.ts:45:12)"
"at async processPayment (payment.ts:89)"

// HTTP errors
"500 Internal Server Error"
"404 Not Found: /api/users/123"
"CORS error: Access-Control-Allow-Origin"

// Database errors
"ER_DUP_ENTRY: Duplicate entry 'test@email.com' for key 'email'"
"SQLSTATE[23000]: Integrity constraint violation"

// Runtime errors
"Maximum call stack size exceeded"
"Out of memory"
"Connection timeout after 30000ms"
```

**Intent Classification**:

✅ **FETCH when**:
- "I'm getting [error message]"
- "Debug this error: [error]"
- "What causes [error]?"
- "How to fix [error]?"

❌ **SKIP when**:
- "I fixed [error] yesterday"
- "This is similar to [error] we had before"

**What to Fetch**:

Via `error-analyzer` subagent:
1. **Parse error** - Extract error type, location, message
2. **Find similar issues** - Search codebase for similar errors
3. **Common causes** - Database of common error causes
4. **Fix suggestions** - Likely solutions based on error type
5. **Related code** - Files mentioned in stack trace

**Output** (~500 tokens):
```markdown
╭─────────────────────────────────────╮
│ 🐛 ERROR ANALYZER                   │
╰─────────────────────────────────────╯

Error: TypeError: Cannot read property 'id' of undefined

**Type**: TypeError (null/undefined access)
**Common Causes**:
- Object is null or undefined
- Async operation hasn't completed
- Missing null check

**Location**: services/user-service.ts:45
**Affected Code**: UserService.getUser()

**Similar Issues in Codebase**:
- Fixed in PR #234 (similar null check issue)
- 3 other instances of same pattern

**Quick Fix**:
Add null check before accessing property:
```typescript
if (!user) {
  throw new UserNotFoundError();
}
```

**Related Files**:
- services/user-service.ts:45 (error location)
- models/user.ts:23 (user definition)
- tests/user-service.spec.ts (existing tests)

╰─────────────────────────────────────╯
```

**Integration**:
```
User: "I'm getting TypeError: Cannot read property 'id' of undefined"

Skill detects → Calls error-analyzer subagent → Returns summary

Claude: "I've analyzed this TypeError. It's occurring in UserService.getUser()
at line 45. This is a common null access error - the user object is undefined
when you try to access user.id. Here's how to fix it:

[Uses error context to provide specific solution]
```

---

### 2. 📦 DEPENDENCY AUTO-DETECTOR

**Skill**: `dependency-auto-detector`

**Purpose**: Auto-detect package mentions and provide context

**Patterns to Detect**:

```javascript
// NPM packages
"lodash", "react", "express", "@types/node"

// Package with version
"lodash@4.17.21"
"react@^18.0.0"

// Package.json mentions
"should I use lodash or ramda?"
"upgrade axios to latest"
"remove unused dependencies"

// Import statements
"import { map } from 'lodash'"
"const express = require('express')"

// Dependency errors
"Cannot find module 'express'"
"Module not found: Can't resolve 'react'"
"ERESOLVE unable to resolve dependency tree"
```

**Intent Classification**:

✅ **FETCH when**:
- "What does [package] do?"
- "Should I use [package]?"
- "Compare [package1] vs [package2]"
- "Security issues with [package]?"
- "Upgrade [package]"

❌ **SKIP when**:
- Code snippets (just showing usage)
- Already explaining package

**What to Fetch**:

Via `dependency-analyzer` subagent:
1. **Package info** - Description, current version, popularity
2. **Security** - Known CVEs, outdated versions
3. **Alternatives** - Similar packages
4. **Usage examples** - Common patterns
5. **Bundle size** - Impact on bundle

**Output** (~600 tokens):
```markdown
╭─────────────────────────────────────╮
│ 📦 DEPENDENCY ANALYZER              │
╰─────────────────────────────────────╯

Package: lodash

**Info**:
- Version: 4.17.21 (latest)
- Downloads: 50M/week
- License: MIT
- Bundle size: 24.4kB (gzipped)

**Description**: Utility library for common JavaScript operations

**Security**:
✅ No known vulnerabilities in 4.17.21
⚠️ CVE-2020-8203 in versions < 4.17.21

**Alternatives**:
- Ramda (functional programming focused)
- Native ES6 methods (no dependency)
- Lodash-es (ES6 module version, better tree-shaking)

**Usage in Your Project**:
- Currently using: 4.17.15 (OUTDATED)
- Imports found in: 23 files
- Most used: _.map, _.filter, _.get

**Recommendation**:
⚠️ Upgrade from 4.17.15 → 4.17.21 (security fix)
💡 Consider lodash-es for better tree-shaking

╰─────────────────────────────────────╯
```

---

### 3. 🔗 URL/DOCUMENTATION AUTO-DETECTOR

**Skill**: `url-auto-detector`

**Purpose**: Auto-fetch context from URLs (Stack Overflow, docs, blog posts)

**Patterns to Detect**:

```javascript
// Stack Overflow
"https://stackoverflow.com/questions/12345678/..."
"Check this SO answer: stackoverflow.com/a/12345678"

// Documentation
"https://docs.python.org/3/library/asyncio.html"
"https://reactjs.org/docs/hooks-intro.html"

// Blog posts
"https://martinfowler.com/bliki/CQRS.html"
"https://blog.logrocket.com/..."

// GitHub repos (not PRs)
"https://github.com/facebook/react"

// MDN
"https://developer.mozilla.org/en-US/docs/Web/JavaScript/..."
```

**Intent Classification**:

✅ **FETCH when**:
- "Look at this SO answer: [url]"
- "According to [docs url]..."
- "Implement this pattern: [blog url]"
- Direct URL mention in question

❌ **SKIP when**:
- URL in code comments (not being discussed)
- Reference lists (multiple URLs)

**What to Fetch**:

Via `url-fetcher` subagent (already available as WebFetch):
1. **Page content** - Main text content
2. **Key points** - Extract main ideas
3. **Code examples** - Extract code blocks
4. **Summary** - Condense to key information

**Output** (~800 tokens):
```markdown
╭─────────────────────────────────────╮
│ 🔗 STACK OVERFLOW ANSWER            │
╰─────────────────────────────────────╯

Question: How to fix "TypeError: Cannot read property" in JavaScript

**Top Answer** (1,234 upvotes):

The error occurs when accessing a property on undefined/null.

**Solution**:
```javascript
// Use optional chaining (ES2020+)
const userId = user?.id;

// Or null check
if (user && user.id) {
  const userId = user.id;
}
```

**Why it happens**:
- Async data not loaded yet
- API returned null
- Destructuring before object exists

**Key Points**:
✅ Always check for null/undefined before accessing properties
✅ Use optional chaining (?.) in modern JavaScript
✅ Add defensive programming for external data

**Related Answers**:
- TypeScript strict null checks
- Error handling patterns
- Async/await best practices

╰─────────────────────────────────────╯
```

---

### 4. 🧪 TEST FAILURE AUTO-DETECTOR

**Skill**: `test-failure-auto-detector`

**Purpose**: Auto-detect test failures and provide debugging context

**Patterns to Detect**:

```javascript
// Jest failures
"FAIL tests/user-service.spec.ts"
"Expected: 200, Received: 404"
"Timeout - Async callback was not invoked within 5000ms"

// Mocha/Chai
"AssertionError: expected true to equal false"
"Error: Cannot find element with selector '.user-profile'"

// Test counts
"15 passing, 3 failing"
"1 test suite failed, 3 passed"

// Coverage
"Coverage: 67% (below threshold of 80%)"
```

**Intent Classification**:

✅ **FETCH when**:
- "Test is failing: [test name]"
- "Why is this test failing?"
- "Debug test failure"
- Pasting test output

❌ **SKIP when**:
- "I fixed the failing test"
- Historical mentions

**What to Fetch**:

Via `test-failure-analyzer` subagent:
1. **Parse failure** - Extract test name, assertion, error
2. **Find test file** - Locate test in codebase
3. **Find tested code** - Locate implementation being tested
4. **Recent changes** - Git blame on test and implementation
5. **Similar failures** - Check for pattern

**Output** (~700 tokens):
```markdown
╭─────────────────────────────────────╮
│ 🧪 TEST FAILURE ANALYZER            │
╰─────────────────────────────────────╯

Test: "UserService.getUser should return user"
File: tests/user-service.spec.ts:45

**Failure**:
Expected: 200
Received: 404

**Test Code**:
```typescript
it('should return user', async () => {
  const user = await userService.getUser('123');
  expect(user.statusCode).toBe(200); // FAILS HERE
});
```

**Likely Causes**:
1. User ID '123' doesn't exist in test database
2. Mock not set up correctly
3. Route changed from /users/:id to different path

**Recent Changes**:
⚠️ user-service.ts modified 2 hours ago by you
- Changed findById() to findByEmail()
- May have broken test assumptions

**Quick Fix**:
Update mock or test data:
```typescript
beforeEach(() => {
  mockUserRepo.findById.mockResolvedValue({
    id: '123',
    name: 'Test User'
  });
});
```

╰─────────────────────────────────────╯
```

---

### 5. ⚡ PERFORMANCE METRIC AUTO-DETECTOR

**Skill**: `performance-metric-auto-detector`

**Purpose**: Auto-detect performance issues in logs, metrics

**Patterns to Detect**:

```javascript
// Slow queries
"Query took 2500ms"
"Database query timeout after 30s"
"Slow query logged: SELECT * FROM users"

// Response times
"API response time: 3500ms"
"Request took 5.2s to complete"
"Timeout waiting for response"

// Memory issues
"Heap size: 1.8GB / 2GB (90% used)"
"Memory usage: 95%"
"Garbage collection paused for 2000ms"

// Metrics
"P95 latency: 1200ms"
"Error rate: 15%"
"Throughput: 50 req/s (down 40%)"
```

**Intent Classification**:

✅ **FETCH when**:
- "Response time is 3s, why?"
- "Query taking too long"
- "Memory usage at 95%"
- Performance complaint

❌ **SKIP when**:
- Normal metrics reporting
- "Fixed slow query"

**What to Fetch**:

Via `performance-analyzer` subagent:
1. **Parse metric** - Extract value, threshold, context
2. **Classify issue** - Database, API, memory, CPU
3. **Find code** - Locate slow code path
4. **Compare baseline** - Historical performance
5. **Suggest fixes** - Common optimizations

**Output** (~600 tokens):
```markdown
╭─────────────────────────────────────╮
│ ⚡ PERFORMANCE ANALYZER             │
╰─────────────────────────────────────╯

Issue: Query took 2500ms

**Severity**: ⚠️ High (threshold: 500ms)

**Location**:
- Query: SELECT * FROM orders WHERE user_id = ?
- Code: services/order-service.ts:89

**Problem Type**: N+1 Query Pattern

**Analysis**:
Query is running 200+ times in a loop (classic N+1 problem)

**Impact**:
- User-facing latency: 2.5s
- Database load: High
- Affects: Order listing page

**Quick Fix**:
Add JOIN to fetch related data in single query:
```typescript
// Instead of
const orders = await orderRepo.findAll();
for (const order of orders) {
  order.items = await itemRepo.find(order.id); // N queries
}

// Use
const orders = await orderRepo.findAllWithItems(); // 1 query
```

**Expected Improvement**: 2500ms → 200ms (92% faster)

╰─────────────────────────────────────╯
```

---

### 6. 🔒 SECURITY PATTERN AUTO-DETECTOR

**Skill**: `security-pattern-auto-detector`

**Purpose**: Auto-detect security issues in code snippets

**Patterns to Detect**:

```javascript
// SQL injection
"SELECT * FROM users WHERE id = ${userId}"
`INSERT INTO users VALUES ('${username}')`

// XSS
"innerHTML = userInput"
"dangerouslySetInnerHTML={{ __html: content }}"

// Hardcoded secrets
"const API_KEY = 'sk_live_12345...'"
"password: 'admin123'"
"token: 'ghp_xxxxxxxxxxxx'"

// Insecure crypto
"crypto.createHash('md5')"
"Math.random() for token"

// Auth issues
"if (req.user) { // do admin stuff }"
"router.delete('/users/:id', async () => {})" // No auth check
```

**Intent Classification**:

✅ **FETCH when**:
- Sharing code snippet with security issue
- "Is this secure?"
- "Review this code"

❌ **SKIP when**:
- Already discussing security
- Code in documentation

**What to Fetch**:

Via `security-scanner` subagent:
1. **Detect vulnerability** - Pattern match against OWASP
2. **Classify severity** - Critical, High, Medium, Low
3. **Explain risk** - What could happen
4. **Provide fix** - Secure alternative
5. **Reference** - Link to security docs

**Output** (~500 tokens):
```markdown
╭─────────────────────────────────────╮
│ 🔒 SECURITY SCANNER                 │
╰─────────────────────────────────────╯

⚠️ SQL INJECTION VULNERABILITY DETECTED

**Code**:
```javascript
const query = `SELECT * FROM users WHERE id = ${userId}`;
```

**Severity**: 🔴 CRITICAL

**Risk**:
Attacker can execute arbitrary SQL:
- Read all data: userId = "1 OR 1=1"
- Delete data: userId = "1; DROP TABLE users; --"
- Bypass auth: userId = "1 UNION SELECT * FROM admin"

**Secure Fix**:
```javascript
// Use parameterized query
const query = 'SELECT * FROM users WHERE id = $1';
const result = await db.query(query, [userId]);
```

**Why This Works**:
Parameterized queries separate SQL code from data,
preventing injection attacks.

**Reference**:
OWASP A03:2021 - Injection
CWE-89: SQL Injection

╰─────────────────────────────────────╯
```

---

### 7. 🌐 API ENDPOINT AUTO-DETECTOR

**Skill**: `api-endpoint-auto-detector`

**Purpose**: Auto-detect API endpoints and provide documentation

**Patterns to Detect**:

```javascript
// REST endpoints
"GET /api/users/:id"
"POST /api/orders"
"DELETE /api/products/123"

// Full URLs
"http://localhost:3000/api/users"
"https://api.example.com/v1/products"

// Endpoint errors
"404 on /api/users/123"
"500 error from POST /api/orders"

// Status codes
"API returned 401 Unauthorized"
"Getting 403 Forbidden on /admin"
```

**Intent Classification**:

✅ **FETCH when**:
- "How does /api/users work?"
- "Debug /api/orders endpoint"
- "401 error on /api/login"
- Asking about endpoint

❌ **SKIP when**:
- Code examples (not asking about endpoint)
- Already explaining endpoint

**What to Fetch**:

Via `api-endpoint-analyzer` subagent:
1. **Find endpoint** - Search codebase for route handler
2. **Extract details** - Method, path, params, body, response
3. **Find tests** - Related test cases
4. **Document** - Generate OpenAPI-style documentation
5. **Recent changes** - Git history

**Output** (~700 tokens):
```markdown
╭─────────────────────────────────────╮
│ 🌐 API ENDPOINT ANALYZER            │
╰─────────────────────────────────────╯

Endpoint: GET /api/users/:id

**Location**: api/routes/users.ts:45

**Handler**:
```typescript
router.get('/users/:id', authenticate, async (req, res) => {
  const user = await userService.getUser(req.params.id);
  res.json(user);
});
```

**Parameters**:
- Path: `id` (string, required) - User ID
- Headers: `Authorization: Bearer <token>` (required)

**Response**:
200 OK:
```json
{
  "id": "123",
  "name": "John Doe",
  "email": "john@example.com"
}
```

404 Not Found:
```json
{
  "error": "User not found"
}
```

**Authentication**: Required (JWT token)

**Related**:
- Service: services/user-service.ts:getUser()
- Tests: tests/api/users.spec.ts:45
- Model: models/user.ts

**Recent Changes**:
Modified 3 days ago by Alice: Added email field

╰─────────────────────────────────────╯
```

---

### 8. 📊 LOG PATTERN AUTO-DETECTOR

**Skill**: `log-pattern-auto-detector`

**Purpose**: Auto-detect log entries and extract context

**Patterns to Detect**:

```javascript
// Error logs
"[ERROR] Failed to connect to database"
"ERROR: Cannot read property 'id' of undefined"

// Warning logs
"[WARN] High memory usage: 85%"
"WARNING: API rate limit approaching"

// Info logs with issues
"[INFO] Request failed after 3 retries"

// Log levels
"FATAL", "ERROR", "WARN", "INFO", "DEBUG"

// Timestamps
"2025-01-04T10:30:45.123Z [ERROR]"
"[2025-01-04 10:30:45] ERROR"
```

**Intent Classification**:

✅ **FETCH when**:
- Pasting log entries with errors
- "Getting this error in logs"
- "Why is this being logged?"

❌ **SKIP when**:
- Info logs (no issues)
- Already analyzing logs

**What to Fetch**:

Via `log-analyzer` subagent:
1. **Parse log** - Extract level, message, timestamp, context
2. **Find source** - Locate logging statement in code
3. **Classify issue** - Error type, severity
4. **Find similar** - Search for pattern in log history
5. **Suggest fix** - Based on error type

---

### 9. 🔄 CI/CD FAILURE AUTO-DETECTOR

**Skill**: `ci-failure-auto-detector`

**Purpose**: Auto-detect CI/CD failures and provide debugging help

**Patterns to Detect**:

```javascript
// GitHub Actions
"❌ Run tests (Node.js 16.x)"
"Error: Process completed with exit code 1"

// Build failures
"Build failed: Module not found"
"Compilation error in src/app.ts"

// Deployment failures
"Deployment failed: Health check timeout"
"Error deploying to production"

// Linter failures
"ESLint: 15 errors, 3 warnings"
"Prettier check failed: 8 files need formatting"
```

**Intent Classification**:

✅ **FETCH when**:
- "CI is failing"
- "Build error on main"
- Pasting CI logs

❌ **SKIP when**:
- "CI passed"
- Historical mention

---

### 10. 📁 FILE PATH AUTO-DETECTOR

**Skill**: `file-path-auto-detector`

**Purpose**: Auto-detect file paths and provide quick access/context

**Patterns to Detect**:

```javascript
// Absolute paths
"/src/services/user-service.ts"
"/Users/schovi/projects/app/config.js"

// Relative paths
"./services/user-service.ts"
"../models/user.ts"

// With line numbers
"user-service.ts:45"
"payment.ts:89-123"

// Error file references
"Error in /src/api/routes/users.ts:34"
```

**What to Fetch**:

Via file-reader:
1. **Check if exists** - File present in project
2. **Read content** - If small file, show context
3. **Show location** - Directory structure
4. **Git info** - Last modified, author
5. **Related files** - Imports, tests

---

## Skills Priority Matrix

### Tier 1: Essential (Implement First)

| Skill | Value | Complexity | Priority |
|-------|-------|------------|----------|
| error-pattern-auto-detector | Very High | Low | ⭐⭐⭐⭐⭐ |
| test-failure-auto-detector | High | Medium | ⭐⭐⭐⭐ |
| security-pattern-auto-detector | High | Medium | ⭐⭐⭐⭐ |

**Why**: These catch issues proactively and provide immediate value.

### Tier 2: High Value (Next)

| Skill | Value | Complexity | Priority |
|-------|-------|------------|----------|
| dependency-auto-detector | High | Low | ⭐⭐⭐⭐ |
| performance-metric-auto-detector | High | Medium | ⭐⭐⭐⭐ |
| api-endpoint-auto-detector | Medium | Medium | ⭐⭐⭐ |

**Why**: Common scenarios with clear value.

### Tier 3: Nice to Have

| Skill | Value | Complexity | Priority |
|-------|-------|------------|----------|
| url-auto-detector | Medium | Low | ⭐⭐⭐ |
| log-pattern-auto-detector | Medium | Medium | ⭐⭐⭐ |
| ci-failure-auto-detector | Medium | Medium | ⭐⭐⭐ |
| file-path-auto-detector | Low | Low | ⭐⭐ |

---

## Pattern Recognition Techniques

### Regex Patterns

```javascript
// Error detection
const ERROR_PATTERNS = [
  /TypeError:\s+(.+)/,
  /ReferenceError:\s+(.+)/,
  /Error:\s+(.+)/,
  /Exception:\s+(.+)/,
  /at\s+\w+\.\w+\s+\((.+):(\d+):(\d+)\)/  // Stack trace
];

// Dependency detection
const DEPENDENCY_PATTERNS = [
  /@?[\w-]+\/[\w-]+/,  // Scoped packages
  /[\w-]+@[\d.]+/,      // Version notation
  /npm install (.+)/,
  /yarn add (.+)/
];

// Security patterns
const SECURITY_PATTERNS = [
  /SELECT\s+.*\s+FROM\s+.*\s+WHERE\s+.*\$\{/i,  // SQL injection
  /innerHTML\s*=\s*(?!['"])/,                    // XSS
  /password\s*[:=]\s*['"][\w]+['"]/i,           // Hardcoded password
];

// Performance patterns
const PERF_PATTERNS = [
  /took\s+(\d+)ms/,
  /response\s+time:\s+(\d+)ms/,
  /query\s+took\s+(\d+(\.\d+)?)(ms|s)/i,
];
```

### Keyword Detection

```javascript
// Intent keywords
const ACTIVE_INTENT_KEYWORDS = [
  'debug', 'fix', 'solve', 'help', 'why',
  'what is', 'how to', 'explain', 'analyze'
];

const PASSIVE_KEYWORDS = [
  'fixed', 'solved', 'yesterday', 'last week',
  'similar to', 'like', 'reminds'
];
```

### Context Sensitivity

```javascript
// Don't trigger in code blocks
function isInCodeBlock(text, position) {
  const beforeText = text.substring(0, position);
  const codeBlockCount = (beforeText.match(/```/g) || []).length;
  return codeBlockCount % 2 === 1; // Odd = inside code block
}

// Don't trigger for examples
function isExample(context) {
  return context.includes('for example') ||
         context.includes('e.g.') ||
         context.includes('such as');
}
```

---

## Integration Examples

### Example 1: Error Auto-Detection

```
User: "I'm getting TypeError: Cannot read property 'id' of undefined at
user-service.ts:45"

error-pattern-auto-detector:
  ✅ Detects error pattern
  ✅ Classifies as active intent (user is asking for help)
  ✅ Extracts: error type, location, property
  → Calls error-analyzer subagent
  → Returns condensed analysis (500 tokens)

Claude: "I've detected a TypeError in your UserService. This happens when
you're trying to access the 'id' property on a null or undefined user object.

[Uses error context to provide specific fix with code example]

The error is at user-service.ts:45. I can see you're calling user.id without
checking if user exists first. Here's the fix:..."
```

### Example 2: Dependency Auto-Detection

```
User: "Should I use lodash or ramda for this project?"

dependency-auto-detector:
  ✅ Detects "lodash" and "ramda" package names
  ✅ Classifies as comparison question
  → Calls dependency-analyzer for both packages
  → Returns comparison (1000 tokens total)

Claude: "I've analyzed both lodash and ramda for you:

**Lodash** (detected in your project):
- Currently using v4.17.15 (should upgrade to 4.17.21)
- Used in 23 files
- Bundle size: 24.4kB
- Pros: Familiar API, widely used
- Cons: Large bundle size

**Ramda**:
- Not currently in your project
- Bundle size: 12.4kB (smaller)
- Pros: Functional programming focus, immutable
- Cons: Learning curve, different API

For this project, I'd recommend [specific recommendation based on context]..."
```

### Example 3: Security Auto-Detection

```
User: "Here's my query: const sql = `SELECT * FROM users WHERE id = ${userId}`"

security-pattern-auto-detector:
  🚨 Detects SQL injection pattern
  ✅ High severity
  → Calls security-scanner subagent
  → Returns vulnerability analysis (500 tokens)

Claude: "⚠️ WARNING: I've detected a critical SQL injection vulnerability in
your code.

[Shows security context with specific fix]

This code is vulnerable to SQL injection attacks. An attacker could:
- Read all user data
- Delete your database
- Bypass authentication

Here's the secure fix using parameterized queries:..."
```

---

## Implementation Strategy

### Phase 1: High-Impact Trio (Week 1-2)

Implement these 3 skills first - highest ROI:

1. **error-pattern-auto-detector** + error-analyzer subagent
2. **test-failure-auto-detector** + test-failure-analyzer subagent
3. **security-pattern-auto-detector** + security-scanner subagent

### Phase 2: Expansion (Week 3-4)

4. **dependency-auto-detector** + dependency-analyzer subagent
5. **performance-metric-auto-detector** + performance-analyzer subagent
6. **api-endpoint-auto-detector** + api-endpoint-analyzer subagent

### Phase 3: Completion (Week 5-6)

7. **url-auto-detector** (uses existing WebFetch)
8. **log-pattern-auto-detector** + log-analyzer subagent
9. **ci-failure-auto-detector** + ci-analyzer subagent
10. **file-path-auto-detector** (lightweight, no subagent needed)

---

## Architecture Pattern

### Each Skill Follows Same Structure

```markdown
# skill-name-auto-detector/SKILL.md

---
name: skill-name-auto-detector
description: Auto-detect [pattern] and provide [context]
---

## Pattern Recognition
[Regex patterns, keywords, URL patterns]

## Intent Classification
✅ Fetch when: [Active intent scenarios]
❌ Skip when: [Passive/casual mentions]

## Subagent Integration
Tool: Task
Parameters:
  prompt: "Analyze [detected pattern]"
  subagent_type: "schovi:skill-name-analyzer:skill-name-analyzer"
  description: "[Brief description]"

## Output Integration
[How to use the returned context in response]
```

### Each Subagent Provides

```markdown
# agents/skill-name-analyzer/AGENT.md

---
name: skill-name-analyzer
allowed-tools: [relevant tools]
---

## Input
[What pattern was detected]

## Processing
1. Parse input
2. Fetch related data
3. Analyze
4. Condense

## Output (Max 500-1000 tokens)
Structured summary with visual wrappers

## Token Budget
Max [500-1000] tokens
```

---

## Skill Comparison Table

| Skill | Pattern | Subagent | Tokens | Use Case |
|-------|---------|----------|--------|----------|
| jira-auto-detector | `EC-1234` | jira-analyzer | ~800 | Jira context |
| gh-pr-auto-detector | `#123`, URLs | gh-pr-analyzer | ~1000 | PR context |
| datadog-auto-detector | URLs, metrics | datadog-analyzer | ~1200 | Observability |
| **error-pattern** | TypeErrors, etc | error-analyzer | ~500 | Debug errors |
| **test-failure** | Test output | test-analyzer | ~700 | Fix tests |
| **security-pattern** | SQL, XSS, etc | security-scanner | ~500 | Security |
| **dependency** | Package names | dependency-analyzer | ~600 | Packages |
| **performance** | Slow queries | perf-analyzer | ~600 | Optimize |
| **api-endpoint** | `/api/users` | endpoint-analyzer | ~700 | API docs |
| **url** | Stack Overflow | WebFetch | ~800 | External docs |
| **log-pattern** | Error logs | log-analyzer | ~600 | Debug logs |
| **ci-failure** | Build errors | ci-analyzer | ~700 | Fix CI |
| **file-path** | File refs | (none) | ~200 | File context |

---

## Summary

**Current**: 3 skills (Jira, GitHub PR, Datadog)
**Proposed**: +10 skills = 13 total skills

**High Priority** (Implement first):
1. error-pattern-auto-detector ⭐⭐⭐⭐⭐
2. test-failure-auto-detector ⭐⭐⭐⭐
3. security-pattern-auto-detector ⭐⭐⭐⭐

**Medium Priority**:
4. dependency-auto-detector ⭐⭐⭐⭐
5. performance-metric-auto-detector ⭐⭐⭐⭐
6. api-endpoint-auto-detector ⭐⭐⭐

**Nice to Have**:
7. url-auto-detector ⭐⭐⭐
8. log-pattern-auto-detector ⭐⭐⭐
9. ci-failure-auto-detector ⭐⭐⭐
10. file-path-auto-detector ⭐⭐

**Benefits**:
- ✅ Proactive context enrichment
- ✅ Catches issues before user asks
- ✅ Seamless integration (no extra commands)
- ✅ Maintains token efficiency (500-1000 tokens each)
- ✅ Covers 90% of common debugging scenarios

**Next Steps**:
1. Implement error-pattern-auto-detector (highest value)
2. Test with real errors
3. Expand to test-failure and security
4. Measure impact on debugging efficiency
