# AniTrace - Software Testing & QA Master Plan (STLC)

---

## 📌 1. Project Overview & Scope
**Project Name:** AniTrace Watch Companion  
**Application Type:** Single Page Web Application (React, Vite, TypeScript, Firebase)  
**QA Lead / Tester:** Software Quality Assurance Engineer (Portfolio Project)  
**Testing Objective:** Validate end-to-end user journeys, functional accuracy, API reliability, responsive UI behavior, security boundaries, and cross-browser stability.

---

## 🏗️ 2. Software Testing Life Cycle (STLC) Structure

```
qa/
├── test-plan/
│   └── QA_MASTER_TEST_PLAN.md      <-- Overall strategy, test types, and scope
├── test-cases/
│   ├── TC_01_Authentication.md     <-- Login, Signup, Password, Session persistence
│   ├── TC_02_Search_Discovery.md   <-- TMDB/Gemini search, autocomplete, edge inputs
│   ├── TC_03_Watchlist_Tracking.md <-- Add media, episode progress (+/-), validation
│   └── TC_04_Franchise_Profile.md  <-- Franchise explorer, profile stats, API keys
├── bug-reports/
│   └── DEFECT_LOG.md               <-- Documented defects with severity & priority
├── e2e-automation/                 <-- Playwright Page Object Model E2E test suites
└── api-tests/                      <-- API schema & contract tests in Vitest
```

---

## 🎯 3. Scope of Testing & Functional Coverage

### Complete Module Coverage:
1. **Module 1 - Authentication & Sessions:** Login, Register, Guest mode, Session persistence, Validation errors (`TC_01_Authentication.md`).
2. **Module 2 - Search & Discovery:** Real-time search, Debounce latency, Empty/Edge queries, TMDB fallback (`TC_02_Search_Discovery.md`).
3. **Module 3 - Watchlist & Progress Tracking:** Media CRUD, Increment/Decrement (+/-) buttons, Boundary checks, Filter tabs (`TC_03_Watchlist_Tracking.md`).
4. **Module 4 - Franchise & Profile:** Connected works explorer, 1-click addition, LocalStorage API key persistence, Stats calculations (`TC_04_Franchise_Profile.md`).
5. **Integration & API Contract Testing:** TMDB API schema validation, Gemini API fallback, Firebase Auth & Firestore sync (`src/test/tmdb.api.test.ts`).
6. **Automated CI/CD Pipeline:** GitHub Actions running on every Push and Pull Request (`.github/workflows/test.yml`).

---

## ⚡ 4. Test Execution Guidelines

### 1. Manual Testing:
Follow step-by-step test instructions in each module test file under `/qa/test-cases/` and log any deviations in `/qa/bug-reports/DEFECT_LOG.md`.

### 2. White-Box Unit & API Contract Automation:
```bash
npm test
```

### 3. Black-Box End-to-End Browser Automation:
```bash
npx playwright test
```
