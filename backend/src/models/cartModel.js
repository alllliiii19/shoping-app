import { pool } from '../config/db.js';

// Add an item to the cart, or bump its quantity if already there
export async function addToCart(userId, variantId, quantity) {
  const result = await pool.query(
    `INSERT INTO cart_items (user_id, variant_id, quantity)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, variant_id)
     DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
     RETURNING *`,
    [userId, variantId, quantity]
  );
  return result.rows[0];
}

// Get all cart items for a user, joined with product/variant info for display
export async function getCart(userId) {
  const result = await pool.query(
    `SELECT
       ci.id            AS cart_item_id,
       ci.quantity,
       v.id             AS variant_id,
       v.size,
       v.color,
       v.price,
       v.stock_qty,
       p.id             AS product_id,
       p.name           AS product_name,
       p.slug           AS product_slug
     FROM cart_items ci
     JOIN product_variants v ON v.id = ci.variant_id
     JOIN products p ON p.id = v.product_id
     WHERE ci.user_id = $1
     ORDER BY ci.added_at DESC`,
    [userId]
  );
  return result.rows;
}
// Set a cart item's quantity to a specific value (for this user only)
export async function updateCartItem(userId, cartItemId, quantity) {
  const result = await pool.query(
    `UPDATE cart_items
     SET quantity = $1
     WHERE id = $2 AND user_id = $3
     RETURNING *`,
    [quantity, cartItemId, userId]
  );
  return result.rows[0];
}

// Remove a cart item (for this user only)
export async function removeCartItem(userId, cartItemId) {
  const result = await pool.query(
    `DELETE FROM cart_items
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [cartItemId, userId]
  );
  return result.rows[0];
}