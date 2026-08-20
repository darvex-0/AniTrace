# Test Cases: Module 04 - Franchise Relations & Profile Settings

**Module Name:** Franchise Explorer & Profile Settings (`FranchiseDialog.tsx`, `Profile.tsx`)  
**Components Involved:** FranchiseDialog, SpinoffsSection, Profile, Theme Toggle, LocalStorage Persistence  
**Author / QA:** QA Engineer  

---

## 📋 Test Scenarios & Test Cases Matrix

### Scenario 1: Franchise & Connected Works Explorer (FranchiseDialog)
| Test Case ID | Test Scenario / Description | Test Type | Pre-conditions | Test Steps | Test Data / Inputs | Expected Result | Priority | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-FRAN-001** | Verify opening franchise explorer on a media card | Functional (Positive) | Media card exists in watchlist | 1. Click franchise/link icon on a card (e.g. *Steins;Gate*)<br>2. Observe modal dialog | `Item: Steins;Gate` | Franchise dialog opens showing timeline relations (Prequels, Sequels, Movies, Spin-offs). | High | High |
| **TC-FRAN-002** | Verify 1-click addition of connected spin-off to watchlist | Integration / Functional | Franchise timeline displayed | 1. Click '+ Add to Watchlist' next to a recommended sequel<br>2. Confirm pre-filled form | `Action: 1-click add` | MediaDialog opens pre-populated with sequel title, TMDB ID, and total episodes. | High | High |

---

### Scenario 2: User Profile & LocalStorage API Key Configuration (Profile)
| Test Case ID | Test Scenario / Description | Test Type | Pre-conditions | Test Steps | Test Data / Inputs | Expected Result | Priority | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-PROF-001** | Verify saving Gemini API key to browser LocalStorage | Security / Functional | User navigated to `/profile` page | 1. Scroll to AI Autocomplete Settings<br>2. Enter valid API Key format `AIzaSy...`<br>3. Click 'Save Key' | `API Key: AIzaSyD...` | Success toast shown: *"API Key saved successfully"*; key stored in `localStorage.getItem('gemini_api_key')`. | Critical | High |
| **TC-PROF-002** | Verify clearing API key resets to TMDB fallback | Functional (Positive) | API key previously saved | 1. Click 'Clear Key' button<br>2. Navigate to Discover and search | `Action: Clear Key` | `localStorage` entry is removed; app falls back to standard TMDB autocomplete without crashing. | High | Medium |
| **TC-PROF-003** | Verify watch statistics calculation accuracy | Functional / Calculation | User has 3 completed shows (12 eps each = 36 eps) | 1. Navigate to `/profile`<br>2. View Stats Cards (Total Shows, Total Episodes, Days Watched) | `Data: 3 shows, 36 eps` | Stats accurately reflect `Total Shows: 3`, `Total Episodes: 36`, and computed watch time in hours/days. | High | High |
