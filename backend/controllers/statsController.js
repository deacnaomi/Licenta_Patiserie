const db=require('../config/db');

const getDashboardStats=async(req,res)=>{
    try{
        const[todayOrders]=await db.query(`
            SELECT COUNT(*) as total, COALESCE(SUM(total), 0) as vanzari
            FROM comenzi
            WHERE DATE(data_livrare)=CURDATE()
        `);

        const[ordersByStatus]=await db.query(`
            SELECT status, COUNT(*) as total
            FROM comenzi
            GROUP BY status
        `);

        const[lowStocks]=await db.query(`
            SELECT s.*, i.denumire as nume_ingredient, i.unitate_masura
            FROM stocuri s
            JOIN ingrediente i ON s.ingredient_id=i.id
            WHERE s.cantitate_disponibila <= s.prag_minim
        `);

        const[topProducts]=await db.query(`
            SELECT p.denumire, SUM(dc.cantitate) as total_comandat
            FROM detalii_comanda dc
            JOIN produse p ON dc.produs_id=p.id
            GROUP BY p.id, p.denumire
            ORDER BY total_comandat DESC
            LIMIT 5
        `);
        const[todaySales]=await db.query(`
            SELECT COALESCE(SUM(total), 0) as vanzari
            FROM comenzi
            WHERE DATE(data_livrare)=CURDATE()
            AND status='predata'
        `);

        const[weeklySales]=await db.query(`
            SELECT 
                DATE(data_livrare) as data,
                COUNT(*) as numar_comenzi,
                COALESCE(SUM(total), 0) as total_vanzari
            FROM comenzi
            WHERE data_livrare >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            AND status = 'predata'
            GROUP BY DATE(data_livrare)
            ORDER BY data ASC
        `);

        return res.json({
            todayOrders: todayOrders[0],
             todaySales: todaySales[0],
            ordersByStatus,
            lowStocks,
            topProducts,
            weeklySales
        });

    }catch(err){
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};

module.exports={getDashboardStats};