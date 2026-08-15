import { Router } from 'express';
import { checkout, getOrders, getOrder } from '../controllers/orderController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/checkout', requireAuth, checkout);
router.get('/', requireAuth, getOrders);
router.get('/:id', requireAuth, getOrder);

export default router;