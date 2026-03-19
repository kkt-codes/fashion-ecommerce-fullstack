# E-Commerce Single Page Application (SPA) Frontend

## Project Overview

This project is a responsive and interactive full stack web app for a clothing e-commerce website, built using React and Spring boot.

## Key Features

* **Product Catalog:** Browse products with dynamic filtering (category, price, rating), sorting, and pagination.
* **Product Details:** View individual product information and reviews.
* **Shopping Cart:** Add/remove items, update quantities, and select delivery options with associated fees.
* **Checkout:** Place real orders through the backend API integration.
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

* **/src/components**: Reusable UI components.
* **/src/context**: Global state management (Auth, Cart, Favorites).
* **/src/pages**: Top-level page components.
* **/src/services/api.js**: Axios instance and API call functions for backend integration.
* **/src/routes**: Application routing configuration.
* **/src/utils/dto.js**: Defines data structures (conceptual).

## Backend Integration & State Persistence

* This frontend connects to a real Spring Boot backend using Axios (`/src/services/api.js`).
* **Backend Repository:** <https://github.com/kidus-yoseph-t/fashion.git>
* User authentication uses JSON Web Tokens (JWT). The token and basic user data are stored in `localStorage` to persist sessions.
* Unauthenticated guests can use a temporary shopping cart which is stored in `localStorage` and merged with their account upon login or registration.
