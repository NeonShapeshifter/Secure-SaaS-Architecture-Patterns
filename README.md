# Secure SaaS Architecture Patterns

![CI Status](https://github.com/NeonShapeshifter/security-portfolio-showcase/actions/workflows/secure-saas-ci-cd.yml/badge.svg)

Production-Ready Security Patterns for Modern SaaS Architectures. 
The focus is on **Defense in Depth**, **Identity Isolation**, and **Resilient Authentication**.

## 🛡️ Architecture Highlights

### 1. Database-Level Tenant Isolation (RLS)
> File: `src/db-isolation-rls.ts`

Instead of relying solely on application-layer logic (which is prone to bugs), this architecture enforces data isolation at the PostgreSQL engine level using **Row Level Security (RLS)**.

- **How it works:** Each request injects a `app.current_tenant` variable into the transaction session.
- **Security Benefit:** Even if a developer forgets to add `.where(tenantId)` in a query, the database will return 0 rows. This eliminates the entire class of "Mass Assignment" and "IDOR" vulnerabilities across tenants.

### 2. Side-Channel Attack Mitigation
> File: `src/secure-auth-handler.ts`

Authentication logic designed to prevent User Enumeration via **Timing Attacks**.

- **The Attack:** Attackers measure response times to guess if an email exists (e.g., "User not found" takes 5ms, "Wrong password" takes 200ms).
- **The Defense:** Implementation of a "Dummy Hash" comparison. The server performs a computationally expensive `bcrypt.compare` operation even if the user is not found, ensuring consistent response times (~200ms) for all outcomes.

### 3. Fail-Closed Session Management
> File: `src/resilient-session.ts`

A security-first approach to distributed session validation.

- **Philosophy:** "Security > Availability" for authentication.
- **Mechanism:** Uses a Circuit Breaker pattern for Redis token blacklists.
- **The Edge Case:** If the Redis cache (used for revocation) goes down, the system **Fails Closed** (rejects requests) rather than Failing Open. This prevents a window of opportunity where revoked tokens (from compromised accounts) could be reused during infrastructure outages.

## 🏗️ Stack
- **TypeScript**
- **PostgreSQL** (Drizzle ORM syntax used in examples)
- **Redis**
- **Node.js / Express Hardening patterns**

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run security tests
npm test

# Build the project
npm run build
```

## 🧪 Testing Strategy
The project uses **Vitest** for verifying security constraints.
- **Fail-Closed Verification:** Ensures that if Redis or other security dependencies fail, the system rejects requests rather than defaulting to an insecure state.
- **Timing Attack Logic:** Tests verify that constant-time operations are prioritized in authentication flows.

---
*Code extracted and sanitized from production-grade SaaS architecture.*
