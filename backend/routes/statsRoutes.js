const express=require('express');
const router=express.Router();
const{getDashboardStats}=require('../controllers/statsController');
const{verifyToken, verifyAdmin}=require('../middlewares/authMiddleware');

router.get('/dashboard', verifyToken, verifyAdmin, getDashboardStats);

module.exports=router;