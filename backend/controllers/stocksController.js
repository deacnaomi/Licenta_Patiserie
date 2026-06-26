const db=require('../config/db');//import conexiunea la baza de date

const getStocks=async(req,res)=>{//returneaza toate stocurile cu numele ingredientului
    try{
        const[rows]=await db.query(`
            SELECT s.*, i.denumire as nume_ingredient, i.unitate_masura
            FROM stocuri s
            JOIN ingrediente i ON s.ingredient_id=i.id
            ORDER BY i.denumire ASC
        `);
        return res.json(rows);
    }catch(err){
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};

const getStockById=async(req,res)=>{//returneaza un stoc dupa id
    const id=parseInt(req.params.id);
    if(isNaN(id)){
        return res.status(400).json({message:'ID invalid'});
    }
    try{
        const[rows]=await db.query(`
            SELECT s.*, i.denumire as nume_ingredient, i.unitate_masura
            FROM stocuri s
            JOIN ingrediente i ON s.ingredient_id=i.id
            WHERE s.id=?
        `,[id]);
        if(rows.length===0){
            return res.status(404).json({message:'Stocul nu a fost gasit'});
        }
        return res.json(rows[0]);
    }catch(err){
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};

const createStock=async(req,res)=>{//creeaza un stoc nou
    const{ingredient_id, cantitate_disponibila, prag_minim}=req.body;

    if(!ingredient_id || cantitate_disponibila==null || prag_minim==null){
        return res.status(400).json({message:'Ingredientul, cantitatea si pragul minim sunt obligatorii'});
    }
    if(isNaN(Number(cantitate_disponibila)) || Number(cantitate_disponibila)<0){
        return res.status(400).json({message:'Cantitatea trebuie sa fie un numar pozitiv'});
    }
    if(isNaN(Number(prag_minim)) || Number(prag_minim)<0){
        return res.status(400).json({message:'Pragul minim trebuie sa fie un numar pozitiv'});
    }

    try{
        const[existing]=await db.query('SELECT id FROM stocuri WHERE ingredient_id=?',[ingredient_id]);
        if(existing.length>0){
            return res.status(400).json({message:'Exista deja un stoc pentru acest ingredient'});
        }

        const[result]=await db.query(
            'INSERT INTO stocuri (ingredient_id, cantitate_disponibila, prag_minim) VALUES(?,?,?)',
            [ingredient_id, cantitate_disponibila, prag_minim]
        );
        return res.status(201).json({message:'Stoc creat cu succes', id:result.insertId});
    }catch(err){
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};

const updateStock=async(req,res)=>{//actualizeaza un stoc
    const id=parseInt(req.params.id);
    if(isNaN(id)){
        return res.status(400).json({message:'ID invalid'});
    }
    const{cantitate_disponibila, prag_minim}=req.body;

    if(cantitate_disponibila==null || prag_minim==null){
        return res.status(400).json({message:'Cantitatea si pragul minim sunt obligatorii'});
    }
    if(isNaN(Number(cantitate_disponibila)) || Number(cantitate_disponibila)<0){
        return res.status(400).json({message:'Cantitatea trebuie sa fie un numar pozitiv'});
    }
    if(isNaN(Number(prag_minim)) || Number(prag_minim)<0){
        return res.status(400).json({message:'Pragul minim trebuie sa fie un numar pozitiv'});
    }

    try{
        const[result]=await db.query(
            'UPDATE stocuri SET cantitate_disponibila=?, prag_minim=? WHERE id=?',
            [cantitate_disponibila, prag_minim, id]
        );
        if(result.affectedRows===0){
            return res.status(404).json({message:'Stocul nu a fost gasit'});
        }
        return res.json({message:'Stoc actualizat cu succes'});
    }catch(err){
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};

const deleteStock=async(req,res)=>{//sterge un stoc
    const id=parseInt(req.params.id);
    if(isNaN(id)){
        return res.status(400).json({message:'ID invalid'});
    }
    try{
        const[result]=await db.query('DELETE FROM stocuri WHERE id=?',[id]);
        if(result.affectedRows===0){
            return res.status(404).json({message:'Stocul nu a fost gasit'});
        }
        return res.json({message:'Stoc sters cu succes'});
    }catch(err){
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};

// GET /api/stocuri/alerta - returneaza stocurile sub pragul minim
const getLowStocks=async(req,res)=>{
    try{
        const[rows]=await db.query(`
            SELECT s.*, i.denumire as nume_ingredient, i.unitate_masura
            FROM stocuri s
            JOIN ingrediente i ON s.ingredient_id=i.id
            WHERE s.cantitate_disponibila <= s.prag_minim
            ORDER BY i.denumire ASC
        `);
        return res.json(rows);
    }catch(err){
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};

module.exports={getStocks, getStockById, createStock, updateStock, deleteStock, getLowStocks};