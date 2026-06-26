const express=require('express');
const router=express.Router();
const{getClients, getClientById, createClient, updateClient, deleteClient, searchClients, getClientOrders}=require('../controllers/clientsController');
const {verifyToken, verifyAdmin}=require('../middlewares/authMiddleware');

router.get('/', verifyToken, getClients);
router.get('/search', verifyToken, searchClients);
router.get('/:id', verifyToken, getClientById);
router.get('/:id/comenzi', verifyToken, getClientOrders);

router.post('/', verifyToken, verifyAdmin, createClient);
router.put('/:id', verifyToken, verifyAdmin, updateClient);
router.delete('/:id', verifyToken, verifyAdmin, deleteClient);

module.exports=router;