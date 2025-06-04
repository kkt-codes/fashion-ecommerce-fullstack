# E-Commerce Single Page Application (SPA) Frontend

## Project Overview

This project is a responsive and interactive full stack web app for a clothing e-commerce website, built using React and Spring boot.

## Key Features

* **Product Catalog:** Browse products with dynamic filtering (category, price, rating), sorting, and pagination.
* **Product Details:** View individual product information and reviews.
* **Shopping Cart:** Add/remove items, update quantities, and select delivery options with associated fees.
* **Checkout:** Simulate order placement with orders saved to local storage.
* **User Roles & Authentication:**
    * Separate flows for "Buyer" and "Seller" roles using authentication.
    * Buyer Dashboard (profile, orders, messages, favorites).
    * Seller Dashboard (product management overview, messages).
* **Messaging System:** Buyers can contact sellers, and sellers can reply via a chat interface.
* **Responsive Design:** Adapts to various screen sizes.

## Technologies Used

* **React (v18+)**
* **React Router (v6+)**
* **Tailwind CSS**
* **Heroicons** (for SVG icons)
* **date-fns** (for date formatting)
* **Vite** (build tool and dev server)
* **JavaScript (ES6+)**

## Getting Started

**Prerequisites:**
* Node.js (v16 or later recommended)
* npm or yarn

**Setup & Running Locally:**

1.  **Clone the repository (Example):**
    ```bash
    git clone https://github.com/kkt-codes/fashion-ecommerce-fullstack.git
    cd fashion-ecommerce-fullstack
    ```

2.  **Install dependencies:**
    Using npm:
    ```bash
    npm install
    ```
    Or using yarn:
    ```bash
    yarn install
    ```

3.  **Run the development server:**
    Using npm:
    ```bash
    npm run dev
    ```
    Or using yarn:
    ```bash
    yarn dev
    ```
    The application will typically be available at `http://localhost:5173`.

## Project Structure Highlights

* **/public/data/products.json**: Main source for product listings.
* **/src/components**: Reusable UI components.
* **/src/context**: Global state management (Auth, Cart, Favorites).
* **/src/data**: Static mock data for users and messages.
* **/src/hooks**: Custom React hooks (e.g., `useFetchCached`).
* **/src/pages**: Top-level page components.
* **/src/utils/dto.js**: Defines data structures (conceptual).

## Notes on Mock Data & Persistence

* User authentication, cart data, orders, and messages are currently mocked and primarily use `localStorage` for persistence during a browser session.
* Product data is fetched from `/public/data/products.json` and uses a client-side caching mechanism (`useFetchCached.js`).
