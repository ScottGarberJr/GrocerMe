# Design Document

## Core Idea and Key Pillars

The application is a lightweight mobile shopping list designed to help users quickly build and manage grocery lists while tracking price and store information.

The core principle is **speed and simplicity**. The app minimizes friction when adding items and leverages a "Staples" concept to rapidly generate shopping lists from frequently purchased items.

The key differentiators are:

- **Staples-based shopping:** Quickly build lists from frequently purchased items.
- **Price-aware lists:** Items can be viewed and sorted by price or store.
- **Minimal interaction cost:** Adding items takes only seconds.
- **Clean mental model:** Only three core screens.

The project's goals are to:

- Create a fast, minimal grocery list experience.
- Allow users to track price and store for items.
- Enable quick list building through recurring staples.
- Maintain a simple architecture that can scale later.

---

## User Personas

| Persona Name | Description | Goals | Usage Context |
|---------------|-------------|------|---------------|
| **Chris the Busy Parent** | A 38-year-old parent managing weekly grocery trips. | Wants to quickly build a grocery list from common staples. | In the kitchen while planning meals. |
| **Maya the Budget Shopper** | A 26-year-old comparing prices between stores. | Wants to know where items are cheapest. | While planning a shopping trip or inside a store. |
| **Jordan the Minimalist** | A 31-year-old who prefers simple apps. | Wants the fastest way to track a shopping list without complexity. | During errands or quick shopping runs. |

---

## Version 1 Features

- **My List:** Main screen displaying the active shopping list.
- **Staples:** A list of frequently purchased items that can be quickly added to My List.
- **Item Management:** Create, edit, and manage individual items.
- **Store & Price Tracking:** Each item can store a price and store name.
- **Shopping Modes:**
  - Sort by price
  - Group by store
- **Local Storage:** All data stored locally on the device.

### Implementation Order

1. Core data model and local storage
2. My List screen functionality
3. Staples list functionality
4. Item creation and editing
5. Sorting and filtering modes

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

- Item checklist, check off as you add to cart
- Mode toggle (Price / Store)
- Tap the '$'' icon to compare store prices for an item. Tap an option to move item accordingly
- View staples that are out of stock at the bottom and tap the '+' icon to add to list

#### Staples

List of frequently purchased items.

Features:

- Add an existing item to staple list or a new item
- Tap the flag icon when you notice the item is out of stock

#### Item Screen

Used to create or edit an item.

Fields:

- Name
- Prices
- Stores
- Categories
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

### Shopping Mode Toggle

Users can switch between two list views:

**Price Mode**

Items sorted by price.

**Store Mode**

Items grouped by store.

---

## Stack and Technical Details

- **Frontend Framework:** React Native
- **Mobile Framework:** Expo
- **Storage:** Local storage
- **Future Backend/db:** Supabase or Auth.js + vps postgres

---

## Data Model

### Item

Represents a shopping item.

Fields:
id
name
price
store
category
isStaple
isCompleted
created_at
updated_at


---

### Views

**My List**
items WHERE isCompleted = false

**Staples**
items WHERE isStaple = true


---

## Future Features

### Immediate Wants

- Price history tracking

- Categories and sorting

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
   - V1 will support one price per store (enforce no dublicates on store name per item).

2. **Item persistence after completion**
   - Completed items will remain available for reuse. My List should have a "clear" button or perhaps should ask to clear checked items at end of day

3. **Price accuracy**
   - Prices are user-entered and may become outdated. thats fine

4. **Future backend migration**
   - The local-first architecture should allow easy transition to cloud sync later. when logged in but no internet, there should be a clear red icon showing that user is in offline mode (tooltip says that changes will be synced when back online)

---

End