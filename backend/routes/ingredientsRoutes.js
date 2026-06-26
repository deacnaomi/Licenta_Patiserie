const express=require('express');
const router=express.Router();
const{getIngredients, getIngredientById, createIngredient, updateIngredient, deleteIngredient}=require('../controllers/ingredientsController');
const{verifyToken, verifyAdmin}=require('../middlewares/authMiddleware');

router.get('/', verifyToken, getIngredients);
router.get('/:id', verifyToken, getIngredientById);
router.post('/', verifyToken, verifyAdmin, createIngredient);
router.put('/:id', verifyToken, verifyAdmin, updateIngredient);
router.delete('/:id', verifyToken, verifyAdmin, deleteIngredient);

module.exports=router;