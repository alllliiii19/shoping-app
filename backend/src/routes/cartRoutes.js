import { Router } from 'express';
import { postCartItem, getCartItems, patchCartItem, deleteCartItem } from '../controllers/cartController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, postCartItem);
router.get('/', requireAuth, getCartItems);
router.patch('/:id', requireAuth, patchCartItem);
router.delete('/:id', requireAuth, deleteCartItem);

export default router;