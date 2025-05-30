/**
 * @fileoverview This file defines Data Transfer Object (DTO) structures
 * for the e-commerce application. These DTOs represent the expected shape of data
 * for API communication (even if mocked) and data transfer between components,
 * reflecting the current project structure.
 */

// --- Product DTOs ---

/**
 * Represents a product as it is defined in `products.json` and used throughout the app.
 * @typedef {object} ProductDTO
 * @property {string} id - Unique identifier for the product (e.g., "dress-001").
 * @property {string} name - Name of the product.
 * @property {string} description - Detailed description of the product.
 * @property {number} price - Price of the product.
 * @property {string} category - Category the product belongs to.
 * @property {string} image - Path to the product image (e.g., "/assets/clothes/dress/dress-1.jpg").
 * @property {string} sellerId - Identifier of the seller who listed the product.
 * @property {number} averageRating - Calculated average rating for the product.
 * @property {number} numberOfReviews - Total number of reviews for the product.
 * @property {Array<ReviewDTO>} reviews - Array of reviews for the product.
 */
// Aligns with: public/data/products.json

/**
 * Represents the data structure for creating a new product.
 * This is what the frontend (e.g., AddProduct.jsx) collects.
 * @typedef {object} CreateProductDTO
 * @property {string} name
 * @property {string} description
 * @property {number} price
 * @property {string} category
 * @property {string} image - Path to the image.
 * @property {string} [sellerId] - Typically added based on the logged-in seller.
 */
// Aligns with: src/pages/seller/AddProduct.jsx form data.

/**
 * Represents the data structure for updating an existing product.
 * @typedef {object} UpdateProductDTO
 * @property {string} [id] - Product ID is usually part of the route or context, not the DTO itself for update.
 * @property {string} [name] - Optional: New name.
 * @property {string} [description] - Optional: New description.
 * @property {number} [price] - Optional: New price.
 * @property {string} [category] - Optional: New category.
 * @property {string} [image] - Optional: New image path.
 */
// Aligns with: src/pages/seller/EditProduct.jsx form data.

// --- User DTOs ---

/**
 * Represents user information as defined in `buyers.json` and `sellers.json`.
 * @typedef {object} UserDTO
 * @property {string} id - Unique user identifier (e.g., "buyer-001", "seller-001").
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {'Buyer' | 'Seller'} role
 * @property {string} [password] - Should NOT be exposed after authentication; present in source JSONs for mock auth.
 */
// Aligns with: src/data/buyers.json, src/data/sellers.json
// Note: `password` is in source files for mock auth but typically not part of a UserDTO post-authentication.

/**
 * Represents the data structure for user registration (signup).
 * @typedef {object} RegisterUserDTO
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {string} password - Raw password.
 * @property {'Buyer' | 'Seller'} role
 */
// Aligns with: src/components/SignupSigninModal.jsx (signup tab) form data.

/**
 * Represents the data structure for user login (signin).
 * @typedef {object} LoginCredentialsDTO
 * @property {string} email
 * @property {string} password
 */
// Aligns with: src/components/SignupSigninModal.jsx (signin tab) form data.

/**
 * Represents the response from a successful authentication (login/signup).
 * @typedef {object} AuthResponseDTO
 * @property {UserDTO} user - The authenticated user's details (excluding sensitive info like password).
 * @property {string} token - The authentication token (mocked in this project).
 */
// Aligns with: Conceptual output of src/context/AuthContext.jsx signin/signup.

// --- Message DTOs ---

/**
 * Represents a message object as used in `mockMessages.js`.
 * @typedef {object} MessageDTO
 * @property {string} id - Unique message identifier.
 * @property {string} senderId - ID of the user who sent the message.
 * @property {string} text - The text content of the message.
 * @property {string} timestamp - ISO date string when the message was sent.
 * @property {string} [receiverId] - Optional: ID of the receiver (derived from conversation participants).
 * @property {string} [productId] - Optional: ID of the product the message is about.
 */
// Aligns with: src/data/mockMessages.js message structure.

/**
 * Represents the data structure for sending a new message.
 * @typedef {object} CreateMessageDTO
 * @property {string} conversationId - ID of the conversation to add the message to.
 * @property {string} senderId - ID of the user sending the message.
 * @property {string} text - The content of the message.
 * @property {string} [productId] - Optional: ID of the product this message might relate to.
 */
// Aligns with: Data passed to `sendMockMessage` in messaging components.

/**
 * Represents a conversation summary as used in the message list.
 * @typedef {object} ConversationSummaryDTO
 * @property {string} id - Unique conversation identifier.
 * @property {UserDTO} otherParticipant - Details of the other user in the conversation.
 * @property {string} lastMessageText - Snippet of the last message.
 * @property {string} lastMessageTimestamp - Timestamp of the last message.
 * @property {boolean} isUnread - Whether the conversation has unread messages for the current user.
 * @property {number} unreadMessagesCount - Count of unread messages.
 */
// Aligns with: Output of `getConversationsForUser` in `mockMessages.js`.

// --- Review DTOs ---

