
    import axios from 'axios';
    import {useNavigate} from 'react-router-dom';
    import {io} from 'socket.io-client';
    import DatePicker from 'react-datepicker';
    import 'react-datepicker/dist/react-datepicker.css';
    import {ro} from 'date-fns/locale';
    import {useState, useEffect, useRef} from 'react';

    const GREEN='#6B8F71';
    const GREEN_LIGHT='#EDF5EE';
    const GREEN_DARK='#4A6B50';
    const GOLD='#C9A84C';

    function Orders(){
        const [orders, setOrders]=useState([]);
        const [products, setProducts]=useState([]);
        const [error, setError]=useState('');
        const [showModal, setShowModal]=useState(false);
        const [clientSearch, setClientSearch]=useState('');
        const [clientSuggestions, setClientSuggestions]=useState([]);
        const [selectedClient, setSelectedClient]=useState(null);
        const [newClientData, setNewClientData]=useState({phone:'', address:''});
        const [filterDate, setFilterDate]=useState(null);
        const [filterLivrare, setFilterLivrare]=useState('toate');
        const [searchOrders, setSearchOrders]=useState('');
        const [sortOrder, setSortOrder]=useState('desc');
        const [productSuggestions, setProductSuggestions]=useState([]);
        const [productSuggestionIndex, setProductSuggestionIndex]=useState(-1);
        const [brutarFilter, setBrutarFilter]=useState('azi');
        const [editOrder, setEditOrder]=useState(null);
        const [statusError, setStatusError]=useState('');
        const [clientSuggestionIndex, setClientSuggestionIndex]=useState(-1);
        const [requiredIngredients, setRequiredIngredients]=useState([]);
        const [notificare, setNotificare]=useState('');
        const [expandedProducts, setExpandedProducts]=useState({});
        const [recipeData, setRecipeData]=useState({});
        const [comenziNoi, setComenziNoi]=useState(new Set());
        const [stocks, setStocks]=useState([]);
        const [formData, setFormData]=useState({
            client_id:'',
            data_livrare:'',
            ora_livrare:'',
            observatii:'',
            modalitate_livrare:'',
            produse:[]
        });

        const navigate=useNavigate();
        const token=localStorage.getItem('token');
        const user=JSON.parse(localStorage.getItem('user'));
        const userRef=useRef(user);

        const fetchOrders=async()=>{
            try{
                const url=user?.role==='brutar'
                    ?`${import.meta.env.VITE_API_URL}/api/comenzi/cu-produse`
                    :`${import.meta.env.VITE_API_URL}/api/comenzi`;
                const response=await axios.get(url,{headers:{Authorization:`Bearer ${token}`}});
                setOrders(response.data);
            }catch(err){
                if(err.response?.status===401){
                    localStorage.removeItem('token');
                    navigate('/login');
                }else{
                    setError('Eroare la incarcarea comenzilor');
                }
            }
        };

        const fetchProducts=async()=>{
            try{
                const response=await axios.get(`${import.meta.env.VITE_API_URL}/api/produse`,{headers:{Authorization:`Bearer ${token}`}});
                setProducts(response.data);
            }catch(err){console.error(err);}
        };

        const fetchRequiredIngredients=async()=>{
            try{
                const today=new Date().toISOString().split('T')[0];
                const tomorrow=new Date(Date.now()+86400000).toISOString().split('T')[0];
                
                const data=brutarFilter==='azi'?today
                    :brutarFilter==='maine'?tomorrow
                    :null;
                
                const url=data
                    ?`${import.meta.env.VITE_API_URL}/api/comenzi/ingrediente-necesare?data=${data}`
                    :`${import.meta.env.VITE_API_URL}/api/comenzi/ingrediente-necesare`;
                    
                const response=await axios.get(url,{headers:{Authorization:`Bearer ${token}`}});
                setRequiredIngredients(response.data);
            }catch(err){console.error(err);}
        };
        useEffect(()=>{
            if(user?.role==='brutar'){
                fetchRequiredIngredients();
            }
        },[brutarFilter]);

        const fetchStocks=async()=>{
        try{
            const response=await axios.get(`${import.meta.env.VITE_API_URL}/api/stocuri`,{headers:{Authorization:`Bearer ${token}`}});
            setStocks(response.data);
        }catch(err){console.error(err);}
        };
        const fetchRecipeForProduct=async(productId, productName, totalCantitate)=>{
            if(recipeData[productId]){
                setExpandedProducts(prev=>({...prev, [productId]:!prev[productId]}));
                return;
            }
            try{
                const product=products.find(p=>p.denumire===productName);
                if(!product) return;
                const response=await axios.get(`${import.meta.env.VITE_API_URL}/api/retete/${product.id}`,{
                    headers:{Authorization:`Bearer ${token}`}
                });
                setRecipeData(prev=>({...prev, [productId]:response.data}));
                setExpandedProducts(prev=>({...prev, [productId]:true}));
            }catch(err){console.error(err);}
        };

        const searchClients=async(query)=>{
            if(!query){setClientSuggestions([]); return;}
            try{
                const response=await axios.get(`${import.meta.env.VITE_API_URL}/api/clienti/search?query=${query}`,{headers:{Authorization:`Bearer ${token}`}});
                setClientSuggestions(response.data);
            }catch(err){console.error(err);}
        };

        useEffect(()=>{
            if(!token){navigate('/login'); return;}
            fetchOrders();
            fetchProducts();
            fetchRequiredIngredients();
            fetchStocks()
        },[token, navigate]);

        useEffect(()=>{
            const socket=io(import.meta.env.VITE_API_URL);
            socket.on('comanda_noua', (data)=>{
                fetchOrders();
                fetchRequiredIngredients();
                if(userRef.current?.role==='brutar'){
                    setNotificare('Comandă nouă adăugată!');
                    setTimeout(()=>setNotificare(''), 5000);
                    setComenziNoi(prev=>{
                        const next=new Set(prev);
                        next.add(data.orderId);
                        setTimeout(()=>{
                            setComenziNoi(p=>{
                                const n=new Set(p);
                                n.delete(data.orderId);
                                return n;
                            });
                        }, 30000);
                        return next;
                    });
                }
            });
            socket.on('status_actualizat', ()=>{fetchOrders(); fetchRequiredIngredients();});
            socket.on('comanda_actualizata', ()=>{fetchOrders(); fetchRequiredIngredients();});
            return()=>socket.disconnect();
        },[]);
        const filterOrdersForBrutar=(orders)=>{
            const today=new Date();
            const tomorrow=new Date();
            tomorrow.setDate(tomorrow.getDate()+1);
            return orders.filter(order=>{
                const orderDate=new Date(order.data_livrare);
                if(brutarFilter==='azi') return orderDate.toLocaleDateString('ro-RO')===today.toLocaleDateString('ro-RO');
                if(brutarFilter==='maine') return orderDate.toLocaleDateString('ro-RO')===tomorrow.toLocaleDateString('ro-RO');
                return true;
            });
        };
        const convertQuantity=(cantitate, unitate)=>{
            if(unitate==='g' && cantitate>=1000) return `${(cantitate/1000).toFixed(2)} kg`;
            if(unitate==='ml' && cantitate>=1000) return `${(cantitate/1000).toFixed(2)} l`;
            return `${Number(cantitate.toFixed(2))} ${unitate}`;
        };

        const handleAddProduct=()=>{
            setFormData({...formData, produse:[...formData.produse, {produs_id:'', cantitate:1}]});
        };

        const handleProductChange=(index, field, value)=>{
            const updatedProducts=[...formData.produse];
            updatedProducts[index][field]=value;

            const currentRow=updatedProducts[index];
            const isLastRow=index===updatedProducts.length-1;
            const rowComplete=currentRow.produs_id && currentRow.cantitate && Number(currentRow.cantitate)>0;

            if(isLastRow && rowComplete){
                setFormData({...formData, produse:[...updatedProducts, {produs_id:'', cantitate:''}]});
            }else{
                setFormData({...formData, produse:updatedProducts});
            }
        };

        const handleRemoveProduct=(index)=>{
            const updatedProducts=formData.produse.filter((_,i)=>i!==index);
            setFormData({...formData, produse:updatedProducts});
        };

        const handleSubmit=async(e)=>{
            e.preventDefault();
            setError('');
            try{
                let clientId=formData.client_id;
                if(!clientId && clientSearch){
                    const response=await axios.post(`${import.meta.env.VITE_API_URL}/api/clienti`,
                        {name:clientSearch, phone:newClientData.phone||null, address:newClientData.address||null},
                        {headers:{Authorization:`Bearer ${token}`}}
                    );
                    clientId=response.data.id;
                }
                if(!clientId){setError('Te rugam sa introduci numele clientului'); return;}

        const produseMap={};
            formData.produse
                .filter(p=>p.produs_id && p.cantitate)
                .forEach(p=>{
                    produseMap[p.produs_id]=p;
                });
            const produseValide=Object.values(produseMap);

            if(produseValide.length===0){
                setError('Adaugă cel puțin un produs');
                return;
                }

                const dataLivrare=formData.data_livrare && formData.ora_livrare
                    ? `${formData.data_livrare} ${formData.ora_livrare}:00` : null;
                if(editOrder){
                    await axios.put(`${import.meta.env.VITE_API_URL}/api/comenzi/${editOrder.id}`,
                        {...formData, client_id:clientId, data_livrare:dataLivrare, produse:produseValide},
                        {headers:{Authorization:`Bearer ${token}`}}
                    );
                }else{
                    await axios.post(`${import.meta.env.VITE_API_URL}/api/comenzi`,
                        {...formData, client_id:clientId, data_livrare:dataLivrare, produse:produseValide},
                        {headers:{Authorization:`Bearer ${token}`}}
                    );
                }
                setShowModal(false);
                setEditOrder(null);
                setFormData({client_id:'', data_livrare:'', ora_livrare:'', observatii:'', modalitate_livrare:'', produse:[]});
                setClientSearch('');
                setSelectedClient(null);
                setClientSuggestions([]);
                setNewClientData({phone:'', address:''});
                fetchOrders();
            }catch(err){
                setError('Eroare la salvarea comenzii');
            }
        };
        const handleStatusChange=async(orderId, newStatus)=>{
            setError('');
            try{
                await axios.put(`${import.meta.env.VITE_API_URL}/api/comenzi/${orderId}/status`,
                    {status:newStatus},{headers:{Authorization:`Bearer ${token}`}}
                );
                fetchOrders();
                fetchRequiredIngredients();
            }catch(err){
                const msg=err.response?.data?.message || 'Eroare la actualizarea statusului';
                setStatusError(msg);
                setTimeout(()=>setStatusError(''), 5000);
            }
        };

        const handleDelete=async(id)=>{
            if(!window.confirm('Esti sigur ca vrei sa stergi aceasta comanda?')) return;
            setError('');
            try{
                await axios.delete(`${import.meta.env.VITE_API_URL}/api/comenzi/${id}`,{headers:{Authorization:`Bearer ${token}`}});
                fetchOrders();
            }catch(err){setError('Eroare la stergerea comenzii');}
        };

        const handleEditOrder=async(order)=>{
            setError('');
            try{
                const response=await axios.get(`${import.meta.env.VITE_API_URL}/api/comenzi/${order.id}`,{headers:{Authorization:`Bearer ${token}`}});
                const orderData=response.data;
                setEditOrder(order);
                setClientSearch(order.nume_client||'');
                setSelectedClient({id:order.client_id, nume:order.nume_client});
                setFormData({
                    client_id:order.client_id,
                    data_livrare:new Date(order.data_livrare).toISOString().split('T')[0],
                    ora_livrare:new Date(order.data_livrare).toTimeString().slice(0,5),
                    observatii:order.observatii||'',
                    modalitate_livrare:order.modalitate_livrare||'',
                    produse:orderData.produse.map(p=>({produs_id:p.produs_id, cantitate:p.cantitate,nume_cautare:p.nume_produs}))
                });
                setShowModal(true);
            }catch(err){setError('Eroare la incarcarea comenzii');}
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

        if(user?.role==='brutar'){
            const filteredOrders=filterOrdersForBrutar(orders);
            return(
                <div className="min-h-screen p-6" style={{background:'#F8F9FA'}}>
                    <div className="max-w-4xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold" style={{color:'#2D2D2D'}}>Comenzi active</h1>
                            <div className="flex gap-2">
                                {['azi','maine','toate'].map(f=>(
                                    <button key={f} onClick={()=>setBrutarFilter(f)}
                                        className="px-4 py-2 rounded-lg font-medium text-sm transition"
                                        style={brutarFilter===f
                                            ?{background:GREEN, color:'#fff'}
                                            :{background:'#fff', color:'#555', border:'0.5px solid #D1E4D3'}
                                        }>
                                        {f==='azi'?'Azi':f==='maine'?'Mâine':'Toate'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error&&<div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}
                        {statusError&&(
                            <div className="fixed bottom-4 left-0 right-0 mx-auto max-w-md bg-red-50 text-red-700 p-3 rounded-lg text-sm font-medium text-center shadow-lg"
                                style={{border:'1px solid #FECACA'}}>
                                ⚠ {statusError}
                            </div>
                        )}
                        {notificare&&(
                            <div className="p-3 rounded-lg mb-4 text-sm font-medium text-center"
                                style={{background:'#FEF3C7', color:'#92400E', border:'1px solid #F59E0B'}}>
                                🔔 {notificare}
                            </div>
                        )}
                        {filteredOrders.length>0&&(
                            <div className="bg-white rounded-xl border mb-4 p-4" style={{borderColor:'#D1E4D3'}}>
                                <h2 className="font-bold mb-3 text-sm uppercase tracking-wide" style={{color:GREEN}}>Total de produs</h2>
                                <div className="flex flex-col gap-2">
                                    {Object.entries(
                                        filteredOrders.filter(o=>o.status!=='anulata').reduce((acc, order)=>{
                                            order.produse?.forEach(p=>{
                                                if(!acc[p.produs_id]){
                                                    acc[p.produs_id]={nume:p.nume_produs, cantitate:0, produs_id:p.produs_id};
                                                }
                                                acc[p.produs_id].cantitate+=p.cantitate;
                                            });
                                            return acc;
                                        }, {})
                                    ).map(([produs_id, data])=>(
                                        <div key={produs_id}>
                                            <div className="flex justify-between items-center rounded-lg px-3 py-2 cursor-pointer"
                                                style={{background:GREEN_LIGHT}}
                                                onClick={()=>fetchRecipeForProduct(produs_id, data.nume, data.cantitate)}>
                                                <span className="text-sm font-medium" style={{color:'#2D2D2D'}}>{data.nume}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold" style={{color:GREEN}}>{data.cantitate} buc</span>
                                                    <span className="text-xs" style={{color:GREEN_DARK}}>
                                                        {expandedProducts[produs_id] ? '▲' : '▼'}
                                                    </span>
                                                </div>
                                            </div>
                                            {expandedProducts[produs_id] && recipeData[produs_id] && (
                                                <div className="mt-1 mb-2 px-3 py-2 rounded-lg" style={{background:'#F4FAF5'}}>
                                                    {recipeData[produs_id].map((ing, i)=>(
                                                        <div key={i} className="flex justify-between text-xs py-0.5">
                                                            <span style={{color:'#555'}}>{ing.nume_ingredient}</span>
                                                            <span style={{color:GREEN_DARK}}>
                                                                {convertQuantity(Number(ing.cantitate_pe_produs)*data.cantitate, ing.unitate_masura)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {requiredIngredients.length>0&&(
                            <div className="bg-white rounded-xl border mb-4 p-4" style={{borderColor:'#EDD9A3'}}>
                                <h2 className="font-bold mb-3 text-sm uppercase tracking-wide" style={{color:GOLD}}>Ingrediente necesare</h2>
                                <div className="flex flex-col gap-2">
                                    {requiredIngredients.map((ingredient, index)=>{
                                        const stoc = stocks.find(s => s.ingredient_id === ingredient.ingredient_id);
                                        const insuficient = !stoc || stoc.cantitate_disponibila < ingredient.cantitate;
                                        return(
                                            <div key={index} className="flex justify-between items-center rounded-lg px-3 py-2"
                                                style={{background: insuficient ? '#FEF2F2' : '#FEF9EB'}}>
                                                <span className="text-sm font-medium" style={{color:'#2D2D2D'}}>{ingredient.nume}</span>
                                                <div className="flex gap-2 items-center">
                                                    <span className="font-bold" style={{color: insuficient ? '#B91C1C' : GOLD}}>
                                                        {convertQuantity(ingredient.cantitate, ingredient.unitate)}
                                                    </span>
                                                    {insuficient && <span className="text-xs font-medium" style={{color:'#B91C1C'}}>⚠ insuficient</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        

                        {filteredOrders.length===0?(
                            <div className="bg-white rounded-xl border p-6 text-center text-gray-400" style={{borderColor:'#D1E4D3'}}>
                                Nu există comenzi pentru această perioadă
                            </div>
                        ):(
                            <div className="flex flex-col gap-3">
                                {filteredOrders.map(order=>{
                                    const sc=getStatusColor(order.status);
                                    return(
                                        <div key={order.id} className="bg-white rounded-xl border p-4" 
                                            style={{
                                                borderColor: order.status==='anulata' ? '#FECACA' : comenziNoi.has(order.id) ? '#F59E0B' : '#D1E4D3',
                                                boxShadow: comenziNoi.has(order.id) ? '0 0 0 2px #FEF3C7' : 'none',
                                                background: order.status==='anulata' ? '#FEF2F2' : '#fff'
                                            }}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h2 className="font-bold" style={{color:'#2D2D2D'}}>{order.nume_client||'-'}</h2>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {new Date(order.data_livrare).toLocaleDateString('ro-RO')} — {new Date(order.data_livrare).toLocaleTimeString('ro-RO', {hour:'2-digit', minute:'2-digit'})}
                                                        {order.observatii&&<span style={{color:GOLD}}> · ⚠ {order.observatii}</span>}
                                                    </p>
                                                </div>
                                                {order.status==='anulata' ? (
                                                    <span className="text-xs px-3 py-1.5 rounded-lg font-medium"
                                                        style={{background:'#FEF2F2', color:'#B91C1C'}}>
                                                        Anulată
                                                    </span>
                                                ) : (
                                                    <select
                                                        value={order.status}
                                                        onChange={(e)=>handleStatusChange(order.id, e.target.value)}
                                                        className="text-xs px-3 py-1.5 rounded-lg font-medium border-0 cursor-pointer"
                                                        style={{background:sc.bg, color:sc.color}}
                                                    >
                                                        <option value="in_asteptare">În așteptare</option>
                                                        <option value="in_lucru">În lucru</option>
                                                        <option value="gata">Gata</option>
                                                    </select>
                                                )}
                                            </div>
                                            
                                            <div className="border-t pt-3" style={{borderColor:'#EEF5EF'}}>
                                                <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{color:GREEN}}>Produse</p>
                                                {order.produse&&order.produse.length>0?(
                                                    <div className="flex flex-col gap-1">
                                                        {order.produse.map((produs, index)=>(
                                                            <div key={index} className="flex justify-between items-center rounded-lg px-3 py-1.5" style={{background:'#F8F9FA'}}>
                                                                <span className="text-sm" style={{color:'#2D2D2D'}}>{produs.nume_produs}</span>
                                                                <span className="font-bold text-sm" style={{color:GREEN}}>{produs.cantitate} buc</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ):(
                                                    <p className="text-sm text-gray-400">Niciun produs</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return(
            <div className="min-h-screen p-6" style={{background:'#F8F9FA'}}>
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold" style={{color:'#2D2D2D'}}>Comenzi</h1>
                        <div className="flex gap-3 items-center">
                            <DatePicker
                                selected={filterDate}
                                onChange={(date)=>setFilterDate(date)}
                                dateFormat="dd/MM/yyyy" locale={ro}
                                placeholderText="Filtrează după dată"
                                className="border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                isClearable
                            />
                            {filterDate&&(
                                <button onClick={()=>setFilterDate(null)} className="text-sm" style={{color:GREEN}}>
                                    ✕ Toate
                                </button>
                            )}
                            <input
                                type="text"
                                value={searchOrders}
                                onChange={(e)=>setSearchOrders(e.target.value)}
                                placeholder="Caută client..."
                                className="border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                style={{borderColor:'#D1E4D3', width:'160px'}}
                            />
                            <select
                                value={sortOrder}
                                onChange={(e)=>setSortOrder(e.target.value)}
                                className="border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                style={{borderColor:'#D1E4D3'}}
                            >
                                <option value="desc">Ultimele adăugate</option>
                                <option value="asc">Primele adăugate</option>
                                <option value="total_desc">Total ↓</option>
                                <option value="total_asc">Total ↑</option>
                            </select>
                            <div className="flex gap-1">
                                {['toate','livrare','ridicare'].map(f=>(
                                    <button key={f} onClick={()=>setFilterLivrare(f)}
                                        className="px-3 py-2 rounded-lg text-sm font-medium transition"
                                        style={filterLivrare===f
                                            ?{background:GREEN, color:'#fff'}
                                            :{background:'#fff', color:'#555', border:'0.5px solid #D1E4D3'}
                                        }>
                                        {f==='toate'?'Toate':f==='livrare'?'Livrare':'Ridicare'}
                                    </button>
                                ))}
                            </div>
                            
                            <button
                                onClick={()=>{setError(''); setFormData({client_id:'', data_livrare:'', ora_livrare:'', observatii:'', modalitate_livrare:'ridicare', produse:[{produs_id:'', cantitate:1}]});
                                setShowModal(true);}}
                                className="px-4 py-2 rounded-lg text-white font-medium text-sm hover:opacity-90 transition"
                                style={{background:GREEN}}
                            >
                                + Comandă nouă
                            </button>
                        </div>
                    </div>

                    {error&&<div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

                    <div className="flex flex-col gap-2">
                        {orders.length===0?(
                            <div className="bg-white rounded-xl border p-6 text-center text-gray-400" style={{borderColor:'#D1E4D3'}}>
                                Nu există comenzi
                            </div>
                        ):(
                            orders
                                .filter(order=>{
                                    if(!filterDate) return true;
                                    return new Date(order.data_livrare).toLocaleDateString('ro-RO')===filterDate.toLocaleDateString('ro-RO');
                                })
                                .filter(order=>{
                                    if(filterLivrare==='toate') return true;
                                    return order.modalitate_livrare===filterLivrare;
                                })
                                .filter(order=>{
                                    if(!searchOrders) return true;
                                    return order.nume_client?.toLowerCase().includes(searchOrders.toLowerCase());
                                })
                                .sort((a, b)=>{
                                    if(sortOrder==='desc') return new Date(b.creat_la)-new Date(a.creat_la);
                                    if(sortOrder==='asc') return new Date(a.creat_la)-new Date(b.creat_la);
                                    if(sortOrder==='total_desc') return Number(b.total||0)-Number(a.total||0);
                                    if(sortOrder==='total_asc') return Number(a.total||0)-Number(b.total||0);
                                    return 0;
                                })
                                .map(order=>{
                                    const sc=getStatusColor(order.status);
                                    return(
                                        <div key={order.id} onClick={()=>navigate(`/comenzi/${order.id}`)} className="bg-white rounded-xl border flex items-center gap-3 px-4 py-3 hover:border-green-400 transition cursor-pointer" style={{borderColor:'#D1E4D3'}}>
                                            <div style={{flex:1}}>
                                                <p className="font-medium text-sm" style={{color:GREEN}}>{order.nume_client||'-'}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {new Date(order.data_livrare).toLocaleDateString('ro-RO')} — {new Date(order.data_livrare).toLocaleTimeString('ro-RO', {hour:'2-digit', minute:'2-digit'})}
                                                    {order.observatii&&<span style={{color:GOLD}}> · ⚠ {order.observatii}</span>}
                                                </p>
                                            </div>
                                            <span className="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0" style={{background:sc.bg, color:sc.color}}>
                                                {getStatusLabel(order.status)}
                                            </span>
                                            <span className="font-medium text-sm flex-shrink-0" style={{color:GOLD, minWidth:'90px', textAlign:'right'}}>
                                                {order.total?`${Number(order.total).toFixed(2)} RON`:'-'}
                                            </span>
                                            <div className="flex gap-2 flex-shrink-0">
                                                {order.status==='in_asteptare' && (
                                                    <button onClick={(e)=>{e.stopPropagation(); handleEditOrder(order);}}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                                                        style={{background:GREEN_LIGHT, color:GREEN_DARK}}>
                                                        Editează
                                                    </button>
                                                )}
                                                <button onClick={(e)=>{e.stopPropagation(); handleDelete(order.id);}}
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
                        <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-screen overflow-y-auto" style={{border:'0.5px solid #D1E4D3'}}>
                            <h2 className="text-xl font-bold mb-4" style={{color:'#2D2D2D'}}>
                                {editOrder?'Editează comandă':'Comandă nouă'}
                            </h2>

                            <form onSubmit={handleSubmit}>
                                <div className="mb-4 relative">
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Client</label>
                                    <input type="text" value={clientSearch}
                                        onChange={(e)=>{
                                            setClientSearch(e.target.value);
                                            setSelectedClient(null);
                                            setFormData({...formData, client_id:''});
                                            setNewClientData({phone:'', address:''});
                                            searchClients(e.target.value);
                                            setClientSuggestionIndex(-1);
                                        }}
                                        onKeyDown={(e)=>{
                                            if(e.key==='ArrowDown'){
                                                e.preventDefault();
                                                setClientSuggestionIndex(prev=>Math.min(prev+1, clientSuggestions.length-1));
                                            }
                                            if(e.key==='ArrowUp'){
                                                e.preventDefault();
                                                setClientSuggestionIndex(prev=>Math.max(prev-1, -1));
                                            }
                                            if(e.key==='Enter' && clientSuggestionIndex>=0){
                                                e.preventDefault();
                                                const client=clientSuggestions[clientSuggestionIndex];
                                                setSelectedClient(client);
                                                setClientSearch(client.nume);
                                                setFormData({...formData, client_id:client.id});
                                                setClientSuggestions([]);
                                                setClientSuggestionIndex(-1);
                                            }
                                        }}
        className="w-full border rounded-lg px-3 py-2 focus:outline-none text-sm"
        style={{borderColor:'#D1E4D3'}}
        placeholder="Scrie numele clientului..." required/>
                                    {clientSuggestions.length>0&&(
                                        <div className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1" style={{borderColor:'#D1E4D3'}}>
                                            {clientSuggestions.map((client, i)=>(
                                                <div
                                                    key={client.id}
                                                    onClick={()=>{
                                                        setSelectedClient(client);
                                                        setClientSearch(client.nume);
                                                        setFormData({...formData, client_id:client.id});
                                                        setClientSuggestions([]);
                                                        setClientSuggestionIndex(-1);
                                                        setNewClientData({phone:'', address:''});
                                                    }}
                                                    className="px-3 py-2 cursor-pointer text-sm"
                                                    style={i===clientSuggestionIndex?{background:GREEN_LIGHT}:{}}
                                                >
                                                    {client.nume} {client.telefon&&`— ${client.telefon}`}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {selectedClient&&(
                                        <p className="text-xs mt-1" style={{color:GREEN}}>✓ Client selectat: {selectedClient.nume}</p>
                                    )}
                                </div>

                                {clientSearch && !formData.client_id && (
                                    <div className="mb-4 p-3 rounded-lg border" style={{background:'#F4FAF5', borderColor:'#D1E4D3'}}>
                                        <p className="text-xs font-medium mb-2" style={{color:GREEN}}>Client nou — datele vor fi salvate automat</p>
                                        <div className="mb-2">
                                            <label className="block text-sm font-medium text-gray-600 mb-1">Telefon <span className="text-gray-400">(opțional)</span></label>
                                            <input type="text" value={newClientData.phone}
                                                onChange={(e)=>setNewClientData({...newClientData, phone:e.target.value})}
                                                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                                style={{borderColor:'#D1E4D3'}} placeholder="07xx xxx xxx"
                                                />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1">Adresă <span className="text-gray-400">(opțional)</span></label>
                                            <input type="text" value={newClientData.address}
                                                onChange={(e)=>setNewClientData({...newClientData, address:e.target.value})}
                                                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                                style={{borderColor:'#D1E4D3'}} placeholder="Str. ..."/>
                                        </div>
                                    </div>
                                )}

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Data livrare</label>
                                    <DatePicker
                                        selected={formData.data_livrare ? new Date(formData.data_livrare) : null}
                                        onChange={(date)=>setFormData({...formData, data_livrare:date ? `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}` : ''})}
                                        dateFormat="dd/MM/yyyy" locale={ro} placeholderText="Selectează data"
                                        minDate={new Date()} showMonthDropdown showYearDropdown dropdownMode="select" todayButton="Azi"
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none" required/>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Ora livrare</label>
                                    <DatePicker
                                        selected={formData.ora_livrare ? new Date(`2000-01-01T${formData.ora_livrare}`) : null}
                                        onChange={(time)=>setFormData({...formData, ora_livrare:time ? time.toTimeString().slice(0,5) : ''})}
                                        onChangeRaw={(e)=>{if(e.target.value) setFormData({...formData, ora_livrare:e.target.value});}}
                                        showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="Ora"
                                        dateFormat="HH:mm" locale={ro} placeholderText="Selectează ora"
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none" required/>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Observații</label>
                                    <textarea value={formData.observatii}
                                        onChange={(e)=>setFormData({...formData, observatii:e.target.value})}
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                        style={{borderColor:'#D1E4D3'}} rows="2"/>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                        Modalitate livrare <span className="text-red-400">*</span>
                                    </label>
                                    <select value={formData.modalitate_livrare}
                                        onChange={(e)=>setFormData({...formData, modalitate_livrare:e.target.value})}
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                        style={{borderColor:'#D1E4D3'}} required>
                                        <option value="ridicare">Ridicare personală</option>
                                        <option value="livrare">Livrare la domiciliu</option>
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-medium text-gray-600">Produse</label>
                                        <button type="button" onClick={handleAddProduct}
                                            className="text-sm font-medium hover:opacity-80" style={{color:GREEN}}>
                                            + Adaugă produs
                                        </button>
                                    </div>
                                    {formData.produse.map((produs, index)=>(
                                        <div key={index} className="flex gap-2 mb-2 relative">
                                            <div className="flex-1 relative">
                                                <input
                                                    type="text"
                                                    value={produs.nume_cautare||''}
                                                    onChange={(e)=>{
                                                        const val=e.target.value;
                                                        const updatedProducts=[...formData.produse];
                                                        updatedProducts[index].nume_cautare=val;
                                                        updatedProducts[index].produs_id='';
                                                        setFormData({...formData, produse:updatedProducts});
                                                        if(val){
                                                            setProductSuggestions({
                                                                index,
                                                                items:products.filter(p=>p.denumire.toLowerCase().includes(val.toLowerCase()))
                                                            });
                                                        }else{
                                                            setProductSuggestions(null);
                                                        }
                                                        setProductSuggestionIndex(-1);
                                                    }}
                                                    onKeyDown={(e)=>{
                                                        if(!productSuggestions || productSuggestions.index!==index) return;
                                                        if(e.key==='ArrowDown'){
                                                            e.preventDefault();
                                                            setProductSuggestionIndex(prev=>Math.min(prev+1, productSuggestions.items.length-1));
                                                        }
                                                        if(e.key==='ArrowUp'){
                                                            e.preventDefault();
                                                            setProductSuggestionIndex(prev=>Math.max(prev-1, -1));
                                                        }
                                                        if(e.key==='Enter' && productSuggestionIndex>=0){
                                                            e.preventDefault();
                                                            const selected=productSuggestions.items[productSuggestionIndex];
                                                            const updatedProducts=[...formData.produse];
                                                            updatedProducts[index].produs_id=selected.id;
                                                            updatedProducts[index].nume_cautare=selected.denumire;
                                                            setFormData({...formData, produse:updatedProducts});
                                                            setProductSuggestions(null);
                                                            setProductSuggestionIndex(-1);
                                                            setTimeout(()=>{
                                                                const cantitateInputs=document.querySelectorAll('.cantitate-input');
                                                                if(cantitateInputs[index]) cantitateInputs[index].focus();
                                                            }, 50);
                                                        }
                                                    }}
                                                    className="produs-search w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                                    style={{borderColor:'#D1E4D3'}}
                                                    placeholder="Caută produs..."/>
                                                {productSuggestions && productSuggestions.index===index && productSuggestions.items.length>0&&(
                                                    <div className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1" style={{borderColor:'#D1E4D3', maxHeight:'180px', overflowY:'auto'}}>
                                                        {productSuggestions.items.map((p, i)=>(
                                                            <div key={p.id}
                                                                onClick={()=>{
                                                                    const updatedProducts=[...formData.produse];
                                                                    updatedProducts[index].produs_id=p.id;
                                                                    updatedProducts[index].nume_cautare=p.denumire;
                                                                    setFormData({...formData, produse:updatedProducts});
                                                                    setProductSuggestions(null);
                                                                    setProductSuggestionIndex(-1);
                                                                    setTimeout(()=>{
                                                                        const cantitateInputs=document.querySelectorAll('.cantitate-input');
                                                                        if(cantitateInputs[index]) cantitateInputs[index].focus();
                                                                    }, 50);
                                                                }}
                                                                className="px-3 py-2 cursor-pointer text-sm"
                                                                style={i===productSuggestionIndex?{background:GREEN_LIGHT}:{}}
                                                            >
                                                                {p.denumire}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <input type="number" min="1" value={produs.cantitate}
                                                onChange={(e)=>handleProductChange(index, 'cantitate', e.target.value)}
                                                onFocus={(e)=>e.target.select()}
                                                onKeyDown={(e)=>{
                                                    if(e.key==='Enter'){
                                                        e.preventDefault();
                                                        const nextInput=document.querySelectorAll('.produs-search')[index+1];
                                                        if(nextInput){
                                                            nextInput.focus();
                                                        }else{
                                                            handleAddProduct();
                                                            setTimeout(()=>{
                                                                const inputs=document.querySelectorAll('.produs-search');
                                                                if(inputs[index+1]) inputs[index+1].focus();
                                                            }, 50);
                                                        }
                                                    }
                                                }}
                                                className="cantitate-input w-20 border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                                style={{borderColor:'#D1E4D3'}} placeholder="Cant."/>
                                            <button type="button" onClick={()=>handleRemoveProduct(index)}
                                                className="text-red-400 hover:text-red-600 px-2 text-lg">✕</button>
                                        </div>
                                    ))}
                                    {formData.produse.length===0&&<p className="text-sm text-gray-400">Niciun produs adaugat</p>}
                                </div>

                                <div className="flex justify-end gap-3">
                                    <button type="button"
                                        onClick={()=>{
                                            setShowModal(false); setEditOrder(null);
                                            setFormData({client_id:'', data_livrare:'', ora_livrare:'', observatii:'', modalitate_livrare:'', produse:[{produs_id:'', cantitate:1}]});
                                            setClientSearch(''); setSelectedClient(null);
                                            setClientSuggestions([]); setNewClientData({phone:'', address:''});
                                        }}
                                        className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition"
                                        style={{borderColor:'#D1E4D3', color:'#555'}}>
                                        Anulează
                                    </button>
                                    <button type="submit"
                                        className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition"
                                        style={{background:GREEN}}>
                                        {editOrder?'Salvează modificările':'Creează comanda'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    export default Orders;