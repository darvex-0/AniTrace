# QA Test Plan - AniTrace Watch Companion

This document outlines the comprehensive Quality Assurance (QA) and testing strategy for **AniTrace**, a distraction-free watch companion for anime, TV series, and movies. This plan is designed to validate core functionality, API integrations, real-time database synchronization, and UI responsiveness.

---

## 🎯 Test Strategy Overview

The testing strategy for AniTrace is divided into four main layers:
1. **Unit & Integration Testing:** Validating helper functions and core logic using **Vitest** and **React Testing Library**.
2. **API & Integration Testing:** Verifying robust integration with third-party APIs (TMDB API and Google Gemini 2.5 Flash API) under various network conditions, rate limits, and failure modes.
3. **State & Database Sync Testing:** Validating real-time database syncing with **Firebase Firestore** and authentication states with **Firebase Auth** (including offline persistence).
4. **UI/UX & Accessibility Testing:** Verifying responsiveness, fluid animations (Framer Motion), dark-mode styling, and screen-reader accessibility (via Radix Primitives).

---

## 🛠️ Test Environment & Configurations

- **Frontend Tech Stack:** React 18, Vite, Tailwind CSS, Framer Motion, Shadcn UI
- **Backend Tech Stack:** Firebase (Auth, Firestore, Hosting)
- **API Dependencies:** Google Gemini 2.5 Flash API, TMDB API (v3)
- **Testing Frameworks:** Vitest, JSDOM, React Testing Library
- **Target Browsers:** Chrome, Safari, Firefox, Edge, and mobile viewports (iOS Safari, Android Chrome)

---

## 📋 Detailed Test Scenarios

