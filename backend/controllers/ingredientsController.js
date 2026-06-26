const db=require('../config/db');

const getIngredients=async(req,res)=>{
    try{
        const[rows]=await db.query('SELECT * FROM ingrediente ORDER BY denumire ASC');
        return res.json(rows);
    }catch(err){
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};

const getIngredientById=async(req,res)=>{
    const id=parseInt(req.params.id);
    if(isNaN(id)){
        return res.status(400).json({message:'ID invalid'});
    }
    try{
        const[rows]=await db.query('SELECT * FROM ingrediente WHERE id=?',[id]);
        if(rows.length===0){
            return res.status(404).json({message:'Ingredientul nu a fost gasit'});
        }
        return res.json(rows[0]);
    }catch(err){
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};

const createIngredient=async(req,res)=>{
    const{name, unit}=req.body;
    const trimmedName=name?.trim();

    if(!trimmedName || !unit){
        return res.status(400).json({message:'Numele si unitatea de masura sunt obligatorii'});
    }
    try{
        const[result]=await db.query(
            'INSERT INTO ingrediente (denumire, unitate_masura) VALUES(?,?)',
            [trimmedName, unit]
        );
        return res.status(201).json({message:'Ingredient creat cu succes', id:result.insertId});
    }catch(err){
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};

const updateIngredient=async(req,res)=>{
    const id=parseInt(req.params.id);
    if(isNaN(id)){
        return res.status(400).json({message:'ID invalid'});
    }
    const{name, unit}=req.body;
    const trimmedName=name?.trim();

    if(!trimmedName || !unit){
        return res.status(400).json({message:'Numele si unitatea de masura sunt obligatorii'});
    }
    try{
        const[result]=await db.query(
            'UPDATE ingrediente SET denumire=?, unitate_masura=? WHERE id=?',
            [trimmedName, unit, id]
        );
        if(result.affectedRows===0){
            return res.status(404).json({message:'Ingredientul nu a fost gasit'});
        }
        return res.json({message:'Ingredient actualizat cu succes'});
    }catch(err){
        if(err.code==='ER_DUP_ENTRY'){
            return res.status(400).json({message:'Exista deja un ingredient cu acest nume'});
        }
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};

const deleteIngredient=async(req,res)=>{
    const id=parseInt(req.params.id);
    if(isNaN(id)){
        return res.status(400).json({message:'ID invalid'});
    }
    try{
        const[result]=await db.query('DELETE FROM ingrediente WHERE id=?',[id]);
        if(result.affectedRows===0){
            return res.status(404).json({message:'Ingredientul nu a fost gasit'});
        }
        return res.json({message:'Ingredient sters cu succes'});
    }catch(err){
        if(err.code==='ER_ROW_IS_REFERENCED_2'){
            return res.status(400).json({message:'Nu poți șterge un ingredient care este folosit într-o rețetă'});
        }
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};

module.exports={getIngredients, getIngredientById, createIngredient, updateIngredient, deleteIngredient};