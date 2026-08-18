# Test Cases: Module 01 - Authentication & User Session

**Module Name:** Authentication (`/auth`)  
**Components Involved:** Login, Sign Up, Guest Access, Password Reset, Session Persistence  
**Author / QA:** QA Engineer  

---

## 📋 Test Cases Matrix

| Test Case ID | Test Scenario / Description | Test Type | Pre-conditions | Test Steps | Test Data / Inputs | Expected Result | Priority | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-AUTH-001** | Verify successful user registration with valid credentials | Functional (Positive) | User is on `/auth` page | 1. Navigate to Sign Up tab<br>2. Enter valid email<br>3. Enter strong password (min 6 chars)<br>4. Click 'Sign Up' | `Email: testuser1@example.com`<br>`Password: Pass@1234` | Account created successfully; user is redirected to Dashboard with active session. | High | Critical |
| **TC-AUTH-002** | Verify registration fails with already registered email | Functional (Negative) | `testuser1@example.com` already exists | 1. Enter existing email<br>2. Enter valid password<br>3. Click 'Sign Up' | `Email: testuser1@example.com`<br>`Password: Pass@1234` | Error toast displayed: *"Email already in use"*; account not duplicated. | High | High |
| **TC-AUTH-003** | Verify validation error for invalid email format | Boundary / Negative | User is on `/auth` page | 1. Enter email without `@` or domain<br>2. Enter valid password<br>3. Click 'Sign Up' | `Email: invalid-email-format`<br>`Password: Pass@1234` | Input validation message shown; submission prevented. | High | Medium |
| **TC-AUTH-004** | Verify password length validation (Boundary Test) | Boundary Value Analysis | User is on `/auth` page | 1. Enter valid email<br>2. Enter password of 5 characters (< minimum 6)<br>3. Click 'Sign Up' | `Email: valid@example.com`<br>`Password: 12345` | Error message: *"Password must be at least 6 characters"*; submission blocked. | High | High |
| **TC-AUTH-005** | Verify successful login with correct credentials | Functional (Positive) | Registered user exists | 1. Navigate to Login tab<br>2. Enter registered email & password<br>3. Click 'Sign In' | `Email: testuser1@example.com`<br>`Password: Pass@1234` | User successfully authenticated; redirected to Dashboard (`/home`). | Critical | Critical |
| **TC-AUTH-006** | Verify login fails with incorrect password | Security (Negative) | Registered user exists | 1. Enter registered email<br>2. Enter incorrect password<br>3. Click 'Sign In' | `Email: testuser1@example.com`<br>`Password: WrongPass99` | Error toast: *"Invalid login credentials"*; user remains on Auth page. | High | High |
| **TC-AUTH-007** | Verify session persistence across browser reload | System / Session | User is logged in | 1. Log into application<br>2. Verify dashboard is visible<br>3. Refresh the browser page (F5) | N/A | User remains logged in; no redirection back to `/auth`. | Critical | High |
| **TC-AUTH-008** | Verify user logout clears session | Functional (Positive) | User is logged in | 1. Click user profile/settings<br>2. Click 'Log Out'<br>3. Attempt to navigate back via browser back button | N/A | Session is terminated; user redirected to landing/auth page; cannot view private dashboard. | High | High |
| **TC-AUTH-009** | Verify SQL Injection / XSS in login input fields | Security Testing | User is on `/auth` page | 1. Enter script tag in email field<br>2. Submit form | `Email: <script>alert(1)</script>` | Input is sanitized; script is not executed; validation fails safely. | Medium | Critical |
