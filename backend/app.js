const express=require('express'); 
const cors=require('cors'); 

const authRoutes=require('./routes/authRoutes');
const productRoutes=require('./routes/productsRoutes');
const clientsRoutes=require('./routes/clientsRoutes');
const ordersRoutes=require('./routes/ordersRoutes');
const ingredientsRoutes=require('./routes/ingredientsRoutes');
const stocksRoutes=require('./routes/stocksRoutes');
const recipesRoutes=require('./routes/recipesRoutes');
const statsRoutes=require('./routes/statsRoutes');

const app=express(); 

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }))
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/api/auth', authRoutes);
app.use('/api/produse', productRoutes);
app.use('/api/clienti', clientsRoutes);
app.use('/api/comenzi', ordersRoutes);
app.use('/api/ingrediente', ingredientsRoutes);
app.use('/api/stocuri', stocksRoutes);
app.use('/api/statistici', statsRoutes);
app.use('/api/retete', recipesRoutes);

app.get('/', (req,res) => {
    res.json({message:'Serverul patiseriei functioneaza!'});
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Eroare internă server' });
})

module.exports=app;