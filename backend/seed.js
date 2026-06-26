const bcrypt=require('bcryptjs');
const db=require('./config/db');
require('dotenv').config();

const createBrutar = async () => {
    try {
        const hashedPassword = await bcrypt.hash(process.env.SEED_PASSWORD, 10);
        await db.query(
            `INSERT INTO utilizatori (prenume, nume, email, parola_hash, rol) 
             VALUES (?, ?, ?, ?, ?)`,
            [process.env.SEED_PRENUME, process.env.SEED_NUME, process.env.SEED_EMAIL, hashedPassword, 'brutar']
        );
        console.log('Brutarul a fost creat cu succes!');
        console.log('Email:', process.env.SEED_EMAIL);
        console.log('Parola:', process.env.SEED_PASSWORD);
    } catch(err) {
        console.error('Eroare:', err.message);
    } finally {
        process.exit();
    }
};

createBrutar();