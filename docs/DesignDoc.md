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

Primary workspace where users manage their shopping list.

Features:

- Item checklist
- Store filter chips
- Mode toggle (Price / Store)
- Floating add button

#### Staples

List of frequently purchased items.

Features:

- Tap to add staple to My List
- Quick add new staple
- Edit staple items

#### Item Screen

Used to create or edit an item.

Fields:

- Name
- Price
- Store
- Category
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

- **Frontend Framework:** Nuxt 3 (Vue 3)
- **Mobile Framework:** Nuxt + Ionic
- **Native Wrapper:** Capacitor
- **Storage:** Local storage using Ionic Storage
- **Future Backend:** Supabase

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
- Store comparison view
- Auto-suggest previous items
- Categories and sorting

---

### Nice-to-Haves

- Barcode scanning
- Shared shopping lists
- Smart price alerts
- Store location grouping

---

### Premium Features

- Cloud sync
- Multi-device access
- Shared household lists
- Price analytics
- Store route optimization

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
- Advanced price tracking
- No ads

---

## Open Questions & Risks

1. **Multiple store prices per item?**
   - V1 will support only one store per item.

2. **Item persistence after completion**
   - Completed items will remain available for reuse.

3. **Price accuracy**
   - Prices are user-entered and may become outdated.

4. **Future backend migration**
   - The local-first architecture should allow easy transition to cloud sync later.

---

End