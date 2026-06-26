import {useState, useEffect} from 'react';
import axios from 'axios';
import {useNavigate} from 'react-router-dom';
import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer} from 'recharts';
import Loading from '../components/Loading';

const GREEN='#6B8F71';
const GREEN_LIGHT='#EDF5EE';
const GREEN_DARK='#4A6B50';
const GOLD='#C9A84C';

function Dashboard(){
    const [stats, setStats]=useState(null);
    const [error, setError]=useState('');
    const navigate=useNavigate();
    const token=localStorage.getItem('token');

    const fetchStats=async()=>{
        try{
            const response=await axios.get(`${import.meta.env.VITE_API_URL}/api/statistici/dashboard`,{
                headers:{Authorization:`Bearer ${token}`}
            });
            setStats(response.data);
        }catch(err){
            if(err.response?.status===401){
                localStorage.removeItem('token');
                navigate('/login');
            }else{
                setError('Eroare la incarcarea statisticilor');
            }
        }
    };

    useEffect(()=>{
        if(!token){navigate('/login'); return;}
        fetchStats();
    },[token, navigate]);

    if(!stats) return <Loading />;

    const chartData=stats.weeklySales.map(item=>({
        data:new Date(item.data).toLocaleDateString('ro-RO', {day:'2-digit', month:'2-digit'}),
        vanzari:Number(item.total_vanzari),
        comenzi:item.numar_comenzi
    }));

    const statusColors={
        'in_asteptare':{bg:'#FEF9C3', color:'#854D0E'},
        'in_lucru':{bg:'#DBEAFE', color:'#1E40AF'},
        'gata':{bg:GREEN_LIGHT, color:GREEN_DARK},
        'predata':{bg:'#F3F4F6', color:'#6B7280'},
        'anulata':{bg:'#FEF2F2', color:'#B91C1C'}
    };

    const statusLabels={
        'in_asteptare':'În așteptare',
        'in_lucru':'În lucru',
        'gata':'Gata',
        'predata':'Predată',
        'anulata':'Anulată'
    };
    const convertQuantity=(cantitate, unitate)=>{
        if(unitate==='g' && cantitate>=1000) return `${(cantitate/1000).toFixed(2)} kg`;
        if(unitate==='ml' && cantitate>=1000) return `${(cantitate/1000).toFixed(2)} l`;
        return `${Number(Number(cantitate).toFixed(2))} ${unitate}`;
    };

    return(
        <div className="min-h-screen p-6" style={{background:'#F8F9FA'}}>
            <div className="max-w-6xl mx-auto">
                <h1 className="text-2xl font-bold mb-6" style={{color:'#2D2D2D'}}>Dashboard</h1>

                {error&&<div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

                <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl border p-4" style={{borderColor:'#D1E4D3'}}>
                        <p className="text-sm mb-1" style={{color:'#6B8F71'}}>Comenzi azi</p>
                        <p className="text-3xl font-bold" style={{color:'#2D2D2D'}}>{stats.todayOrders.total}</p>
                    </div>
                    <div className="bg-white rounded-xl border p-4" style={{borderColor:'#D1E4D3'}}>
                        <p className="text-sm mb-1" style={{color:'#6B8F71'}}>Vânzări azi</p>
                        <p className="text-3xl font-bold" style={{color:GOLD}}>{Number(stats.todayOrders.vanzari).toFixed(2)} RON</p>
                    </div>
                    <div className="bg-white rounded-xl border p-4" style={{borderColor:'#D1E4D3'}}>
                        <p className="text-sm mb-1" style={{color:'#6B8F71'}}>Total comenzi</p>
                        <p className="text-3xl font-bold" style={{color:'#2D2D2D'}}>
                            {stats.ordersByStatus.reduce((acc, s)=>acc+s.total, 0)}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl border p-4" style={{borderColor:'#D1E4D3'}}>
                        <p className="text-sm mb-1" style={{color:'#6B8F71'}}>Stocuri sub prag</p>
                        <p className="text-3xl font-bold" style={{color:stats.lowStocks.length>0?'#DC2626':GREEN}}>
                            {stats.lowStocks.length}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white rounded-xl border p-4" style={{borderColor:'#D1E4D3'}}>
                        <h2 className="font-bold mb-4" style={{color:'#2D2D2D'}}>Vânzări ultima săptămână</h2>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#EEF5EF"/>
                                <XAxis dataKey="data" tick={{fontSize:12, fill:'#888'}}/>
                                <YAxis tick={{fontSize:12, fill:'#888'}}/>
                                <Tooltip
                                    formatter={(value)=>`${value} RON`}
                                    contentStyle={{borderRadius:'8px', border:`0.5px solid #D1E4D3`}}
                                />
                                <Bar dataKey="vanzari" fill={GREEN} radius={[4,4,0,0]}/>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-white rounded-xl border p-4" style={{borderColor:'#D1E4D3'}}>
                        <h2 className="font-bold mb-4" style={{color:'#2D2D2D'}}>Comenzi pe status</h2>
                        <div className="flex flex-col gap-3">
                            {stats.ordersByStatus.map(item=>{
                                const sc=statusColors[item.status]||{bg:'#F3F4F6', color:'#6B7280'};
                                return(
                                    <div key={item.status} className="flex justify-between items-center">
                                        <span className="text-sm px-3 py-1 rounded-full font-medium" style={{background:sc.bg, color:sc.color}}>
                                            {statusLabels[item.status]||item.status}
                                        </span>
                                        <span className="font-bold" style={{color:'#2D2D2D'}}>{item.total}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl border p-4" style={{borderColor:'#D1E4D3'}}>
                        <h2 className="font-bold mb-4" style={{color:'#2D2D2D'}}>Top produse comandate</h2>
                        <div className="flex flex-col gap-2">
                            {stats.topProducts.map((product, index)=>(
                                <div key={index} className="flex justify-between items-center py-2 border-b" style={{borderColor:'#EEF5EF'}}>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center" style={{background:GREEN_LIGHT, color:GREEN_DARK}}>
                                            {index+1}
                                        </span>
                                        <span style={{color:'#2D2D2D'}}>{product.denumire}</span>
                                    </div>
                                    <span className="font-bold text-sm" style={{color:GREEN}}>{product.total_comandat} buc</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border p-4" style={{borderColor:'#D1E4D3'}}>
                        <h2 className="font-bold mb-4" style={{color:'#2D2D2D'}}>
                            Stocuri sub pragul minim
                            {stats.lowStocks.length>0&&(
                                <span className="ml-2 text-xs px-2 py-1 rounded-full" style={{background:'#FEF2F2', color:'#B91C1C'}}>
                                    {stats.lowStocks.length} alerte
                                </span>
                            )}
                        </h2>
                        {stats.lowStocks.length===0?(
                            <p className="text-sm" style={{color:GREEN}}>Toate stocurile sunt OK</p>
                        ):(
                            <div className="flex flex-col gap-2">
                                {stats.lowStocks.map(stock=>(
                                    <div key={stock.id} className="flex justify-between items-center py-2 border-b" style={{borderColor:'#EEF5EF'}}>
                                        <span style={{color:'#2D2D2D'}}>{stock.nume_ingredient}</span>
                                        <span className="font-bold text-sm" style={{color:'#DC2626'}}>
                                            {convertQuantity(Number(stock.cantitate_disponibila), stock.unitate_masura)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;