### 1. Google Gemini 2.5 Flash API & TMDB Autocomplete
*Testing file: [`src/lib/gemini.ts`](file:///c:/Users/Rakesh/Vs%20code/AniTrace/AniTrace/src/lib/gemini.ts)*

* **Scenario 1.1: Autocomplete Fallback Mechanism**
  * **Test Case:** When `VITE_GEMINI_API_KEY` is empty/missing, the system should seamlessly fallback to the TMDB API search autocomplete.
  * **Steps:**
    1. Clear the Gemini API key from browser local storage and ensure `.env` has no Gemini key.
    2. Input "Attack on Titan" in the search input.
    3. Verify that the network requests are directed to `api.themoviedb.org/3/search/multi`.
    4. Confirm results are rendered correctly with `isAI: false`.
  * **Expected Result:** Autocomplete results are loaded from TMDB without any UI errors or console crashes.

* **Scenario 1.2: AI Autocomplete Content Validation**
  * **Test Case:** Ensure Gemini API returns the correct JSON schema (`title`, `type`, `total_eps`, `total_seasons`, `notes`) and parses it safely.
  * **Steps:**
    1. Save a valid Gemini API key in settings.
    2. Input "Steins" in the search box.
    3. Intercept Gemini's JSON response and verify it matches the `AISuggestion` interface.
    4. Verify that total episodes and season suggestions are populated correctly in the dropdown.
  * **Expected Result:** Dropdown renders with 5 accurate AI-augmented suggestions and labels them with an "AI" badge.

* **Scenario 1.3: Handling Non-Deterministic LLM Responses & JSON Schema Errors**
  * **Test Case:** If Gemini returns a non-JSON output, markdown wraps (e.g., \`\`\`json ... \`\`\`), or partial data, ensure the app falls back to TMDB safely without crashing.
  * **Steps:**
    1. Mock the Gemini fetch response with raw conversational text instead of JSON.
    2. Trigger an autocomplete search.
    3. Verify that the error is caught, logged as a warning, and TMDB autocomplete results are fetched and displayed instead.
  * **Expected Result:** System handles parsing failures gracefully and falls back to TMDB autocomplete.

---

### 2. Firebase Authentication & Realtime Firestore Sync
*Testing file: [`src/lib/firebase.ts`](file:///c:/Users/Rakesh/Vs%20code/AniTrace/AniTrace/src/lib/firebase.ts)*

* **Scenario 2.1: Authentication Session Persistence**
  * **Test Case:** User login status is maintained upon tab reload or browser restart.
  * **Steps:**
    1. Register/Login a test user.
    2. Add an item (e.g., "Spirited Away") to the watchlist.
    3. Reload the browser tab.
    4. Verify the dashboard retains the user session and the user's watchlist is rendered immediately.
  * **Expected Result:** Session persist state (local storage/indexedDB) is loaded, avoiding the login screen redirect.

* **Scenario 2.2: Firestore Real-Time Watchlist Synchronization**
  * **Test Case:** Changes in the watchlist are synced instantly across multiple active devices/browser tabs.
  * **Steps:**
    1. Log in with the same credentials on two different browsers (Chrome and Firefox).
    2. On Chrome, update the progress of "Chainsaw Man" from "Ep 2" to "Ep 6".
    3. Observe the Firefox screen without performing any refresh.
  * **Expected Result:** Firefox watchlist updates the episode count to "Ep 6" in real-time (< 1s delay) through Firestore snapshot listeners.

* **Scenario 2.3: Offline Mode Persistence**
  * **Test Case:** Verify changes made offline are queued and synchronized when network connectivity is restored.
  * **Steps:**
    1. Log in and load the watchlist.
    2. Disconnect the system network (simulate offline mode in DevTools).
    3. Add a new anime, e.g., "Demon Slayer", to the watchlist.
    4. Verify the UI updates locally (optimistic UI update).
    5. Reconnect to the network.
    6. Verify that the new item is synced to the Firestore remote server database.
  * **Expected Result:** Local edits are queued in Firestore's offline cache and successfully synchronized upon reconnection.

---

### 3. UI/UX, Layout, & Responsive Viewports
*Testing components: [`src/components/MediaDialog.tsx`](file:///c:/Users/Rakesh/Vs%20code/AniTrace/AniTrace/src/components/MediaDialog.tsx), [`src/components/Sidebar.tsx`](file:///c:/Users/Rakesh/Vs%20code/AniTrace/AniTrace/src/components/Sidebar.tsx)*

* **Scenario 3.1: Responsive Navigation Layout**
  * **Test Case:** The navigation layout adapts correctly to mobile viewports.
  * **Steps:**
    1. Open the dashboard on a Desktop screen (width >= 1024px). Confirm [`Sidebar.tsx`](file:///c:/Users/Rakesh/Vs%20code/AniTrace/AniTrace/src/components/Sidebar.tsx) is visible.
    2. Resize viewport to Mobile (width <= 768px).
    3. Confirm sidebar is hidden, and the mobile bottom navigation bar ([`BottomNav.tsx`](file:///c:/Users/Rakesh/Vs%20code/AniTrace/AniTrace/src/components/BottomNav.tsx)) is visible.
  * **Expected Result:** Grid layout transitions smoothly without overlapping text or clipping cards.

* **Scenario 3.2: Media Dialog Modals & Interactive Actions**
  * **Test Case:** Progress dialog updates are validated before persisting to state.
  * **Steps:**
    1. Click on a watchlist card to open the media edit dialog.
    2. Attempt to input a completed episode count greater than the total episode count (e.g., Ep 15 of 12).
    3. Check for validation warnings.
  * **Expected Result:** Dialog prevents saving an episode number greater than the total episode length, enforcing data validation rules.

---

## ⚡ Automated Test Execution

AniTrace uses **Vitest** for running unit and component integration tests.

### Running Unit & Integration Tests:
```bash
npm run test
```

### Running in Watch Mode (for local development QA):
```bash
npm run test:watch
```

---

## 📈 Quality Metrics & Performance Targets
* **Lighthouse Performance Score:** > 90 (optimized bundle size, lazy loading of dialogs and framer-motion components).
* **Lighthouse Accessibility Score:** > 95 (enforcing ARIA labels on Radix modal dialog inputs, high contrast ratios on dark mode).
* **API Fault Tolerance:** 100% of failed TMDB/Gemini fetch requests are caught and gracefully reported via custom alerts (Sonner toast notifications) without freezing the UI.