/**
 * Represents a product review as defined in `products.json`.
 * @typedef {object} ReviewDTO
 * @property {string} id - Unique review identifier.
 * @property {string} productId - ID of the product being reviewed.
 * @property {string} userId - ID of the user who wrote the review.
 * @property {string} userName - Name of the user who wrote the review.
 * @property {number} rating - Rating given (e.g., 1-5 stars).
 * @property {string} comment - Text content of the review.
 * @property {string} date - ISO date string when the review was posted.
 */
// Aligns with: Review objects within `reviews` array in `public/data/products.json`.

/**
 * Represents the data structure for submitting a new review.
 * @typedef {object} CreateReviewDTO
 * @property {string} productId - ID of the product being reviewed.
 * @property {string} [userId] - Added by the system based on logged-in user.
 * @property {string} [userName] - Added by the system.
 * @property {number} rating
 * @property {string} comment
 */
// Aligns with: Data collected by a potential AddReviewForm.

// --- Cart & Order DTOs ---

/**
 * Represents an item in the shopping cart.
 * Essentially a ProductDTO with an added quantity.
 * @typedef {object} CartItemDTO
 * @property {string} id - Product ID.
 * @property {string} name
 * @property {number} price
 * @property {string} image
 * @property {string} category
 * @property {string} sellerId
 * @property {number} quantity - Quantity of this product in the cart.
 * // Other product fields can be included if needed directly in cart display
 */
// Aligns with: Items in `cartItems` array in `CartContext.jsx`.

/**
 * Represents a delivery option selected during checkout.
 * @typedef {object} DeliveryOptionSelectionDTO
 * @property {string} id - Identifier of the selected delivery option (e.g., 'standard', 'express').
 * @property {string} label - Display label for the delivery option.
 * @property {number} fee - Cost of this delivery option.
 * @property {string} estimatedDelivery - Calculated estimated delivery date string.
 */
// Aligns with: Structure used in `Cart.jsx` and stored in `OrderDTO`.

/**
 * Represents an item within a placed order.
 * @typedef {object} OrderItemDTO
 * @property {string} productId
 * @property {string} productName
 * @property {number} productPrice - Price per unit at the time of order.
 * @property {number} quantity
 * @property {string} category
 * @property {string} sellerId
 */
// Aligns with: Product-specific details within an `OrderDTO`.

/**
 * Represents a placed order.
 * @typedef {object} OrderDTO
 * @property {string} id - Unique order identifier.
 * @property {string} buyerId
 * @property {string} buyerName
 * @property {string} date - ISO date string when the order was placed.
 * @property {Array<OrderItemDTO>} items - Array of items included in the order. (This is a refinement)
 * @property {DeliveryOptionSelectionDTO} deliveryOption - Details of the chosen delivery method.
 * @property {number} orderSubtotal - Subtotal of all items before delivery fee.
 * @property {number} orderTotal - Grand total including delivery fee.
 */
// Refined from: `newOrders` object created in `Cart.jsx`'s `handlePlaceOrder`.
// Note: The current `handlePlaceOrder` creates a separate order object for *each* cart item.
// A more typical OrderDTO would have a single order ID and an array of items.
// The DTO above reflects a more standard approach. If your current implementation
// intentionally creates one order per product, the DTO might need to be simpler,
// or your `handlePlaceOrder` logic might be refactored in the future.
// For now, this DTO represents a common e-commerce order structure.
// The current `handlePlaceOrder` in `Cart.jsx` creates an array of objects, where each object
// represents one line item *as* an order. The DTO above assumes an order can contain multiple items.
// Let's adjust to reflect the current `handlePlaceOrder` more directly for now,
// meaning each "order" is essentially an "order line item" with full order details.

/**
 * Represents a single "order line" as currently created by `handlePlaceOrder`.
 * Each cart item becomes a separate order record in localStorage.
 * @typedef {object} PlacedOrderLineDTO
 * @property {string} id - Unique identifier for this order line (e.g., "order-timestamp-random").
 * @property {string} buyerId
 * @property {string} buyerName
 * @property {string} productId
 * @property {string} productName
 * @property {number} productPrice - Price per unit at the time of order.
 * @property {number} quantity
 * @property {string} category
 * @property {string} sellerId
 * @property {string} date - ISO date string when the order line was placed.
 * @property {DeliveryOptionSelectionDTO} deliveryOption - Details of the chosen delivery method for this item/order.
 * @property {number} orderSubtotal - Subtotal of THIS line item (price * quantity).
 * @property {number} orderTotal - Total for THIS line item (subtotal + delivery fee if applicable per item, or order-level fee).
 * The current Cart.jsx calculates one deliveryFee for the whole cart,
 * so this DTO should reflect how it's stored.
 * The `orderSubtotal` and `orderTotal` in `handlePlaceOrder` are for the *entire cart*,
 * but they are duplicated into each "order line" object.
 */
// Aligns with: Objects in the `newOrders` array in `src/pages/Cart.jsx`.


// JSDoc is used here for documentation purposes.
// For actual type checking in a larger JavaScript project, consider TypeScript.
