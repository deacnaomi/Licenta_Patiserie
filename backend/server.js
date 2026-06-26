require('dotenv').config();
const app=require('./app');
const http=require('http');
const {Server}=require('socket.io');

const server=http.createServer(app);
const io=new Server(server, {
    cors:{
        origin:process.env.FRONTEND_URL || 'http://localhost:5173',
        methods:['GET','POST','PUT','DELETE']
    }
});
global.io=io;

io.on('connection', (socket)=>{
    console.log('Client conectat:', socket.id);
    socket.on('disconnect', ()=>{
        console.log('Client deconectat:', socket.id);
    });
});

const PORT=process.env.PORT || 3000;

server.listen(PORT, ()=>{
    console.log(`Server running on http://localhost:${PORT}`);
});

server.on('error', (err)=>{
    console.error('Eroare server:', err);
});