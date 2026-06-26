    const db = require('../config/db');

    const calculateTVA = async (productId) => {
        try {
            const [recipe] = await db.query(`
                SELECT rp.cantitate_pe_produs, i.denumire
                FROM retete_produse rp
                JOIN ingrediente i ON rp.ingredient_id = i.id
                WHERE rp.produs_id = ?
            `, [productId]);

            if (recipe.length === 0) return 11;

            const gramajTotal = recipe.reduce((sum, item) => sum + Number(item.cantitate_pe_produs), 0);
            const zahar = recipe.find(item => item.denumire.toLowerCase() === 'zahar');
            const grameZahar = zahar ? Number(zahar.cantitate_pe_produs) : 0;

            if (gramajTotal === 0) return 11;

            const procentZahar = (grameZahar / gramajTotal) * 100;
            return procentZahar >= 10 ? 21 : 11;
        } catch (err) {
            console.error(err);
            return 11;
        }
    };

    module.exports = { calculateTVA };