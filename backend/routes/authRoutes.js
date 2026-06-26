const express=require('express');//import biblioteca express
const router=express.Router();//creez router express(organizare rute in fisiere separate)
const{login}=require('../controllers/authController');//import unctia login din fisier
router.post('/login', login);//router.post=cand serverul primeste un req http post la ruta /login, exeuta functia login

module.exports=router;//exportez routerul pt a-l folosi in aplicatia principala
