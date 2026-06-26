const db=require('../config/db');
const multer=require('multer');
const path=require('path');
const fs=require('fs');
const { calculateTVA } = require('../utils/tva');


const storage=multer.diskStorage({
    destination:(req, file, cb)=>{
        cb(null, 'uploads/');
    },
    filename:(req, file, cb)=>{
        const uniqueName=Date.now()+path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const fileFilter=(req, file, cb)=>{
    const allowedTypes=['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if(allowedTypes.includes(file.mimetype)){
        cb(null, true);
    }else{
        cb(new Error('Doar imagini JPEG, PNG sau WEBP sunt acceptate'), false);
    }
};

const upload=multer({
    storage,
    fileFilter,
    limits:{fileSize:5*1024*1024}
});

const getProducts=async(req,res)=>{
    try{
        const[rows]=await db.query('SELECT * FROM produse ORDER BY creat_la DESC');
        return res.json(rows);
    }catch(err){
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};

const getProductById=async(req,res)=>{
    const id=parseInt(req.params.id);
    if(isNaN(id)){
        return res.status(400).json({message:'ID invalid'});
    }
    try{
        const[rows]=await db.query('SELECT * FROM produse WHERE id=?',[id]);
        if(rows.length===0){
            return res.status(404).json({message:'Produsul nu a fost gasit'});
        }
        return res.json(rows[0]);
    }catch(err){
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};

const createProduct=async(req,res)=>{
    const{name, description, price, category}=req.body;
    const poza=req.file ? req.file.filename : null;

    if(!name || price==null || !category){
        return res.status(400).json({message:'Denumire, pret si categorie sunt obligatorii'});
    }
    if(isNaN(Number(price)) || Number(price)<=0){
        return res.status(400).json({message:'Pretul trebuie sa fie un numar pozitiv'});
    }
    try{
        const[result]=await db.query(
            'INSERT INTO produse (denumire, descriere, pret, categorie, poza) VALUES(?,?,?,?,?)',
            [name, description||null, price, category, poza]
        );
        const productId=result.insertId;
        const tva=await calculateTVA(productId);
        await db.query('UPDATE produse SET tva=? WHERE id=?',[tva, productId]);
        return res.status(201).json({message:'Produs creat cu succes', id:productId});
    }catch(err){
        if(poza){
            const filePath=path.join('uploads', poza);
            if(fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};

const updateProduct=async(req,res)=>{
    const id=parseInt(req.params.id);
    if(isNaN(id)){
        return res.status(400).json({message:'ID invalid'});
    }
    const{name, description, price, category}=req.body;

    if(!name || price==null || !category){
        return res.status(400).json({message:'Denumire, pret si categorie sunt obligatorii'});
    }
    if(isNaN(Number(price)) || Number(price)<=0){
        return res.status(400).json({message:'Pretul trebuie sa fie un numar pozitiv'});
    }
    try{
        let query='UPDATE produse SET denumire=?, descriere=?, pret=?, categorie=? WHERE id=?';
        let params=[name, description||null, price, category, id];

        if(req.file){
            const[rows]=await db.query('SELECT poza FROM produse WHERE id=?',[id]);
            if(rows.length>0 && rows[0].poza){
                const oldPath=path.join('uploads', rows[0].poza);
                if(fs.existsSync(oldPath)){
                    fs.unlinkSync(oldPath);
                }
            }
            query='UPDATE produse SET denumire=?, descriere=?, pret=?, categorie=?, poza=? WHERE id=?';
            params=[name, description||null, price, category, req.file.filename, id];
        }

        const[result]=await db.query(query, params);
        if(result.affectedRows===0){
            if(req.file){
                const newPath=path.join('uploads', req.file.filename);
                if(fs.existsSync(newPath)) fs.unlinkSync(newPath);
            }
            return res.status(404).json({message:'Produsul nu a fost gasit'});
        }
        const tva=await calculateTVA(id);
        await db.query('UPDATE produse SET tva=? WHERE id=?',[tva, id]);
        return res.json({message:'Produs actualizat cu succes'});
    }catch(err){
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};

const deleteProduct=async(req,res)=>{
    const id=parseInt(req.params.id);
    if(isNaN(id)){
        return res.status(400).json({message:'ID invalid'});
    }
    try{
        const[rows] = await db.query('SELECT poza FROM produse WHERE id=?', [id]);
        const[result] = await db.query('DELETE FROM produse WHERE id=?', [id]);
        if(result.affectedRows === 0){
            return res.status(404).json({message:'Produsul nu a fost gasit'});
        }

        if(rows.length > 0 && rows[0].poza){
            const oldPath = path.join('uploads', rows[0].poza);
            if(fs.existsSync(oldPath)){
                fs.unlinkSync(oldPath);
            }
        }
        return res.json({message:'Produs sters cu succes'});
    }catch(err){
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};


module.exports={getProducts, getProductById, createProduct, updateProduct, deleteProduct, upload};