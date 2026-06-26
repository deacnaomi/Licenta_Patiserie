const express=require('express');
const router=express.Router();
const{getProducts, getProductById, createProduct, updateProduct, deleteProduct, upload}=require('../controllers/productsController');
const{verifyToken, verifyAdmin}=require('../middlewares/authMiddleware');

router.get('/', verifyToken, getProducts);
router.get('/:id', verifyToken, getProductById);
router.post('/', verifyToken, verifyAdmin, upload.single('poza'), createProduct);
router.put('/:id', verifyToken, verifyAdmin, upload.single('poza'), updateProduct);
router.delete('/:id', verifyToken, verifyAdmin, deleteProduct);

module.exports=router;