import { addToCart, getCart, updateCartItem, removeCartItem } from '../models/cartModel.js';

export async function postCartItem(req, res, next) {
  try {
    const userId = req.userId;              // from the verified token
    const { variantId, quantity } = req.body;

    // basic guard — need a variant and a positive quantity
    if (!variantId || !quantity || quantity < 1) {
      return res.status(400).json({ error: 'variantId and a quantity >= 1 are required' });
    }

    const item = await addToCart(userId, variantId, quantity);
    return res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
}

export async function getCartItems(req, res, next) {
  try {
    const userId = req.userId;
    const items = await getCart(userId);

    // compute a cart total so the frontend doesn't have to
    const total = items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );

    return res.status(200).json({
      count: items.length,
      total,
      items,
    });
  } catch (err) {
    next(err);
  }
}
export async function patchCartItem(req, res, next) {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'quantity must be >= 1' });
    }

    const item = await updateCartItem(userId, id, quantity);
    if (!item) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    return res.status(200).json({ item });
  } catch (err) {
    next(err);
  }
}

export async function deleteCartItem(req, res, next) {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const removed = await removeCartItem(userId, id);
    if (!removed) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    return res.status(200).json({ message: 'Item removed' });
  } catch (err) {
    next(err);
  }
}