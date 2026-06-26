const express=require('express');
const router=express.Router();
const{getStocks, getStockById, createStock, updateStock, deleteStock, getLowStocks}=require('../controllers/stocksController');
const{verifyToken, verifyAdmin}=require('../middlewares/authMiddleware');

router.get('/alerta', verifyToken, getLowStocks);
router.get('/', verifyToken, getStocks);
router.get('/:id', verifyToken, getStockById);

router.post('/', verifyToken, verifyAdmin, createStock);
router.put('/:id', verifyToken, verifyAdmin, updateStock);
router.delete('/:id', verifyToken, verifyAdmin, deleteStock);
module.exports=router;