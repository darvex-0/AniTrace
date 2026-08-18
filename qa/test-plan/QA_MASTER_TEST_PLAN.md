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
│   ├── TC_03_Watchlist_Tracking.md <-- Add, edit episodes, delete, status filters
│   └── TC_04_UI_Responsiveness.md  <-- Mobile/Desktop viewports, dark mode, layout
├── bug-reports/
│   ├── BUG_TEMPLATE.md             <-- Standardized defect logging template
│   └── DEFECT_LOG.md               <-- Documented defects logged during testing
├── api-tests/                      <-- API endpoints testing, Postman/Newman collections
└── e2e-automation/                 <-- Playwright / Vitest automated test suites
```

---

## 🎯 3. Scope of Testing

### In-Scope:
1. **Functional Testing:** Authentication (Login/Register/Guest), Search & Filtering, Watchlist CRUD (Create, Read, Update, Delete), Profile updates.
2. **Non-Functional Testing:** UI/UX responsiveness across devices (Desktop, Tablet, Mobile), Performance (page load, search latency), Error Handling.
3. **Integration Testing:** Firebase Auth & Firestore real-time sync, TMDB API, Gemini API fallback.
4. **Boundary & Negative Testing:** Empty searches, extreme episode inputs, invalid email/passwords, offline network mode.

### Out-of-Scope:
- Direct load testing over 10,000 concurrent users against free-tier Firebase quotas.

---

## 📊 4. Test Deliverables
1. Comprehensive Test Case Matrix (Positive, Negative, Boundary).
2. Bug Reports with reproduction steps, severity, and root-cause analysis.
3. Automated Component/Unit Test Suite (Vitest).
4. Automated End-to-End Test Suite (Playwright).
5. Final QA Execution Summary & Sign-off Report for LinkedIn portfolio.
