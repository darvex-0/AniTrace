# Industry Defect Report Template & Defect Log

---

## 🎯 Defect Lifecycle & Severity Guidelines

### Severity Levels (Technical Impact):
- **Blocker / Critical (S1):** Application crashes, data loss, cannot log in, security vulnerability.
- **Major (S2):** Core feature broken (e.g. cannot update episode count or add anime to watchlist).
- **Minor (S3):** Non-critical feature bug, minor functional inconsistency (e.g. wrong count on stats page).
- **Trivial (S4):** Typo, minor visual padding, alignment glitch that does not affect functionality.

### Priority Levels (Business Urgency):
- **P1 (Immediate):** Fix before any release.
- **P2 (High):** Fix in the current sprint.
- **P3 (Medium / Low):** Fix in upcoming iterations.

---

## 🐛 Documented QA Defect Log

### Defect #1: `BUG-AT-001`
- **Defect Title:** Episode progress allows entering values greater than total episode count
- **Module:** Media Dialog / Watchlist (`MediaDialog.tsx`)
- **Severity:** Major (S2) | **Priority:** High (P2)
- **Status:** Open / Documented
- **Environment:** Chrome 127.0.0, Windows 11, React Localhost

**Preconditions:**
- User is logged in and has an anime with 12 total episodes (e.g., *Death Note* or *Erased*) in their watchlist.

**Steps to Reproduce:**
1. Navigate to the Watchlist tab.
2. Click on the media card to open the Edit Progress Dialog.
3. In the "Current Episode" numeric input, type `99` (where total is `12`).
4. Click the "Save Changes" button.

**Expected Result:**
- Form should validate input and display an inline error: *"Episode progress cannot exceed total episodes (12)"*, preventing save.

**Actual Result:**
- Input saves `99/12` to Firestore, causing progress bar to overflow (>100%) and skewing user watch statistics.

**Artifacts / Evidence:**
- UI Progress bar renders `825%` width, breaking the container card flexbox.

---

### Defect #2: `BUG-AT-002`
- **Defect Title:** Rapid search input causes race condition and stale results in autocomplete dropdown
- **Module:** Search Autocomplete (`src/components/SearchAutocomplete.tsx`)
- **Severity:** Minor (S3) | **Priority:** Medium (P3)
- **Status:** Resolved / Verified

**Steps to Reproduce:**
1. Type "One Piece" quickly, then immediately press backspace 5 times and type "Bleach".
2. Because the first API request was slower to resolve than the second, "One Piece" results overwrite "Bleach" results in the dropdown.

**Expected Result:**
- Previous pending API requests should be cancelled via `AbortController` so only the latest query displays.

**Actual Result:**
- Stale search results displayed in dropdown.
