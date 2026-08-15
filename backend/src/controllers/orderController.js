import {
  createOrderFromCart,
  getOrdersByUser,
  getOrderById,
} from '../models/orderModel.js';

export async function checkout(req, res, next) {
  try {
    const userId = req.userId;
    const result = await createOrderFromCart(userId);

    // handle the expected business failures
    if (result.error === 'CART_EMPTY') {
      return res.status(400).json({ error: 'Your cart is empty' });
    }
    if (result.error === 'OUT_OF_STOCK') {
      return res.status(409).json({
        error: 'Not enough stock for one of your items',
        variantId: result.variantId,
      });
    }

    // success
    return res.status(201).json({
      message: 'Order placed',
      order: result.order,
    });
  } catch (err) {
    next(err);
  }
}

export async function getOrders(req, res, next) {
  try {
    const orders = await getOrdersByUser(req.userId);
    return res.status(200).json({ count: orders.length, orders });
  } catch (err) {
    next(err);
  }
}

export async function getOrder(req, res, next) {
  try {
    const order = await getOrderById(req.userId, req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    return res.status(200).json({ order });
  } catch (err) {
    next(err);
  }
}