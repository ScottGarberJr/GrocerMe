# GrocerMe V1 Build Checklist

This checklist breaks the V1 implementation into numbered tasks. Each task includes actionable subtasks and clear acceptance criteria.

---

## 1. Project & Environment Setup

### 1.1 Initialize Expo / React Native App

**Subtasks**
- [ ] Install required CLI tools (Node, npm/yarn, Expo CLI).
- [ ] Create a new Expo project for GrocerMe.
- [ ] Configure app name, icon placeholder, and bundle identifiers (namespace) for iOS/Android.
- [ ] Verify the app runs on at least one physical device or simulator.

**Acceptance Criteria**
- [ ] `expo start` (or equivalent) launches the app in development mode.
- [ ] The app loads a placeholder home screen without runtime errors.
- [ ] The project is tracked in Git with an initial commit.

---

### 1.2 TypeScript & Tooling (Optional but Recommended)

**Subtasks**
- [ ] Add TypeScript support and basic `tsconfig` tuned for React Native.
- [ ] Configure ESLint and Prettier with reasonable defaults for React Native/Expo.
- [ ] Add basic scripts in `package.json` for linting and type-checking.

**Acceptance Criteria**
- [ ] The project compiles with TypeScript without type errors.
- [ ] `npm run lint` / `yarn lint` passes with no blocking issues.
- [ ] Editor integration (VS Code) shows types and lint feedback.

---

## 2. Core Architecture & Dependencies

### 2.1 Dependencies & Libraries

**Subtasks**
- [ ] Add navigation library (e.g., React Navigation) and required Expo integrations.
- [ ] Add SQLite support via Expo (e.g., `expo-sqlite` / `expo-sqlite/next`).
- [ ] Choose and add a simple state management approach (e.g., React Context + hooks or a lightweight store library).
- [ ] Verify all dependencies build successfully on both iOS and Android in development.

**Acceptance Criteria**
- [ ] Navigation works between at least two placeholder screens.
- [ ] SQLite can be opened and a simple test query can be executed without errors.
- [ ] App still runs on device/emulator after adding dependencies.

---

### 2.2 Folder & Module Structure

**Subtasks**
- [ ] Define a clear folder structure (e.g., `screens/`, `components/`, `data/`, `db/`, `hooks/`, `theme/`).
- [ ] Create placeholder modules/files for the three core screens: My List, Staples, Item.
- [ ] Add a central navigation stack/tab definition wired to these screens.

**Acceptance Criteria**
- [ ] Codebase structure matches the design intent (three core task screens plus shared modules).
- [ ] From the running app, you can navigate between the three placeholder screens.

---

## 3. Data Layer & SQLite Integration

### 3.1 Define SQLite Schema

**Subtasks**
- [ ] Define SQL schema for `items`, `stores` (or store name representation), and `price_history` as per the DesignDoc.
- [ ] Implement a migration or initialization routine that creates these tables if they do not exist.
- [ ] Add a simple versioning strategy for future schema changes.

**Acceptance Criteria**
- [ ] On first launch, the app creates the necessary tables without errors.
- [ ] Inspecting the SQLite DB (in dev) shows all expected tables and columns.

---

### 3.2 Data Access Layer (DAL)

**Subtasks**
- [ ] Implement CRUD functions for `items` (create, read, update, soft-complete/clear).
- [ ] Implement basic store representation (either a `stores` table or store-name handling) with helpers for listing available stores.
- [ ] Implement append-only `price_history` writes when appropriate (for purchased items with store/price set).
- [ ] Implement query helpers needed for:
  - [ ] My List view (`items` where `isCompleted = false`).
  - [ ] Staples view (`items` where `isStaple = true`).
  - [ ] Out-of-stock staples (for My List bottom strip).
  - [ ] Store mode (latest price per item for a selected store).
  - [ ] Price mode (lowest known unit price per item across stores).
  - [ ] Latest mode (most recent purchase per item).

**Acceptance Criteria**
- [ ] Calling DAL functions in a test harness returns expected data shapes without SQL errors.
- [ ] DAL functions support all queries required by the three shopping modes and views.

---

## 4. Screen Implementations

### 4.1 My List Screen

**Subtasks**
- [ ] Implement the main list UI with checkable items.
- [ ] Integrate data from the DAL (active items only).
- [ ] Add the mode toggle (Store / Price / Latest) and wire it to the appropriate queries.
- [ ] Implement tap-to-inline-expand behavior per item, showing key price/store info.
- [ ] Add an icon/action within the expanded row to open the full Item screen.
- [ ] Implement the bottom strip of out-of-stock staples with `+` actions to add them to the list.
- [ ] Add a **Clear completed** action to remove completed items from the active view.

**Acceptance Criteria**
- [ ] User can see their active list and check items off.
- [ ] Tapping an item expands it inline and reveals a control to open the Item screen.
- [ ] Mode toggle changes the displayed pricing information according to Store/Price/Latest rules.
- [ ] When at least one staple is marked out of stock, the bottom strip appears and `+` adds that staple to My List.
- [ ] Clear completed removes completed items from the current list without data corruption.

---

### 4.2 Staples Screen

**Subtasks**
- [ ] Implement Staples list UI backed by `items` where `isStaple = true`.
- [ ] Allow adding an existing item to Staples or creating a new staple item.
- [ ] Add the flag control to mark a staple as out of stock.
- [ ] Ensure out-of-stock staples update the My List bottom strip correctly.

