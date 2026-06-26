const jwt=require('jsonwebtoken');

const verifyToken=(req,res,next)=>{ 
    const authHeader=req.headers['authorization'];
    const token=authHeader && authHeader.split(' ')[1];

    if(!token){
        return res.status(401).json({message:'Acces refuzat. Token lipsa.'});
    }

    try{
        const decoded=jwt.verify(token, process.env.JWT_SECRET);
        req.user=decoded;
        next();
    }catch(err){
        return res.status(401).json({message:'Token invalid sau expirat'});
    };

}

const verifyAdmin=(req,res,next)=>{
    if(req.user.role !=='admin'){
        return res.status(403).json({message:'Acces permis doar administratorilor.'})
    }
    next();
};

const verifyBrutar=(req,res,next)=>{
    if(req.user.role !== 'brutar' && req.user.role !=='admin'){
        return res.status(403).json({message: 'Acces refuzat.'});
    }
    next();
};

module.exports={verifyToken, verifyAdmin, verifyBrutar};