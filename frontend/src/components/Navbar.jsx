import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';

function Navbar(){
    const navigate=useNavigate();
    const user=JSON.parse(localStorage.getItem('user'));
    const token=localStorage.getItem('token');
    const [lowStocksCount, setLowStocksCount]=useState(0);//numarul de stocuri sub prag

    const fetchLowStocks=async()=>{
        if(!token || user?.role!=='admin') return;//doar adminul vede alertele
        try{
            const response=await axios.get(`${import.meta.env.VITE_API_URL}/api/stocuri/alerta`,{
                headers:{Authorization:`Bearer ${token}`}
            });
            setLowStocksCount(response.data.length);//salvam numarul de stocuri sub prag
        }catch(err){
            console.error(err);
        }
    };

    useEffect(()=>{
        fetchLowStocks();
        // verificam stocurile la fiecare 60 de secunde
        const interval=setInterval(fetchLowStocks, 60000);
        return()=>clearInterval(interval);//curatam intervalul la unmount
    },[token]);

    const handleLogout=()=>{
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return(
        <nav className="px-6 py-3 flex justify-between items-center" style={{background:'#6B8F71'}}>
            {/* Stanga - numele aplicatiei */}
            <div className="text-lg font-bold" style={{color:'#fff'}}>
                🥐 Patiserie
            </div>

            {/* Mijloc - linkurile de navigare */}
            <div className="flex gap-6">
                {user?.role==='admin' && (
                    <>
                        <button onClick={()=>navigate('/dashboard')}
                            className="font-medium transition hover:opacity-80"
                            style={{color:'#C8DFC9'}}>
                            Dashboard
                        </button>
                        <button onClick={()=>navigate('/produse')}
                            className="font-medium transition hover:opacity-80"
                            style={{color:'#C8DFC9'}}>
                            Produse
                        </button>
                        <button onClick={()=>navigate('/clienti')}
                            className="font-medium transition hover:opacity-80"
                            style={{color:'#C8DFC9'}}>
                            Clienți
                        </button>
                        <button onClick={()=>navigate('/ingrediente')}
                            className="font-medium transition hover:opacity-80"
                            style={{color:'#C8DFC9'}}>
                            Ingrediente
                        </button>
                        {/* buton stocuri cu badge alerta */}
                        <button onClick={()=>navigate('/stocuri')}
                            className="font-medium transition hover:opacity-80 relative"
                            style={{color:'#C8DFC9'}}>
                            Stocuri
                            {/* badge rosu cu numarul de stocuri sub prag */}
                            {lowStocksCount>0&&(
                                <span className="absolute -top-2 -right-3 text-xs font-bold rounded-full flex items-center justify-center"
                                    style={{background:'#DC2626', color:'#fff', width:'16px', height:'16px', fontSize:'10px'}}>
                                    {lowStocksCount}
                                </span>
                            )}
                        </button>
                    </>
                )}
                <button onClick={()=>navigate('/comenzi')}
                    className="font-medium transition hover:opacity-80"
                    style={{color:'#C8DFC9'}}>
                    Comenzi
                </button>
            </div>

            {/* Dreapta - numele userului si logout */}
            <div className="flex items-center gap-4">
                {/* alerta stocuri scazute */}
                {lowStocksCount>0&&user?.role==='admin'&&(
                    <button onClick={()=>navigate('/stocuri')}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium hover:opacity-80"
                        style={{background:'#DC2626', color:'#fff'}}>
                        ⚠ {lowStocksCount} stoc{lowStocksCount>1?'uri':''} scăzut{lowStocksCount>1?'e':''}
                    </button>
                )}
                <span className="text-sm" style={{color:'#C8DFC9'}}>
                    {user?.name} — {user?.role}
                </span>
                <button onClick={handleLogout}
                    className="px-3 py-1 rounded text-sm font-medium hover:opacity-80"
                    style={{background:'#C9A84C', color:'#fff'}}>
                    Logout
                </button>
            </div>
        </nav>
    );
}

export default Navbar;