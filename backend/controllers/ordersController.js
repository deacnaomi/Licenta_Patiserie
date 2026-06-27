const db=require('../config/db');

const getOrders=async(req,res)=>{
    try{
        const[rows]=await db.query(`
            SELECT c.*, cl.nume as nume_client, cl.telefon as telefon_client
            FROM comenzi c
            LEFT JOIN clienti cl ON c.client_id=cl.id
            ORDER BY c.creat_la DESC
        `);
        return res.json(rows);
    }catch(err){
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};

const getOrderById=async(req,res)=>{
    const id=parseInt(req.params.id);
    if(isNaN(id)){
        return res.status(400).json({message:'ID invalid'});
    }
    try{
        const[rows]=await db.query(`
            SELECT c.*, cl.nume as nume_client, cl.telefon as telefon_client, cl.adresa as adresa_client
            FROM comenzi c
            LEFT JOIN clienti cl ON c.client_id=cl.id
            WHERE c.id=?
        `,[id]);

        if(rows.length===0){
            return res.status(404).json({message:'Comanda nu a fost gasita'});
        }

        const[details]=await db.query(`
            SELECT dc.*, p.denumire as nume_produs, p.pret as pret_produs
            FROM detalii_comanda dc
            JOIN produse p ON dc.produs_id=p.id
            WHERE dc.comanda_id=?
        `,[id]);

        const order=rows[0];
        order.produse=details;
        const[history]=await db.query(`
            SELECT isc.*, u.prenume, u.nume
            FROM istoric_status_comanda isc
            JOIN utilizatori u ON isc.modificat_de=u.id
            WHERE isc.comanda_id=?
            ORDER BY isc.modificat_la ASC
        `,[id]);

order.istoric=history; 
        return res.json(order);
    }catch(err){
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};

const createOrder=async(req,res)=>{
    const{client_id, data_livrare, observatii, produse, modalitate_livrare}=req.body;

    if(!client_id || !data_livrare || !modalitate_livrare){
        return res.status(400).json({message:'Clientul, data livrarii si modalitatea de livrare sunt obligatorii'});
    }
    if(!produse || produse.length===0){
        return res.status(400).json({message:'Comanda trebuie sa contina cel putin un produs'});
    }

    try{
        let total=0;
        const pretMap={};
        for (const produs of produse) {
            const [rows] = await db.query(
                'SELECT pret, tva FROM produse WHERE id=?', 
                [produs.produs_id]
            );
            if (rows.length === 0) {
                return res.status(404).json({ message: `Produsul cu id ${produs.produs_id} nu exista` });
            }
            const pretFaraTVA = Number(rows[0].pret);
            const tva = rows[0].tva ?? 11;
            const pretCuTVA = pretFaraTVA * (1 + tva / 100);
            pretMap[produs.produs_id] = { faraTVA: pretFaraTVA, cuTVA: pretCuTVA };
            total += pretCuTVA * produs.cantitate;
        }
        const[result]=await db.query(
            `INSERT INTO comenzi (client_id, status, data_livrare, observatii, creat_de, total, modalitate_livrare)
            VALUES(?,?,?,?,?,?,?)`,
            [client_id, 'in_asteptare', data_livrare, observatii||null, req.user.id, total, modalitate_livrare]
        );

        const orderId=result.insertId;

        for (const produs of produse) {
            await db.query(
                `INSERT INTO detalii_comanda 
                (comanda_id, produs_id, cantitate, pret_unitar, pret_unitar_cu_tva) 
                VALUES(?,?,?,?,?)`,
                [
                    orderId, 
                    produs.produs_id, 
                    produs.cantitate, 
                    pretMap[produs.produs_id].faraTVA,
                    pretMap[produs.produs_id].cuTVA
                ]
            );
        }

        await db.query(
            `INSERT INTO istoric_status_comanda (comanda_id, status_vechi, status_nou, modificat_de) 
             VALUES(?,?,?,?)`,
            [orderId, null, 'in_asteptare', req.user.id]
        );
        if(global.io){
            global.io.emit('comanda_noua', {orderId, message:'Comanda noua adaugata'});
        }
        return res.status(201).json({message:'Comanda creata cu succes', id:orderId});

    }catch(err){
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};

const updateOrderStatus=async(req,res)=>{
    const id=parseInt(req.params.id);
    if(isNaN(id)){
        return res.status(400).json({message:'ID invalid'});
    }

    const{status}=req.body;
    const validStatuses = ['in_asteptare', 'in_lucru', 'gata', 'predata', 'anulata'];

    if(!status || !validStatuses.includes(status)){
        return res.status(400).json({message:'Status invalid'});
    }

    try{
        const[rows]=await db.query('SELECT status FROM comenzi WHERE id=?',[id]);
        if(rows.length===0){
            return res.status(404).json({message:'Comanda nu a fost gasita'});
        }

        const oldStatus=rows[0].status;
            if(req.user.role === 'admin' && ['in_lucru', 'gata'].includes(status)){
                return res.status(403).json({
                    message: 'Administratorul nu poate marca o comandă în lucru sau gata'
                });
            }

            if(req.user.role === 'brutar' && status === 'predata'){
                return res.status(403).json({
                    message: 'Brutarul nu poate marca o comandă drept predată'
                });
            }
            if(status==='anulata' && !['in_asteptare', 'in_lucru'].includes(oldStatus)){
                return res.status(400).json({message:'Comanda poate fi anulată doar dacă este în așteptare sau în lucru'});
            }

        if(status==='gata' && oldStatus!=='gata'){
            const[orderDetails]=await db.query(
                'SELECT produs_id, cantitate FROM detalii_comanda WHERE comanda_id=?',[id]
            );
            for(const detail of orderDetails){
                const[recipe]=await db.query(
                    'SELECT ingredient_id, cantitate_pe_produs FROM retete_produse WHERE produs_id=?',
                    [detail.produs_id]
                );
                for(const item of recipe){
                    const cantitateUsata=item.cantitate_pe_produs*detail.cantitate;
                    const[stoc]=await db.query(
                        'SELECT cantitate_disponibila FROM stocuri WHERE ingredient_id=?',
                        [item.ingredient_id]
                    );
                    if(stoc.length===0 || stoc[0].cantitate_disponibila<cantitateUsata){
                        return res.status(400).json({message:'Stoc insuficient pentru a finaliza comanda'});
                    }
                }
            }
        }

        await db.query('UPDATE comenzi SET status=? WHERE id=?',[status, id]);

        await db.query(
            `INSERT INTO istoric_status_comanda (comanda_id, status_vechi, status_nou, modificat_de) 
             VALUES(?,?,?,?)`,
            [id, oldStatus, status, req.user.id]
        );

        if(status==='gata' && oldStatus!=='gata'){
            const[orderDetails]=await db.query(
                'SELECT produs_id, cantitate FROM detalii_comanda WHERE comanda_id=?',[id]
            );
            for(const detail of orderDetails){
                const[recipe]=await db.query(
                    'SELECT ingredient_id, cantitate_pe_produs FROM retete_produse WHERE produs_id=?',
                    [detail.produs_id]
                );
                for(const item of recipe){
                    const cantitateUsata=item.cantitate_pe_produs*detail.cantitate;
                    await db.query(
                        'UPDATE stocuri SET cantitate_disponibila=cantitate_disponibila-? WHERE ingredient_id=?',
                        [cantitateUsata, item.ingredient_id]
                    );
                }
            }
        }

        if(global.io){
            global.io.emit('status_actualizat', {orderId:id, status, message:'Status actualizat'});
            if(status==='gata'){
                global.io.emit('stoc_actualizat');
            }
        }
        return res.json({message:'Status actualizat cu succes'});

    }catch(err){
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};

const deleteOrder=async(req,res)=>{
    const id=parseInt(req.params.id);
    if(isNaN(id)){
        return res.status(400).json({message:'ID invalid'});
    }
    try{
        const[result]=await db.query('DELETE FROM comenzi WHERE id=?',[id]);
        if(result.affectedRows===0){
            return res.status(404).json({message:'Comanda nu a fost gasita'});
        }
        if(global.io){
            global.io.emit('comanda_stearsa', {orderId:id});
        }
        return res.json({message:'Comanda stearsa cu succes'});
    }catch(err){
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};
const getOrdersWithProducts=async(req,res)=>{
    try{
        const[orders]=await db.query(`
            SELECT c.*, cl.nume as nume_client, cl.telefon as telefon_client
            FROM comenzi c
            LEFT JOIN clienti cl ON c.client_id=cl.id
            WHERE c.status NOT IN ('predata', 'gata')
            ORDER BY c.creat_la DESC
        `);
        for(const order of orders){
            const[details]=await db.query(`
                SELECT dc.*, p.denumire as nume_produs, p.pret as pret_produs
                FROM detalii_comanda dc
                JOIN produse p ON dc.produs_id=p.id
                WHERE dc.comanda_id=?
            `,[order.id]);
            order.produse=details;
        }

        return res.json(orders);
    }catch(err){
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};

const getRequiredIngredients=async(req,res)=>{
    try{

        const{data}=req.query;
        
        const[orders]=await db.query(`
            SELECT dc.produs_id, dc.cantitate
            FROM detalii_comanda dc
            JOIN comenzi c ON dc.comanda_id=c.id
            WHERE c.status NOT IN ('predata', 'anulata', 'gata')
            ${data ? 'AND DATE(c.data_livrare)=?' : ''}
        `, data ? [data] : []);

        const ingredientMap={};

        for(const order of orders){
            const[recipe]=await db.query(`
                SELECT rp.ingredient_id, rp.cantitate_pe_produs, i.denumire, i.unitate_masura
                FROM retete_produse rp
                JOIN ingrediente i ON rp.ingredient_id=i.id
                WHERE rp.produs_id=?
            `,[order.produs_id]);

            for(const item of recipe){
                const totalQuantity=item.cantitate_pe_produs*order.cantitate;
                if(ingredientMap[item.ingredient_id]){
                    ingredientMap[item.ingredient_id].cantitate+=totalQuantity;
                }else{
                    ingredientMap[item.ingredient_id]={
                        ingredient_id:item.ingredient_id,
                        nume:item.denumire,
                        cantitate:totalQuantity,
                        unitate:item.unitate_masura
                    };
                }
            }
        }

        const result=Object.values(ingredientMap);

        return res.json(result);
    }catch(err){
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};

const updateOrder=async(req,res)=>{
    const id=parseInt(req.params.id);
    if(isNaN(id)){
        return res.status(400).json({message:'ID invalid'});
    }
        try{
            const[statusRows]=await db.query('SELECT status FROM comenzi WHERE id=?',[id]);
            if(statusRows.length===0) return res.status(404).json({message:'Comanda nu a fost gasita'});
            if(['in_lucru','gata','predata','anulata'].includes(statusRows[0].status)){
                return res.status(400).json({message:'Nu poți edita o comandă care este deja în lucru sau finalizată'});
            }
        }catch(err){
            return res.status(500).json({message:'Eroare server'});
        }

    const{client_id, data_livrare, observatii, produse, modalitate_livrare}=req.body

    if(!client_id || !data_livrare || !modalitate_livrare){
        return res.status(400).json({message:'Clientul, data livrarii si modalitatea de livrare sunt obligatorii'});
    }
    if(!produse || produse.length===0){
        return res.status(400).json({message:'Comanda trebuie sa contina cel putin un produs'});
    }

    try{
        let total=0;
        const pretMap={};
        for (const produs of produse) {
            const [rows] = await db.query(
                'SELECT pret, tva FROM produse WHERE id=?',
                [produs.produs_id]
            );
            if (rows.length === 0) {
                return res.status(404).json({ message: `Produsul cu id ${produs.produs_id} nu exista` });
            }
            const pretFaraTVA = Number(rows[0].pret);
            const tva = rows[0].tva ?? 11;
            const pretCuTVA = pretFaraTVA * (1 + tva / 100);
            pretMap[produs.produs_id] = { faraTVA: pretFaraTVA, cuTVA: pretCuTVA };
            total += pretCuTVA * produs.cantitate;
        }

        await db.query(
            'UPDATE comenzi SET client_id=?, data_livrare=?, observatii=?, total=?, modalitate_livrare=? WHERE id=?',
            [client_id, data_livrare, observatii||null, total, modalitate_livrare, id]
        );

        await db.query('DELETE FROM detalii_comanda WHERE comanda_id=?',[id]);

        for (const produs of produse) {
            await db.query(
                `INSERT INTO detalii_comanda 
                (comanda_id, produs_id, cantitate, pret_unitar, pret_unitar_cu_tva) 
                VALUES(?,?,?,?,?)`,
                [
                    id,
                    produs.produs_id,
                    produs.cantitate,
                    pretMap[produs.produs_id].faraTVA,
                    pretMap[produs.produs_id].cuTVA
                ]
            );
        }

        if(global.io){
            global.io.emit('comanda_actualizata', {orderId:id});
        }

        return res.json({message:'Comanda actualizata cu succes'});
    }catch(err){
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};

module.exports={getOrders, getOrderById, createOrder, updateOrder, updateOrderStatus, deleteOrder, getOrdersWithProducts, getRequiredIngredients};