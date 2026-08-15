import { pool } from '../config/db.js';

const DEFAULT_ADDRESS_ID = 1;   // the placeholder address we created
const SHIPPING_FEE = 0;         // flat shipping for now

export async function createOrderFromCart(userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Read the user's cart, locking the variant rows (FOR UPDATE)
    const cartRes = await client.query(
      `SELECT ci.variant_id, ci.quantity, v.price, v.stock_qty, v.product_id
       FROM cart_items ci
       JOIN product_variants v ON v.id = ci.variant_id
       WHERE ci.user_id = $1
       FOR UPDATE OF v`,
      [userId]
    );
    const cart = cartRes.rows;

    // 2. Reject an empty cart
    if (cart.length === 0) {
      await client.query('ROLLBACK');
      return { error: 'CART_EMPTY' };
    }

    // 3. Check stock for every item
    for (const item of cart) {
      if (item.stock_qty < item.quantity) {
        await client.query('ROLLBACK');
        return { error: 'OUT_OF_STOCK', variantId: item.variant_id };
      }
    }

    // 4. Compute totals
    const subtotal = cart.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );
    const total = subtotal + SHIPPING_FEE;

    // 5. Create the order row
    const orderRes = await client.query(
      `INSERT INTO orders (user_id, address_id, subtotal, shipping_fee, total)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, status, payment_status, subtotal, shipping_fee, total, created_at`,
      [userId, DEFAULT_ADDRESS_ID, subtotal, SHIPPING_FEE, total]
    );
    const order = orderRes.rows[0];

    // 6. Create order_items (snapshot price) + 7. decrement stock
    for (const item of cart) {
      await client.query(
        `INSERT INTO order_items (order_id, variant_id, quantity, price_at_purchase)
         VALUES ($1, $2, $3, $4)`,
        [order.id, item.variant_id, item.quantity, item.price]
      );

      await client.query(
        `UPDATE product_variants
         SET stock_qty = stock_qty - $1
         WHERE id = $2`,
        [item.quantity, item.variant_id]
      );
    }

    // 8. Clear the cart
    await client.query(`DELETE FROM cart_items WHERE user_id = $1`, [userId]);

    await client.query('COMMIT');
    return { order };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// List a user's orders, newest first
export async function getOrdersByUser(userId) {
  const result = await pool.query(
    `SELECT id, status, payment_status, subtotal, shipping_fee, total, created_at
     FROM orders
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}

// Get one order with its items (for this user only)
export async function getOrderById(userId, orderId) {
  const orderRes = await pool.query(
    `SELECT id, status, payment_status, subtotal, shipping_fee, total, created_at
     FROM orders
     WHERE id = $1 AND user_id = $2`,
    [orderId, userId]
  );
  const order = orderRes.rows[0];
  if (!order) return undefined;

  const itemsRes = await pool.query(
    `SELECT oi.quantity, oi.price_at_purchase,
            v.size, v.color,
            p.name AS product_name, p.slug AS product_slug
     FROM order_items oi
     JOIN product_variants v ON v.id = oi.variant_id
     JOIN products p ON p.id = v.product_id
     WHERE oi.order_id = $1`,
    [orderId]
  );

  return { ...order, items: itemsRes.rows };
}