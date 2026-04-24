# Matcha POS - Advanced Features Roadmap

## Phase 1: Core Infrastructure & Security
- [x] **Authentication System**: Integrated NextAuth.js with Credentials provider.
- [x] **Role-Based Access Control (RBAC)**: Restricted `/manager` to admins and `/employee` to authenticated staff.
- [x] **User Management UI**: Built a dedicated portal for Managers to create/edit/delete employee credentials.
- [x] **Bypass Authentication**: Implemented optional placeholder login for rapid development.
- [x] **Route Protection**: Middleware and client-side checks to prevent unauthorized access and handle back-button persistence.

## Phase 2: Premium Branding & UI (Starbucks-Inspired)
- [x] **Color Palette Overhaul**: Transitioned to high-contrast Starbucks Green (#006241) and Charcoal (#1E3932).
- [x] **Typography Update**: Switched to modern Inter sans-serif stack with bold weighting.
- [x] **Component Modernization**: Re-styled Menu, Kiosk, and Cart with rounded elements and improved spacing.
- [x] **Portal Landing Page**: Redesigned entry point with active session indicators and secure pop-up login.

## Phase 3: Business Logic & Pricing
- [x] **Premium Customization Charges**: Added specific costs for premium ingredients (Boba, Pudding, Jelly, etc.).
- [x] **Dynamic Pricing**: Updated Customization Modal to calculate and display total costs in real-time.
- [x] **Schema Expansion**: Added `users` table and updated `order_items` to store customization details accurately.
- [x] **Real-Time Inventory Deduction**: (Completed) Stock decreases upon order placement.

## Phase 4: Manager Insights & Analytics
- [x] **Sales Dashboard**: Built "Daily Summary" view with revenue and order counts.
- [x] **Item Performance**: Added "Top Sellers" logic to identify most popular handcrafted drinks.
- [x] **Inventory Monitoring**: Built "Runway" logic to estimate days of stock remaining based on average use.
- [x] **Price Distribution**: Visualized menu mix by price bracket.

## Phase 5: Smart Features & UX (Roadmap)
- [ ] **Frequently Bought With**: Add upsell logic to the customization modal.
- [ ] **Accessibility Suite**: Implement Spanish/Chinese toggles and High Contrast Mode.
- [ ] **Weather Integration**: Auto-suggest cold/hot drinks based on local temperature API.

## Deprecated / Removed Features
- [x] **Live Order Status Board**: Removed from UI and API to simplify the core ordering flow.
- [x] **Manual Inventory Status**: Replaced with automated runway estimation logic.
