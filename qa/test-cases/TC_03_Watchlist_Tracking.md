# Test Cases: Module 03 - Watchlist Management, Progress Dialog & Media CRUD

**Module Name:** Watchlist Tracking & Progress Updating (`Index.tsx`, `ProgressDialog.tsx`, `MediaDialog.tsx`)  
**Components Involved:** MediaCard, ProgressDialog, MediaDialog, Status Filter Tabs, Sort Selector  
**Author / QA:** QA Engineer  

---

## 📋 Test Scenarios & Test Cases Matrix

### Scenario 1: Media Creation & Validation (MediaDialog)
| Test Case ID | Test Scenario / Description | Test Type | Pre-conditions | Test Steps | Test Data / Inputs | Expected Result | Priority | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-WL-001** | Verify adding new anime with valid details | Functional (Positive) | User logged in on Watchlist page | 1. Click '+ Add Media' button<br>2. Enter title "Demon Slayer"<br>3. Select Type: "Anime", Status: "Watching"<br>4. Enter Total Episodes: 26, Season: 1<br>5. Click 'Save' | `Title: Demon Slayer`<br>`Type: Anime`<br>`Total Eps: 26` | Dialog closes; new media card appears in 'Watching' tab with 0/26 progress. | Critical | Critical |
| **TC-WL-002** | Verify mandatory title validation | Functional (Negative) | MediaDialog is open | 1. Leave Title field completely empty<br>2. Fill other optional fields<br>3. Click 'Save' | `Title: ""` | Validation error shown: *"Title is required"*; form submission is blocked. | High | High |
| **TC-WL-003** | Verify invalid streaming URL format | Boundary / Negative | MediaDialog is open | 1. Enter valid title<br>2. In Source Link, type "not-a-valid-url"<br>3. Click 'Save' | `Source Link: not-a-valid-url` | Error message displayed: *"Must be a valid URL"*; item not saved. | Medium | Medium |

---

### Scenario 2: Episode Progress Updating (ProgressDialog)
| Test Case ID | Test Scenario / Description | Test Type | Pre-conditions | Test Steps | Test Data / Inputs | Expected Result | Priority | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-WL-004** | Verify quick episode increment (+ button) | Functional (Positive) | Item exists with Ep: 5/12 | 1. Click progress badge on card<br>2. Click '+' button once<br>3. Click 'Save Progress' | `Action: +1 increment` | Episode count updates from 5 to 6; card progress bar updates width. | High | High |
| **TC-WL-005** | Verify episode decrement (- button) does not go below 0 | Boundary Value Analysis | Item exists with Ep: 0/12 | 1. Open Progress Dialog on Ep 0 item<br>2. Click '-' button<br>3. Observe input value | `Action: -1 from 0` | Episode input remains at 0 (disabled or clamped); negative values prevented. | High | Medium |
| **TC-WL-006** | Verify boundary check for episode count exceeding total | Boundary Value Analysis | Item exists with Total Eps: 12 | 1. Open Progress Dialog<br>2. Type episode `15` manually<br>3. Click 'Save Progress' | `Episode: 15 / 12` | Inline validation error displayed: *"Season 1 only has 12 episodes. You can't set episode 15."* | Critical | High |

---

### Scenario 3: Watchlist Filtering, Sorting & Deletion
| Test Case ID | Test Scenario / Description | Test Type | Pre-conditions | Test Steps | Test Data / Inputs | Expected Result | Priority | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-WL-007** | Verify filtering by status tabs (Watching, Completed, Plan to Watch) | Functional (Positive) | Watchlist contains items in different statuses | 1. Click 'Completed' tab<br>2. Observe rendered items<br>3. Click 'Plan to Watch' tab | `Tabs: Completed, Plan to Watch` | Only media cards matching the active tab status are displayed. | High | High |
| **TC-WL-008** | Verify search filter within personal watchlist | Functional (Positive) | Watchlist contains 5+ items | 1. Type "Attack" in the watchlist search box<br>2. Observe filtered list | `Search Query: Attack` | List filters instantly to only show cards matching "Attack". | High | Medium |
| **TC-WL-009** | Verify delete confirmation dialog prevents accidental deletion | Functional / UX | Item exists in list | 1. Open edit dialog or click delete icon<br>2. Click 'Cancel' in confirmation modal | `Action: Cancel delete` | Dialog dismisses; media card remains intact in the watchlist. | High | High |
