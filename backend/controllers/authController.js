const db=require('../config/db');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');

const login=async(req, res)=>{ 
    const {email, password}=req.body;

    if(!email || !password){
        return res.status(400).json({message: 'Email si parola sunt obligatorii'});
    }

    try{
        const[rows]=await db.query('SELECT * FROM utilizatori WHERE email=?',[email]);

        if(rows.length===0){
            return res.status(401).json({message: 'Email sau parola incorecte'});
        }
        const user=rows[0];

        const isPasswordCorrect=await bcrypt.compare(password, user.parola_hash);
        if(!isPasswordCorrect){
            return res.status(401).json({message:'Email sau parola incorecte'});
        }

        const token=jwt.sign( 
            {id:user.id, role:user.rol},
            process.env.JWT_SECRET,
            {expiresIn:'8h'}  
        );

        return res.json({token, user: 
            {
                id:user.id,
                name:user.nume,
                email:user.email,
                role:user.rol
            }
        });

    }catch(err){
        console.error(err);
        return res.status(500).json({message:'Eroare server'});
    }
};
module.exports={login};