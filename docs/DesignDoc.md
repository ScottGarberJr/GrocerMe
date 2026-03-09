# Design Document

## Core Idea and Key Pillars

The application is a lightweight, **local‑first** mobile shopping list designed to help users quickly build and manage grocery lists while also making on‑the‑fly price and store comparisons.

The core principles are **speed**, **simplicity**, and **price awareness**:

- Adding an item to the list should be nearly frictionless: start typing, then either select an existing item or create a new one in a single flow.
- Once an item is on the list, users can tap it to quickly view and edit price and location information.
- All data is stored locally on the device in Version 1; cloud sync and accounts come later.

The key differentiators are:

- **Staples & My List synergy:** Staples are managed alongside the main list. Users flag staple items as "out of stock" when they notice they are low at home; those out‑of‑stock staples then surface at the bottom of My List with a **+** action for one‑tap addition.
- **Quick price comparison:** From an item, users can compare prices across locations and update store/price information as they shop.
- **Minimal interaction cost:** Common actions (adding items, marking staples out of stock, checking items off) should take only a tap or two.
- **Clean mental model:** The primary workflow centers on three core task screens: **My List**, **Staples**, and **Item** (view/edit), with any additional surfaces (e.g., Settings) treated as secondary.

The project's goals are to:

- Create a fast, minimal grocery list experience.
- Allow users to track and compare price and store for items in a lightweight way.
- Support quick list building through synergy between My List and Staples rather than heavy configuration.
- Maintain a simple, local‑first architecture that can scale later to cloud sync and shared lists.

---

## User Personas

These three personas are all first‑class targets for Version 1; the app should serve each of them well without over‑optimizing for only one.

| Persona Name | Description | Goals | Usage Context |
|---------------|-------------|------|---------------|
| **Chris the Busy Parent** | A 38-year-old parent managing weekly grocery trips. | Quickly build and reuse a grocery list from common staples with minimal effort. | In the kitchen while planning meals or updating the list between tasks. |
| **Maya the Budget Shopper** | A 26-year-old comparing prices between stores, often with spotty reception. | Know where items are cheapest and adjust prices on the fly while shopping. | While planning a shopping trip at home or using the app offline/online inside a store. |
| **Jordan the Minimalist** | A 31-year-old who prefers simple, focused apps. | Have the fastest way to track a shopping list without clutter or extra steps. | During errands or quick shopping runs where they want a clean, distraction‑free list. |

---

## Version 1 Features

- **My List:** Main screen displaying the active shopping list.
- **Staples:** A list of frequently purchased items that can be quickly added to My List.
- **Item Management:** Create, edit, and manage individual items.
- **Store & Price Tracking:** Each item stores price and store information locally and can be updated as the user shops.
- **Shopping Modes:**
   - **Store mode:** User selects a store from the stores that have prices recorded for any item on the list. Items with a price for that store are surfaced first, showing that store's price.
   - **Price mode:** Items show the lowest known unit price across all recorded stores for that item.
   - **Latest mode:** Items show the price and store from the most recent time they were marked as purchased (checked off).
- **Local Storage:** All data stored locally on the device.

### Implementation Order

1. Core data model and local storage
2. My List screen functionality
3. Staples list functionality
4. Item creation and editing
5. Shopping modes (Store, Price, Latest)

---

## UI Design

### Color Palette

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| Primary | #2D6CDF | Primary buttons and highlights |
| Accent | #34C759 | Confirm actions and completed items |
| Background | #FFFFFF | Main background |
| Secondary Background | #F2F4F7 | List backgrounds |
| Text | #1F2933 | Primary text |

---

### Fonts

- **Primary Font:** Inter
- **Secondary Font:** System default

---

### Layouts

The app consists of **three core screens**.

#### My List

Primary screen where users manage their shopping list.

Features:

- Item checklist, check off as you add to cart.
- Mode toggle to switch between **Store**, **Price**, and **Latest** views.
- Tap an item row to inline expand it, showing key price/store information and revealing an action icon that opens the full Item screen for detailed editing.
- A bottom strip shows staples that are currently flagged as **out of stock**; when at least one exists this strip is always visible (and may be collapsible). Each staple in this strip has a **+** icon for one-tap addition to the list. When no staples are out of stock, this area simply indicates that there are no out-of-stock staples.

#### Staples

List of frequently purchased items.

Features:

- Add an existing item to the staple list or create a new staple.
- Simple flat list in V1 (no additional filtering or sorting); future user feedback can drive enhancements.
- Tap the flag icon when you notice the item is out of stock at home; this marks it as out of stock so it appears in the My List bottom strip for quick addition.

#### Item Screen

Used to create or edit an item.

Fields:

- Name
- Store and price information (kept simple in V1, with the data model designed to support multiple stores and richer price history later)
- Staple toggle

---

### Screenshots

UI mockups show the three core screens in a minimal mobile interface.

- My List Screen
- Staples Screen
- Item Screen

(Mockups inserted in documentation repository.)

