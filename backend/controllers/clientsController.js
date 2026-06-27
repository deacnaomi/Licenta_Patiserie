const db=require('../config/db');

const getClients=async(req,res)=>{
    try{
        const[rows]=await db.query('SELECT * FROM clienti ORDER BY nume ASC');
        return res.json(rows);
    }catch(err){
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};

const getClientById=async(req,res)=>{
    const id=parseInt(req.params.id);
    if(isNaN(id)){
        return res.status(400).json({message:'ID invalid'});
    }
    try{
        const[rows]=await db.query('SELECT * FROM clienti WHERE id=?',[id]);
        if(rows.length===0){
            return res.status(404).json({message:'Clientul nu a fost gasit'});
        }
        return res.json(rows[0]);
    }catch(err){
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};

const createClient=async(req,res)=>{
    const{name, phone, address, notes}=req.body;
    const trimmedName=name?.trim();

    if(!trimmedName){
        return res.status(400).json({message:'Numele clientului este obligatoriu'});
    }
    try{
        const[existing]=await db.query(
            'SELECT id FROM clienti WHERE nume=?',
            [trimmedName]
        );
        if(existing.length>0){
            return res.status(400).json({message:'Există deja un client cu acest nume'});
        }
        const[result]=await db.query(
            'INSERT INTO clienti (nume, telefon, adresa, observatii) VALUES(?,?,?,?)',
            [trimmedName, phone||null, address||null, notes||null]
        );
        return res.status(201).json({message:'Client creat cu succes', id:result.insertId});
    }catch(err){
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};

const updateClient=async(req,res)=>{
    const id=parseInt(req.params.id);
    if(isNaN(id)){
        return res.status(400).json({message:'ID invalid'});
    }
    const{name, phone, address, notes}=req.body;
    const trimmedName=name?.trim();

    if(!trimmedName){
        return res.status(400).json({message:'Numele clientului este obligatoriu'});
    }
    try{
        const[result]=await db.query(
            'UPDATE clienti SET nume=?, telefon=?, adresa=?, observatii=? WHERE id=?',
            [trimmedName, phone||null, address||null, notes||null, id]
        );
        if(result.affectedRows===0){
            return res.status(404).json({message:'Clientul nu a fost gasit'});
        }
        return res.json({message:'Client actualizat cu succes'});
    }catch(err){
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};

const deleteClient=async(req,res)=>{
    const id=parseInt(req.params.id);
    if(isNaN(id)){
        return res.status(400).json({message:'ID invalid'});
    }
    try{
        const[orders]=await db.query(
            'SELECT id FROM comenzi WHERE client_id=?',[id]
        );
        if(orders.length>0){
            return res.status(400).json({message:'Nu poți șterge un client care are comenzi asociate'});
        }
        const[result]=await db.query('DELETE FROM clienti WHERE id=?',[id]);
        if(result.affectedRows===0){
            return res.status(404).json({message:'Clientul nu a fost gasit'});
        }
        return res.json({message:'Client sters cu succes'});
    }catch(err){
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};

const searchClients=async(req,res)=>{
    const{query}=req.query;
    if(!query){
        return res.json([]);
    }
    try{
        const[rows]=await db.query(
            'SELECT * FROM clienti WHERE nume LIKE ? ORDER BY nume ASC LIMIT 5',
            [`%${query}%`]
        );
        return res.json(rows);
    }catch(err){
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};

const getClientOrders=async(req,res)=>{
    const id=parseInt(req.params.id);
    if(isNaN(id)){
        return res.status(400).json({message:'ID invalid'});
    }
    try{
        const[orders]=await db.query(`
            SELECT c.*, 
                COUNT(dc.id) as numar_produse,
                SUM(dc.cantitate) as total_bucati
            FROM comenzi c
            LEFT JOIN detalii_comanda dc ON c.id=dc.comanda_id
            WHERE c.client_id=?
            GROUP BY c.id
            ORDER BY c.creat_la DESC
        `,[id]);
        return res.json(orders);
    }catch(err){
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};

module.exports={getClients, getClientById, createClient, updateClient, deleteClient, searchClients, getClientOrders};