const express=require('express');
const router=express.Router();
const{getRecipeByProduct, addIngredientToRecipe, updateRecipeIngredient, deleteRecipeIngredient}=require('../controllers/recipesController');
const{verifyToken, verifyAdmin}=require('../middlewares/authMiddleware');//protejez rutele

router.get('/:produs_id', verifyToken, getRecipeByProduct);//toti pot vedea reteta unui produs
router.post('/', verifyToken, verifyAdmin, addIngredientToRecipe);//doar adminul poate adauga ingrediente la reteta
router.put('/:id', verifyToken, verifyAdmin, updateRecipeIngredient);//doar adminul poate actualiza reteta
router.delete('/:id', verifyToken, verifyAdmin, deleteRecipeIngredient);//doar adminul poate sterge din reteta

module.exports=router;