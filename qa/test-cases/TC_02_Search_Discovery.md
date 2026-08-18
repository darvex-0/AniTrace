# Test Cases: Module 02 - Search, Autocomplete & Discovery

**Module Name:** Search & Media Discovery  
**Components Involved:** Search Bar, Dropdown Autocomplete, TMDB API, Gemini AI Fallback, Discover Page  
**Author / QA:** QA Engineer  

---

## 📋 Test Cases Matrix

| Test Case ID | Test Scenario / Description | Test Type | Pre-conditions | Test Steps | Test Data / Inputs | Expected Result | Priority | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-SRCH-001** | Verify search autocomplete returns relevant titles | Functional (Positive) | User on Home / Discover page | 1. Click on search bar<br>2. Type "Naruto"<br>3. Observe autocomplete dropdown | `Query: Naruto` | Dropdown displays matching results (e.g., *Naruto*, *Naruto Shippuden*) with poster, title, and media type. | Critical | High |
| **TC-SRCH-002** | Verify empty / whitespace query behavior | Negative / Edge Case | User on Home page | 1. Click search bar<br>2. Type spaces "   "<br>3. Observe UI response | `Query: "   "` | No API request is triggered; dropdown remains closed or shows prompt to enter search text. | Medium | Low |
| **TC-SRCH-003** | Verify special character search handling | Boundary / Robustness | User on Home page | 1. Type special characters in search<br>2. Observe response | `Query: !@#$%^&*()_+` | System handles query gracefully; displays "No results found" without throwing UI errors or crashing. | High | Medium |
| **TC-SRCH-004** | Verify extremely long search string (Overflow test) | Boundary Value Test | User on Home page | 1. Paste 250+ character string into search input | `Query: 250+ characters` | Input does not break layout or cause UI overflow; truncates or limits search gracefully. | Low | Low |
| **TC-SRCH-005** | Verify AI Autocomplete fallback to TMDB on API key failure | Integration / Resilience | Invalid or expired Gemini Key | 1. Trigger search with "Bleach"<br>2. Gemini returns 403/500 or is empty | `Query: Bleach` | Application smoothly falls back to TMDB search; results still display without alerting breaking errors to user. | Critical | High |
| **TC-SRCH-006** | Verify selecting a search result opens the details dialog | UI / Functional | Search results visible | 1. Click on any item from autocomplete dropdown (e.g. "Attack on Titan") | `Item: Attack on Titan` | Modal dialog opens showing full anime details (Poster, description, total episodes, genres, status). | Critical | High |
| **TC-SRCH-007** | Verify debounce timing on rapid typing | Performance / Network | Network tab open in DevTools | 1. Rapidly type "Fullmetal Alchemist" in < 500ms | `Query: Rapid keystrokes` | Only 1 or 2 debounced API calls are sent instead of sending a request on every single keystroke. | High | Medium |
