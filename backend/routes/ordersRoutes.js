const express=require('express');
const router=express.Router();
const{getOrders, getOrderById, createOrder, updateOrder, updateOrderStatus, deleteOrder, getOrdersWithProducts, getRequiredIngredients}=require('../controllers/ordersController');
const{verifyToken, verifyAdmin, verifyBrutar}=require('../middlewares/authMiddleware');

router.get('/', verifyToken, getOrders);
router.get('/cu-produse', verifyToken, getOrdersWithProducts);
router.get('/ingrediente-necesare', verifyToken, getRequiredIngredients);
router.get('/:id', verifyToken, getOrderById);

router.post('/', verifyToken, verifyAdmin, createOrder);
router.put('/:id/status', verifyToken, verifyBrutar, updateOrderStatus);
router.put('/:id', verifyToken, verifyAdmin, updateOrder);
router.delete('/:id', verifyToken, verifyAdmin, deleteOrder);

module.exports=router;