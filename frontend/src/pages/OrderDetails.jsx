import {useState, useEffect} from 'react';
import axios from 'axios';
import {useNavigate, useParams} from 'react-router-dom';
import Loading from '../components/Loading';

const GREEN='#6B8F71';
const GREEN_LIGHT='#EDF5EE';
const GREEN_DARK='#4A6B50';
const GOLD='#C9A84C';

function OrderDetails(){
    const [order, setOrder]=useState(null);
    const [error, setError]=useState('');
    const {id}=useParams();
    const navigate=useNavigate();
    const token=localStorage.getItem('token');

const fetchOrder=async()=>{
    try{
        const response=await axios.get(`${import.meta.env.VITE_API_URL}/api/comenzi/${id}`,{
            headers:{Authorization:`Bearer ${token}`}
        });
        setOrder(response.data);
    }catch(err){
            if(err.response?.status===401){
                localStorage.removeItem('token');
                navigate('/login');
            }else{
                setError('Eroare la incarcarea comenzii');
            }
        }
    };
    

    useEffect(()=>{
        if(!token){navigate('/login'); return;}
        fetchOrder();
    },[token, id]);

    const getStatusColor=(status)=>{
        switch(status){
            case 'in_asteptare': return {bg:'#FEF9C3', color:'#854D0E'};
            case 'in_lucru': return {bg:'#DBEAFE', color:'#1E40AF'};
            case 'gata': return {bg:GREEN_LIGHT, color:GREEN_DARK};
            case 'predata': return {bg:'#F3F4F6', color:'#6B7280'};
            case 'anulata': return {bg:'#FEF2F2', color:'#B91C1C'};
            default: return {bg:'#F3F4F6', color:'#6B7280'};
        }
    };

    const statusLabels={
        'in_asteptare':'În așteptare',
        'in_lucru':'În lucru',
        'gata':'Gata',
        'predata':'Predată',
        'anulata': 'Anulată'
    };

    if(!order && !error) return <Loading />;
    if(!order) return(
        <div className="min-h-screen p-6 flex items-center justify-center" style={{background:'#F8F9FA'}}>
            <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">{error}</div>
        </div>
    );

    const sc=getStatusColor(order.status);

    return(
        <div className="min-h-screen p-6" style={{background:'#F8F9FA'}}>
            <div className="max-w-4xl mx-auto">
                {/* header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <button
                            onClick={()=>navigate('/comenzi')}
                            className="text-sm mb-2 flex items-center gap-1 hover:underline"
                            style={{color:GREEN}}
                        >
                            ← Înapoi la comenzi
                        </button>
                        <h1 className="text-2xl font-bold" style={{color:'#2D2D2D'}}>
                            Comanda #{order.id}
                        </h1>
                    </div>
                    <span className="px-3 py-1 rounded-full font-medium text-sm" style={{background:sc.bg, color:sc.color}}>
                        {statusLabels[order.status]||order.status}
                    </span>
                </div>

                {error&&<div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

                <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* date client */}
                    <div className="bg-white rounded-xl border p-4" style={{borderColor:'#D1E4D3'}}>
                        <h2 className="font-bold mb-3" style={{color:'#2D2D2D'}}>Date client</h2>
                        <p className="font-medium" style={{color:'#2D2D2D'}}>{order.nume_client||'-'}</p>
                        <p className="text-sm text-gray-500 mt-1">{order.telefon_client||'Fără telefon'}</p>
                        {order.modalitate_livrare==='livrare' && (
                        <p className="text-sm mt-1" style={{color:'#1E40AF'}}>
                            <span className="font-medium">Adresă:</span> {order.adresa_client||'Fără adresă'}
                        </p>
)}
                    </div>

                    {/* date comanda */}
                    <div className="bg-white rounded-xl border p-4" style={{borderColor:'#D1E4D3'}}>
                        <h2 className="font-bold mb-3" style={{color:'#2D2D2D'}}>Date comandă</h2>
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">Data livrare:</span> {new Date(order.data_livrare).toLocaleDateString('ro-RO')} — {new Date(order.data_livrare).toLocaleTimeString('ro-RO', {hour:'2-digit', minute:'2-digit'})}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Modalitate:</span>{' '}
                            <span style={{color: order.modalitate_livrare==='livrare' ? '#1E40AF' : GREEN}}>
                                {order.modalitate_livrare==='livrare' ? 'Livrare la domiciliu' : 'Ridicare personală'}
                            </span>
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Creată la:</span> {new Date(order.creat_la).toLocaleDateString('ro-RO')}
                        </p>
                        
                        {order.observatii&&(
                            <p className="text-sm mt-1" style={{color:GOLD}}>
                                <span className="font-medium">⚠ Observații:</span> {order.observatii}
                            </p>
                        )}
                    </div>
                </div>

                {/* produse */}
                <div className="bg-white rounded-xl border p-4 mb-4" style={{borderColor:'#D1E4D3'}}>
                    <h2 className="font-bold mb-3" style={{color:'#2D2D2D'}}>Produse comandate</h2>
                    <table className="w-full text-left">
                        <thead style={{background:'#F4FAF5', borderBottom:'0.5px solid #D1E4D3'}}>
                            <tr>
                                {['Produs','Cantitate','Preț fără TVA','Preț cu TVA','Subtotal'].map(h=>(
                                    <th key={h} className="px-4 py-2 text-sm font-medium" style={{color:GREEN}}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {order.produse?.map((produs, index)=>(
                                <tr key={index} className="border-b" style={{borderColor:'#EEF5EF'}}>
                                    <td className="px-4 py-2 font-medium" style={{color:'#2D2D2D'}}>{produs.nume_produs}</td>
                                    <td className="px-4 py-2 text-sm text-gray-500">{produs.cantitate} buc</td>
                                    <td className="px-4 py-2 text-sm text-gray-500">{Number(produs.pret_unitar).toFixed(2)} RON</td>
                                    <td className="px-4 py-2 text-sm text-gray-500">{Number(produs.pret_unitar_cu_tva).toFixed(2)} RON</td>
                                    <td className="px-4 py-2 font-medium text-sm" style={{color:GOLD}}>{(produs.cantitate * produs.pret_unitar_cu_tva).toFixed(2)} RON</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex justify-end mt-3 pt-3 border-t" style={{borderColor:'#D1E4D3'}}>
                        <span className="font-bold text-lg" style={{color:'#2D2D2D'}}>
                            Total: <span style={{color:GOLD}}>{order.total ? `${Number(order.total).toFixed(2)} RON` : '-'}</span>
                        </span>
                    </div>
                </div>

                {/* istoric status */}
                <div className="bg-white rounded-xl border p-4" style={{borderColor:'#D1E4D3'}}>
                    <h2 className="font-bold mb-3" style={{color:'#2D2D2D'}}>Istoric status</h2>
                    {order.istoric?.length===0?(
                        <p className="text-gray-400 text-sm">Nu există istoric</p>
                    ):(
                        <div className="flex flex-col gap-3">
                            {order.istoric?.map((item, index)=>{
                                const isc=getStatusColor(item.status_nou);
                                return(
                                    <div key={index} className="flex items-center gap-3 text-sm">
                                        <span className="text-gray-400 w-36 flex-shrink-0">
                                            {new Date(item.modificat_la).toLocaleDateString('ro-RO')} {new Date(item.modificat_la).toLocaleTimeString('ro-RO', {hour:'2-digit', minute:'2-digit'})}
                                        </span>
                                        <span className="text-gray-500 flex-shrink-0">{item.prenume} {item.nume}</span>
                                        <span className="text-gray-300">→</span>
                                        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{background:isc.bg, color:isc.color}}>
                                            {statusLabels[item.status_nou]||item.status_nou}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                {/* butoane admin */}
                {JSON.parse(localStorage.getItem('user'))?.role==='admin' && (
                    <div className="mt-4 flex justify-end gap-3">
                        {order.status==='gata' && (
                            <button
                                onClick={async()=>{
                                    await axios.put(`${import.meta.env.VITE_API_URL}/api/comenzi/${id}/status`,
                                        {status:'predata'},{headers:{Authorization:`Bearer ${token}`}}
                                    );
                                    fetchOrder();
                                }}
                                className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition"
                                style={{background:GREEN}}
                            >
                                ✓ Marchează ca predată
                            </button>
                        )}
                        {['in_asteptare', 'in_lucru'].includes(order.status) && (
                                    <button
                                        onClick={async()=>{
                                            if(!window.confirm('Ești sigur că vrei să anulezi această comandă?')) return;
                                            await axios.put(`${import.meta.env.VITE_API_URL}/api/comenzi/${id}/status`,
                                                {status:'anulata'},{headers:{Authorization:`Bearer ${token}`}}
                                            );
                                            fetchOrder();
                                        }}
                                        className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
                                        style={{background:'#FEF2F2', color:'#B91C1C'}}
                                    >
                                        ✕ Anulează comanda
                                    </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default OrderDetails;