import {useState, useEffect} from 'react';
import axios from 'axios';
import {useNavigate} from 'react-router-dom';

const GREEN='#6B8F71';
const GREEN_LIGHT='#EDF5EE';
const GREEN_DARK='#4A6B50';

const convertQuantity=(cantitate, unitate)=>{
    if(unitate==='g' && cantitate>=1000) return `${(cantitate/1000).toFixed(2)} kg`;
    if(unitate==='ml' && cantitate>=1000) return `${(cantitate/1000).toFixed(2)} l`;
    return `${Number(Number(cantitate).toFixed(2))} ${unitate}`;
};
const toGrams=(valoare, unitate)=>{
    if(unitate==='kg') return Number(valoare)*1000;
    if(unitate==='l') return Number(valoare)*1000;
    return Number(valoare);
};


function Stocks(){
    const [stocks, setStocks]=useState([]);
    const [ingredients, setIngredients]=useState([]);
    const [error, setError]=useState('');
    const [showModal, setShowModal]=useState(false);
    const [editStock, setEditStock]=useState(null);
    const [formData, setFormData]=useState({ingredient_id:'', cantitate_disponibila:'', prag_minim:'', unitate_cantitate:'g', unitate_prag:'g'})

    const navigate=useNavigate();
    const token=localStorage.getItem('token');

    const fetchStocks=async()=>{
        try{
            const response=await axios.get(`${import.meta.env.VITE_API_URL}/api/stocuri`,{
                headers:{Authorization:`Bearer ${token}`}
            });
            setStocks(response.data);
        }catch(err){
            if(err.response?.status===401){
                localStorage.removeItem('token');
                navigate('/login');
            }else{
                setError('Eroare la incarcarea stocurilor');
            }
        }
    };

    const fetchIngredients=async()=>{
        try{
            const response=await axios.get(`${import.meta.env.VITE_API_URL}/api/ingrediente`,{
                headers:{Authorization:`Bearer ${token}`}
            });
            setIngredients(response.data);
        }catch(err){console.error(err);}
    };

    useEffect(()=>{
        if(!token){navigate('/login'); return;}
        fetchStocks();
        fetchIngredients();
    },[token, navigate]);

    const handleSubmit=async(e)=>{
        e.preventDefault();
        setError('');
        if(Number(formData.cantitate_disponibila)<0 || Number(formData.prag_minim)<0){
            setError('Valorile trebuie sa fie pozitive');
            return;
        }
        try{
            const cantitate=toGrams(formData.cantitate_disponibila, formData.unitate_cantitate);
            const prag=toGrams(formData.prag_minim, formData.unitate_prag);
            if(editStock){
                await axios.put(`${import.meta.env.VITE_API_URL}/api/stocuri/${editStock.id}`,{
                    cantitate_disponibila:cantitate,
                    prag_minim:prag
                },{headers:{Authorization:`Bearer ${token}`}});
            }else{
                await axios.post(`${import.meta.env.VITE_API_URL}/api/stocuri`,{
                    ...formData,
                    cantitate_disponibila:cantitate,
                    prag_minim:prag
                },{headers:{Authorization:`Bearer ${token}`}});
            }
            setShowModal(false);
            setEditStock(null);
            setFormData({ingredient_id:'', cantitate_disponibila:'', prag_minim:'', unitate_cantitate:'g', unitate_prag:'g'});
            fetchStocks();
        }catch(err){
            setError(err.response?.data?.message||'Eroare la salvarea stocului');
        }
    };

    const handleEdit=(stock)=>{
        setError('');
        setEditStock(stock);

        let cantitate=Number(stock.cantitate_disponibila);
        let prag=Number(stock.prag_minim);
        let unitate=stock.unitate_masura;
        let unitatePrag=stock.unitate_masura;

        if(unitate==='g' && cantitate>=1000){
            cantitate=cantitate/1000;
            unitate='kg';
        }
        if(unitate==='ml' && cantitate>=1000){
            cantitate=cantitate/1000;
            unitate='l';
        }
        if(unitatePrag==='g' && prag>=1000){
            prag=prag/1000;
            unitatePrag='kg';
        }
        if(unitatePrag==='ml' && prag>=1000){
            prag=prag/1000;
            unitatePrag='l';
        }

        setFormData({
            ingredient_id:stock.ingredient_id,
            cantitate_disponibila:cantitate,
            prag_minim:prag,
            unitate_cantitate:unitate,
            unitate_prag:unitatePrag
        });
        setShowModal(true);
    };

    const handleDelete=async(id)=>{
        if(!window.confirm('Esti sigur ca vrei sa stergi acest stoc?')) return;
        setError('');
        try{
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/stocuri/${id}`,{
                headers:{Authorization:`Bearer ${token}`}
            });
            fetchStocks();
        }catch(err){
            setError('Eroare la stergerea stocului');
        }
    };

    const handleAdd=()=>{
        setError('');
        setEditStock(null);
        setFormData({ingredient_id:'', cantitate_disponibila:'', prag_minim:'', unitate_cantitate:'g', unitate_prag:'g'});
        setShowModal(true);
    };

    const isLowStock=(stock)=>Number(stock.cantitate_disponibila)<=Number(stock.prag_minim);

    return(
        <div className="min-h-screen p-6" style={{background:'#F8F9FA'}}>
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold" style={{color:'#2D2D2D'}}>Stocuri</h1>
                    <button
                        onClick={handleAdd}
                        className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition"
                        style={{background:GREEN}}
                    >
                        + Adaugă stoc
                    </button>
                </div>

                {error&&<div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

                <div className="flex flex-col gap-2">
                    {stocks.length===0?(
                        <div className="bg-white rounded-xl border p-6 text-center text-gray-400" style={{borderColor:'#D1E4D3'}}>
                            Nu există stocuri
                        </div>
                    ):(
                        stocks.map(stock=>(
                            <div key={stock.id} className="bg-white rounded-xl border flex items-center gap-3 px-4 py-3 hover:border-green-400 transition" style={{borderColor: isLowStock(stock) ? '#FECACA' : '#D1E4D3'}}>
                                <div className="rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{width:'36px', height:'36px', background: isLowStock(stock)?'#FEF2F2':'#EDF5EE', color: isLowStock(stock)?'#B91C1C':'#4A6B50'}}>
                                    {isLowStock(stock)?'⚠':'✓'}
                                </div>
                                <div style={{flex:1}}>
                                    <p className="font-medium text-sm" style={{color:'#2D2D2D'}}>{stock.nume_ingredient}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {convertQuantity(Number(stock.cantitate_disponibila), stock.unitate_masura)} disponibil · prag {convertQuantity(Number(stock.prag_minim), stock.unitate_masura)}
                                    </p>
                                </div>
                                {isLowStock(stock)?(
                                    <span className="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0" style={{background:'#FEF2F2', color:'#B91C1C'}}>
                                        Stoc scăzut
                                    </span>
                                ):(
                                    <span className="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0" style={{background:GREEN_LIGHT, color:GREEN_DARK}}>
                                        OK
                                    </span>
                                )}
                                <div className="flex gap-2 flex-shrink-0">
                                    <button onClick={()=>handleEdit(stock)}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                                        style={{background:GREEN_LIGHT, color:GREEN_DARK}}>
                                        Editează
                                    </button>
                                    <button onClick={()=>handleDelete(stock.id)}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                                        style={{background:'#FEF2F2', color:'#B91C1C'}}>
                                        Șterge
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {showModal&&(
                <div className="fixed inset-0 flex items-center justify-center z-50" style={{background:'rgba(0,0,0,0.4)'}}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md" style={{border:'0.5px solid #D1E4D3'}}>
                        <h2 className="text-xl font-bold mb-4" style={{color:'#2D2D2D'}}>
                            {editStock?'Editează stoc':'Adaugă stoc nou'}
                        </h2>

                        <form onSubmit={handleSubmit}>
                            {!editStock&&(
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Ingredient</label>
                                    <select value={formData.ingredient_id}
                                        onChange={(e)=>setFormData({...formData, ingredient_id:e.target.value})}
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                        style={{borderColor:'#D1E4D3'}} required>
                                        <option value="">Selectează ingredient</option>
                                        {ingredients.map(ingredient=>(
                                            <option key={ingredient.id} value={ingredient.id}>
                                                {ingredient.denumire} ({ingredient.unitate_masura})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {editStock&&(
                                <div className="mb-4 p-3 rounded-lg" style={{background:GREEN_LIGHT}}>
                                    <p className="text-sm font-medium" style={{color:GREEN_DARK}}>
                                        Ingredient: <span style={{color:GREEN}}>{editStock.nume_ingredient}</span>
                                    </p>
                                </div>
                            )}

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-600 mb-1">Cantitate disponibilă</label>
                                <div className="flex gap-2">
                                    <input type="number" step="0.001" min="0"
                                        value={formData.cantitate_disponibila}
                                        onChange={(e)=>setFormData({...formData, cantitate_disponibila:e.target.value})}
                                        className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                        style={{borderColor:'#D1E4D3'}} required/>
                                    <select value={formData.unitate_cantitate}
                                        onChange={(e)=>setFormData({...formData, unitate_cantitate:e.target.value})}
                                        className="border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                        style={{borderColor:'#D1E4D3'}}>
                                        <option value="g">g</option>
                                        <option value="kg">kg</option>
                                        <option value="ml">ml</option>
                                        <option value="l">l</option>
                                        <option value="buc">buc</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-600 mb-1">Prag minim</label>
                                <div className="flex gap-2">
                                    <input type="number" step="0.001" min="0"
                                        value={formData.prag_minim}
                                        onChange={(e)=>setFormData({...formData, prag_minim:e.target.value})}
                                        className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                        style={{borderColor:'#D1E4D3'}} required/>
                                    <select value={formData.unitate_prag}
                                        onChange={(e)=>setFormData({...formData, unitate_prag:e.target.value})}
                                        className="border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                        style={{borderColor:'#D1E4D3'}}>
                                        <option value="g">g</option>
                                        <option value="kg">kg</option>
                                        <option value="ml">ml</option>
                                        <option value="l">l</option>
                                        <option value="buc">buc</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button type="button"
                                    onClick={()=>{setShowModal(false); setEditStock(null); setFormData({ingredient_id:'', cantitate_disponibila:'', prag_minim:'', unitate_cantitate:'g', unitate_prag:'g'});}}
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
        </div>
    );
}

export default Stocks;