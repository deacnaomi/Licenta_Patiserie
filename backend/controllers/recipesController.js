const db=require('../config/db');//import conexiunea la baza de date
const { calculateTVA } = require('../utils/tva');

// GET /api/retete/:produs_id - returneaza reteta unui produs
const getRecipeByProduct=async(req,res)=>{
    const productId=parseInt(req.params.produs_id);
    if(isNaN(productId)){
        return res.status(400).json({message:'ID invalid'});
    }
    try{
        const[rows]=await db.query(`
            SELECT rp.*, i.denumire as nume_ingredient, i.unitate_masura
            FROM retete_produse rp
            JOIN ingrediente i ON rp.ingredient_id=i.id
            WHERE rp.produs_id=?
            ORDER BY i.denumire ASC
        `,[productId]);
        return res.json(rows);
    }catch(err){
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};

// POST /api/retete - adauga un ingredient la reteta unui produs
const addIngredientToRecipe=async(req,res)=>{
    const{produs_id, ingredient_id, cantitate_pe_produs}=req.body;

    if(!produs_id || !ingredient_id || cantitate_pe_produs==null){
        return res.status(400).json({message:'Produsul, ingredientul si cantitatea sunt obligatorii'});
    }
    if(isNaN(Number(cantitate_pe_produs)) || Number(cantitate_pe_produs)<=0){
        return res.status(400).json({message:'Cantitatea trebuie sa fie un numar pozitiv'});
    }

    try{
        //verificam daca ingredientul exista deja in reteta acestui produs
        const[existing]=await db.query(
            'SELECT id FROM retete_produse WHERE produs_id=? AND ingredient_id=?',
            [produs_id, ingredient_id]
        );
        if(existing.length>0){
            return res.status(400).json({message:'Ingredientul exista deja in reteta acestui produs'});
        }

        const[result]=await db.query(
            'INSERT INTO retete_produse (produs_id, ingredient_id, cantitate_pe_produs) VALUES(?,?,?)',
            [produs_id, ingredient_id, cantitate_pe_produs]
        );

        //recalculam tva dupa adaugarea ingredientului
        const newTVA=await calculateTVA(produs_id);
        await db.query('UPDATE produse SET tva=? WHERE id=?',[newTVA, produs_id]);

        return res.status(201).json({message:'Ingredient adaugat la reteta', id:result.insertId});
    }catch(err){
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};

// PUT /api/retete/:id - actualizeaza cantitatea unui ingredient din reteta
const updateRecipeIngredient=async(req,res)=>{
    const id=parseInt(req.params.id);
    if(isNaN(id)){
        return res.status(400).json({message:'ID invalid'});
    }
    const{cantitate_pe_produs}=req.body;

    if(cantitate_pe_produs==null){
        return res.status(400).json({message:'Cantitatea este obligatorie'});
    }
    if(isNaN(Number(cantitate_pe_produs)) || Number(cantitate_pe_produs)<=0){
        return res.status(400).json({message:'Cantitatea trebuie sa fie un numar pozitiv'});
    }

    try{
        //aflam produs_id inainte de update
        const[recipeItem]=await db.query('SELECT produs_id FROM retete_produse WHERE id=?',[id]);
        const produsId=recipeItem[0]?.produs_id;

        const[result]=await db.query(
            'UPDATE retete_produse SET cantitate_pe_produs=? WHERE id=?',
            [cantitate_pe_produs, id]
        );
        if(result.affectedRows===0){
            return res.status(404).json({message:'Ingredientul din reteta nu a fost gasit'});
        }

        //recalculam tva dupa update
        if(produsId){
            const newTVA=await calculateTVA(produsId);
            await db.query('UPDATE produse SET tva=? WHERE id=?',[newTVA, produsId]);
        }

        return res.json({message:'Reteta actualizata cu succes'});
    }catch(err){
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};

// DELETE /api/retete/:id - sterge un ingredient din reteta
const deleteRecipeIngredient=async(req,res)=>{
    const id=parseInt(req.params.id);
    if(isNaN(id)){
        return res.status(400).json({message:'ID invalid'});
    }
    try{
        //aflam produs_id inainte de stergere
        const[recipeItem]=await db.query('SELECT produs_id FROM retete_produse WHERE id=?',[id]);
        const produsId=recipeItem[0]?.produs_id;

        const[result]=await db.query('DELETE FROM retete_produse WHERE id=?',[id]);
        if(result.affectedRows===0){
            return res.status(404).json({message:'Ingredientul din reteta nu a fost gasit'});
        }

        //recalculam tva dupa stergere
        if(produsId){
            const newTVA=await calculateTVA(produsId);
            await db.query('UPDATE produse SET tva=? WHERE id=?',[newTVA, produsId]);
        }

        return res.json({message:'Ingredient sters din reteta'});
    }catch(err){
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};

module.exports={getRecipeByProduct, addIngredientToRecipe, updateRecipeIngredient, deleteRecipeIngredient};