**Acceptance Criteria**
- [ ] Staples screen shows all staple items.
- [ ] User can make any item a staple and create new staples.
- [ ] Toggling out-of-stock status of a staple affects visibility in the My List bottom strip.

---

### 4.3 Item Screen

**Subtasks**
- [ ] Implement form UI for creating/editing an item (name, staple toggle, simple store/price inputs).
- [ ] Wire save/cancel flows to the DAL (create/update item records and optional price entries).
- [ ] Ensure the screen can be opened from both My List and Staples with appropriate pre-loaded data.
- [ ] Keep UI simple while ensuring the underlying data model supports future multi-store and history features.

**Acceptance Criteria**
- [ ] User can create a new item from My List and see it appear on the list.
- [ ] User can edit an existing item from My List or Staples and see changes persist.
- [ ] Store and price data entered here is available for shopping modes and price history (when applicable).

---

## 5. Feature Logic & Flows

### 5.1 Adding & Editing Items

**Subtasks**
- [ ] Implement add (+) flow from My List to Item screen and back.
- [ ] Implement edit flow from My List/Staples inline expansion to Item screen.
- [ ] Ensure validations (e.g., non-empty name) and friendly error handling.

**Acceptance Criteria**
- [ ] Users can reliably add and edit items without crashes or lost data.
- [ ] Validation messages are clear and prevent invalid saves.

---

### 5.2 Staples & Out-of-Stock Flow

**Subtasks**
- [ ] Implement toggling `isStaple` on items from relevant screens.
- [ ] Implement `isOutOfStock` flag behavior for staples.
- [ ] Ensure out-of-stock staples appear in the My List bottom strip until added or unflagged.

**Acceptance Criteria**
- [ ] Marking an item as staple affects its presence on the Staples screen.
- [ ] Marking a staple as out of stock causes it to appear in the My List bottom area.
- [ ] Adding a staple from the bottom area behaves like adding any other item to the list.

---

### 5.3 Shopping Modes (Store / Price / Latest)

**Subtasks**
- [ ] Implement Store mode selection UI (store dropdown) and query integration.
- [ ] Implement Price mode to show the lowest known unit price per item across stores.
- [ ] Implement Latest mode to show the most recent purchase store/price per item.
- [ ] Ensure fallback behavior for items without any price history.

**Acceptance Criteria**
- [ ] Mode toggle visibly affects list ordering and/or displayed price/store fields according to the DesignDoc.
- [ ] Items without price data behave gracefully (e.g., show placeholders or omit price info) without breaking the UI.

---

### 5.4 Completing Items & Price History

**Subtasks**
- [ ] Ensure checking off an item sets `isCompleted = true` and removes it from the active My List view.
- [ ] When an item with store and price set is checked off, write an appropriate `PriceHistory` entry with `kind = purchased`.
- [ ] When an item without store/price is checked off, do not write a price history entry.
- [ ] Wire the **Clear completed** action to remove completed items from the current My List view.

**Acceptance Criteria**
- [ ] Completion behavior matches the documented flows.
- [ ] Price history is only created when a store and price are present.
- [ ] Clearing completed does not affect underlying item definitions beyond their completed state for the current list.

---

## 6. UI, Theming & Polish

### 6.1 Colors, Typography, and Layout Details

**Subtasks**
- [ ] Apply the defined color palette (primary, accent, backgrounds, text) across core UI components.
- [ ] Configure font usage (Inter as primary, system default as fallback/secondary).
- [ ] Implement basic spacing, padding, and list item layouts for readability.
- [ ] Ensure key touch targets meet reasonable tap area guidelines.

**Acceptance Criteria**
- [ ] The app visually matches the DesignDoc palette and font choices.
- [ ] Lists and controls are easy to read and tap on common device sizes.

---

### 6.2 Empty States & Error Handling

**Subtasks**
- [ ] Add empty state UI for My List (no items yet) and Staples (no staples yet).
- [ ] Add minimal inline error states for failed DB operations or invalid input.
- [ ] Ensure any critical errors fail gracefully with user-visible feedback where possible.

**Acceptance Criteria**
- [ ] Empty lists show helpful guidance instead of blank screens.
- [ ] Common error conditions are handled without crashing the app.

---

## 7. Testing & QA

### 7.1 Automated Tests (Where Practical)

**Subtasks**
- [ ] Add unit tests for key data-layer functions (e.g., DAL queries, price mode calculations).
- [ ] Optionally add component-level tests for critical UI flows (add/edit item, toggle modes).

**Acceptance Criteria**
- [ ] Core data logic has test coverage and passes reliably.
- [ ] CI or local test runs complete without failing tests.

---

### 7.2 Manual Test Pass for V1

**Subtasks**
- [ ] Create a short manual test script based on the User Flows in the DesignDoc.
- [ ] Execute the script on at least one iOS and one Android device/emulator.
- [ ] Log and address any critical bugs discovered during the test pass.

**Acceptance Criteria**
- [ ] All primary flows (add/edit items, staples flow, shopping modes, complete/clear) work end-to-end.
- [ ] No known crashers or data-loss bugs remain for V1.

---

### 7.3 Build & Distribution Smoke Check

**Subtasks**
- [ ] Produce at least one test build (Expo EAS or similar) for iOS.
- [ ] Produce at least one test build for Android.
- [ ] Install and run the builds on real devices for a short smoke test.

**Acceptance Criteria**
- [ ] Both platform builds start successfully and allow basic usage of core features.
- [ ] No platform-specific blockers prevent V1 usage.
