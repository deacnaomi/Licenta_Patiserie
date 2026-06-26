import {useState, useEffect} from 'react';
import axios from 'axios';
import {useNavigate} from 'react-router-dom';

const GREEN='#6B8F71';
const GREEN_LIGHT='#EDF5EE';
const GREEN_DARK='#4A6B50';
const GOLD='#C9A84C';

function Clients(){
    const[clients, setClients]=useState([]);
    const[error, setError]=useState('');
    const[showModal, setShowModal]=useState(false);
    const[showHistoryModal, setShowHistoryModal]=useState(false);
    const[editClient, setEditClient]=useState(null);
    const[selectedClient, setSelectedClient]=useState(null);
    const[clientOrders, setClientOrders]=useState([]);
    const[formData, setFormData]=useState({name:'', phone:'', address:'', notes:''});

    const navigate=useNavigate();
    const token=localStorage.getItem('token');

    const fetchClients=async()=>{
        try{
            const response=await axios.get(`${import.meta.env.VITE_API_URL}/api/clienti`,{
                headers:{Authorization:`Bearer ${token}`}
            });
            setClients(response.data);
        }catch(err){
            if(err.response?.status===401){
                localStorage.removeItem('token');
                navigate('/login');
            }else{
                setError('Eroare la incarcarea clientilor');
            }
        }
    };

    const fetchClientOrders=async(clientId)=>{
        try{
            const response=await axios.get(`${import.meta.env.VITE_API_URL}/api/clienti/${clientId}/comenzi`,{
                headers:{Authorization:`Bearer ${token}`}
            });
            setClientOrders(response.data);
        }catch(err){
            console.error(err);
        }
    };

    useEffect(()=>{
        if(!token){navigate('/login'); return;}
        fetchClients();
    },[token, navigate]);

    const handleSubmit=async(e)=>{
        e.preventDefault();
        setError('');
        try{
            if(editClient){
                await axios.put(`${import.meta.env.VITE_API_URL}/api/clienti/${editClient.id}`, formData,{
                    headers:{Authorization:`Bearer ${token}`}
                });
            }else{
                await axios.post(`${import.meta.env.VITE_API_URL}/api/clienti`, formData,{
                    headers:{Authorization:`Bearer ${token}`}
                });
            }
            setShowModal(false);
            setEditClient(null);
            setFormData({name:'', phone:'', address:'', notes:''});
            fetchClients();
        }catch(err){
            setError('Eroare la salvarea clientului');
        }
    };

    const handleEdit=(client)=>{
        setError('');
        setEditClient(client);
        setFormData({
            name:client.nume,
            phone:client.telefon||'',
            address:client.adresa||'',
            notes:client.observatii||''
        });
        setShowModal(true);
    };

    const handleDelete=async(id)=>{
        if(!window.confirm('Ești sigur că vrei să ștergi acest client? Se vor șterge și toate comenzile asociate lui!')) return;
        setError('');
        try{
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/clienti/${id}`,{
                headers:{Authorization:`Bearer ${token}`}
            });
            fetchClients();
        }catch(err){
            setError('Eroare la stergerea clientului');
        }
    };

    const handleAdd=()=>{
        setError('');
        setEditClient(null);
        setFormData({name:'', phone:'', address:'', notes:''});
        setShowModal(true);
    };

    const handleShowHistory=async(client)=>{
        setSelectedClient(client);
        await fetchClientOrders(client.id);
        setShowHistoryModal(true);
    };

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

    const getStatusLabel=(status)=>{
        switch(status){
            case 'in_asteptare': return 'În așteptare';
            case 'in_lucru': return 'În lucru';
            case 'gata': return 'Gata';
            case 'predata': return 'Predată';
            case 'anulata': return 'Anulată';
            default: return status;
        }
    };

    return(
        <div className="min-h-screen p-6" style={{background:'#F8F9FA'}}>
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold" style={{color:'#2D2D2D'}}>Clienți</h1>
                    <button
                        onClick={handleAdd}
                        className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition"
                        style={{background:GREEN}}
                    >
                        + Adaugă client
                    </button>
                </div>

                {error&&<div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

                <div className="flex flex-col gap-2">
                    {clients.length===0?(
                        <div className="bg-white rounded-xl border p-6 text-center text-gray-400" style={{borderColor:'#D1E4D3'}}>
                            Nu există clienți
                        </div>
                    ):(
                        clients.map(client=>{
                            const initials=client.nume.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
                            return(
                                <div key={client.id} onClick={()=>handleShowHistory(client)} className="bg-white rounded-xl border flex items-center gap-3 px-4 py-3 hover:border-green-400 transition cursor-pointer" style={{borderColor:'#D1E4D3'}}>
                                    <div className="rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium" style={{width:'36px', height:'36px', background:GREEN_LIGHT, color:GREEN_DARK}}>
                                        {initials}
                                    </div>
                                    <div style={{flex:1}}>
                                        <p className="font-medium text-sm" style={{color:GREEN}}>
                                            {client.nume}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {client.telefon||'Fără telefon'}{client.adresa ? ` · ${client.adresa}` : ''}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button onClick={(e)=>{e.stopPropagation(); handleShowHistory(client);}}
                                            className="px-3 py-1.5 rounded-lg text-xs font-medium"
                                            style={{background:'#FEF9EB', color:'#8B6914'}}>
                                            Comenzi
                                        </button>
                                        <button onClick={(e)=>{e.stopPropagation(); handleEdit(client);}}
                                            className="px-3 py-1.5 rounded-lg text-xs font-medium"
                                            style={{background:GREEN_LIGHT, color:GREEN_DARK}}>
                                            Editează
                                        </button>
                                        <button onClick={(e)=>{e.stopPropagation(); handleDelete(client.id);}}
                                            className="px-3 py-1.5 rounded-lg text-xs font-medium"
                                            style={{background:'#FEF2F2', color:'#B91C1C'}}>
                                            Șterge
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {showModal&&(
                <div className="fixed inset-0 flex items-center justify-center z-50" style={{background:'rgba(0,0,0,0.4)'}}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md" style={{border:'0.5px solid #D1E4D3'}}>
                        <h2 className="text-xl font-bold mb-4" style={{color:'#2D2D2D'}}>
                            {editClient?'Editează client':'Adaugă client nou'}
                        </h2>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-600 mb-1">Nume</label>
                                <input type="text" value={formData.name}
                                    onChange={(e)=>setFormData({...formData, name:e.target.value})}
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                    style={{borderColor:'#D1E4D3'}} required/>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-600 mb-1">Telefon</label>
                                <input type="text" value={formData.phone}
                                    onChange={(e)=>setFormData({...formData, phone:e.target.value})}
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                    style={{borderColor:'#D1E4D3'}}/>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-600 mb-1">Adresă</label>
                                <input type="text" value={formData.address}
                                    onChange={(e)=>setFormData({...formData, address:e.target.value})}
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                    style={{borderColor:'#D1E4D3'}}/>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-600 mb-1">Observații</label>
                                <textarea value={formData.notes}
                                    onChange={(e)=>setFormData({...formData, notes:e.target.value})}
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                    style={{borderColor:'#D1E4D3'}} rows="3"/>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button type="button"
                                    onClick={()=>{setShowModal(false); setEditClient(null); setFormData({name:'', phone:'', address:'', notes:''}); }}
                                    className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition"
                                    style={{borderColor:'#D1E4D3', color:'#555'}}>
                                    Anulează
                                </button>
                                <button type="submit"
                                    className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition"
                                    style={{background:GREEN}}>
                                    Salvează
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showHistoryModal&&selectedClient&&(
                <div className="fixed inset-0 flex items-center justify-center z-50" style={{background:'rgba(0,0,0,0.4)'}}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-screen overflow-y-auto" style={{border:'0.5px solid #D1E4D3'}}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-bold" style={{color:'#2D2D2D'}}>{selectedClient.nume}</h2>
                                <p className="text-sm text-gray-400 mt-0.5">{selectedClient.telefon||'Fără telefon'}</p>
                            </div>
                            <button onClick={()=>{setShowHistoryModal(false); setSelectedClient(null); setClientOrders([]);}}
                                className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                        </div>

                        {clientOrders.length===0?(
                            <p className="text-gray-400 text-sm text-center py-6">Nu există comenzi pentru acest client</p>
                        ):(
                            <div className="flex flex-col gap-2">
                                {clientOrders.map(order=>{
                                    const sc=getStatusColor(order.status);
                                    return(
                                        <div key={order.id} className="border rounded-xl p-3 hover:border-green-400 transition cursor-pointer"
                                            style={{borderColor:'#D1E4D3'}}
                                            onClick={()=>{setShowHistoryModal(false); navigate(`/comenzi/${order.id}`);}}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-sm font-medium" style={{color:'#2D2D2D'}}>
                                                        {new Date(order.data_livrare).toLocaleDateString('ro-RO')} — {new Date(order.data_livrare).toLocaleTimeString('ro-RO', {hour:'2-digit', minute:'2-digit'})}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {order.numar_produse} produs{order.numar_produse>1?'e':''} · {order.total_bucati} bucăți
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs px-2 py-1 rounded-full font-medium" style={{background:sc.bg, color:sc.color}}>
                                                        {getStatusLabel(order.status)}
                                                    </span>
                                                    <span className="text-sm font-medium" style={{color:GOLD}}>
                                                        {order.total?`${Number(order.total).toFixed(2)} RON`:'-'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Clients;