---

## User Flows

### Adding an Item

1. User taps the **Add (+)** button on My List.
2. The Item screen opens.
3. User enters item name.
4. Optionally sets price and store.
5. User taps **Save**.
6. Item appears in My List.

---

### Adding from Staples

1. User opens the Staples screen.
2. User taps a staple item.
3. The item is instantly added to My List.

---

### Editing an Item

1. User taps an item from My List.
2. Item screen opens.
3. User modifies fields.
4. User taps Save.

---

### Completing and Clearing Items

1. User checks off an item on My List.
2. The item is marked as completed (`isCompleted = true`) and treated as no longer active on the list.
3. If the item has a store and price set, the app records a `PriceHistory` entry with `kind = purchased` for that store/price.
4. If the item does not have a store or price set, it is simply marked completed without recording a price history entry.
5. The user can tap a **Clear completed** action on My List to remove all completed items from the current view while keeping the underlying items available for future reuse.

---

### Shopping Mode Toggle

Users can switch between three list views:

**Store Mode**

- User selects a store from the stores that have prices recorded for any item on the list.
- Items with a recent price for that store are surfaced first, showing that store's price.

**Price Mode**

- Each item shows the lowest known unit price across all stores, based on the latest price entries per store.

**Latest Mode**

- Each item shows the store and price from the most recent time it was marked as purchased (based on `PriceHistory` or the denormalized `lastPurchasedAt` / `lastPurchasedStoreId` fields).

---

## Stack and Technical Details

- **Frontend Framework:** React Native
- **Mobile Framework:** Expo
- **Storage (local-first):** SQLite (via Expo) for structured, queryable local data (items, stores, price history)
- **Future Backend/DB:** PostgreSQL (Supabase or self-hosted on VPS), mirroring the local relational schema

---

## Data Model

The data model is relational and designed so the on-device SQLite schema can map cleanly to a future PostgreSQL backend.

### Item

Represents a shopping item.

Fields (conceptual):
- `id`
- `name`
- `isStaple` (whether the item should appear in the Staples list)
- `isCompleted` (checked off on the current list)
- `isOutOfStock` (used to surface staples in the My List bottom strip)
- `lastPurchasedAt` (optional denormalized field for latest purchase timestamp)
- `lastPurchasedStoreId` (optional denormalized field for the store where it was last purchased)
- `created_at`
- `updated_at`

### Store

Represents a store/location where items can be purchased.

Fields (conceptual):
- `id`
- `name`

In early versions, a separate Store table may be deferred in favor of simple store-name strings, but the model assumes a distinct store concept long term.

### PriceHistory

Represents observed or purchased prices for an item at a specific store over time.

Fields (conceptual):
- `id`
- `item_id`
- `store_id`
- `unit_price`
- `recorded_at` (timestamp)
- `kind` (e.g., `seen` vs `purchased`)

This table powers:
- **Store mode:** For a selected store, surface items where a recent price exists for that store first.
- **Price mode:** For each item, determine the lowest known unit price across stores using the latest entries per store.
- **Latest mode:** For each item, show the most recent `purchased` entry (optionally mirrored in `lastPurchasedAt` / `lastPurchasedStoreId`).


---

### Views

**My List**
items WHERE isCompleted = false

**Staples**
items WHERE isStaple = true


---

## Future Features

### Immediate Wants

- Richer price history visualization and analytics (charts, trends, insights beyond the core Store/Price/Latest modes)
- Categories and category-based sorting/filtering
- Item quantity per list entry
- Settings-driven prompts and confirmations:
   - Optional popup when checking off an item that already has a store selected (e.g., "Is this being purchased at *StoreName*?").
   - Optional popup when checking off an item without store/price set, asking the user to supply store and price with a clear skip option.

---

### Nice-to-Haves

- Barcode scanning and/or pricetag picture reading
- find way to notify of deals at tracked stores
- Store location grouping
- Auto-suggest previous items

---

### Premium Features

- login with cloud sync
- Multi-device access
- Share household lists (changes "My List" to "Our List" would be a nice touch)
- Price analytics

---

## Monetization Strategy

Freemium model.

**Free Tier**

- Local storage
- Unlimited items
- Basic list features

**Premium Tier**

- Cloud backup
- Shared lists
- No ads

---

## Open Questions & Risks

1. **Multiple store prices per item?**
   - Resolved: V1 supports one current price per (item, store) pair via the `PriceHistory` model, enforcing no duplicates per store for current prices while retaining historical entries.

2. **Item persistence after completion**
   - Resolved: Completed items remain available for reuse. My List provides an explicit **Clear completed** action; no automatic end-of-day prompts are included in V1.

3. **Price accuracy**
   - Prices are user-entered and may become outdated. thats fine

4. **Future backend migration**
   - The local-first architecture should allow easy transition to cloud sync later. when logged in but no internet, there should be a clear red icon showing that user is in offline mode (tooltip says that changes will be synced when back online)

---

End