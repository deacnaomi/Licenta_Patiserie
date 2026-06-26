import {useState, useEffect} from 'react';
import axios from 'axios';
import {useNavigate} from 'react-router-dom';

const GREEN='#6B8F71';
const GREEN_LIGHT='#EDF5EE';
const GREEN_DARK='#4A6B50';

function Ingredients(){
    const [ingredients, setIngredients]=useState([]);
    const [error, setError]=useState('');
    const [showModal, setShowModal]=useState(false);
    const [editIngredient, setEditIngredient]=useState(null);
    const [formData, setFormData]=useState({name:'', unit:''});

    const navigate=useNavigate();
    const token=localStorage.getItem('token');

    const fetchIngredients=async()=>{
        try{
            const response=await axios.get(`${import.meta.env.VITE_API_URL}/api/ingrediente`,{
                headers:{Authorization:`Bearer ${token}`}
            });
            setIngredients(response.data);
        }catch(err){
            if(err.response?.status===401){
                localStorage.removeItem('token');
                navigate('/login');
            }else{
                setError('Eroare la incarcarea ingredientelor');
            }
        }
    };

    useEffect(()=>{
        if(!token){navigate('/login'); return;}
        fetchIngredients();
    },[token, navigate]);

    const handleSubmit=async(e)=>{
        e.preventDefault();
        setError('');
        try{
            if(editIngredient){
                await axios.put(`${import.meta.env.VITE_API_URL}/api/ingrediente/${editIngredient.id}`, formData,{
                    headers:{Authorization:`Bearer ${token}`}
                });
            }else{
                await axios.post(`${import.meta.env.VITE_API_URL}/api/ingrediente`, formData,{
                    headers:{Authorization:`Bearer ${token}`}
                });
            }
            setShowModal(false);
            setEditIngredient(null);
            setFormData({name:'', unit:''});
            fetchIngredients();
        }catch(err){
            if(err.response?.data?.message){
                setError(err.response.data.message);
            }else{
                setError('Eroare la salvarea ingredientului');
            }
        }
    };

    const handleEdit=(ingredient)=>{
        setError('');
        setEditIngredient(ingredient);
        setFormData({name:ingredient.denumire, unit:ingredient.unitate_masura});
        setShowModal(true);
    };

    const handleDelete=async(id)=>{
        if(!window.confirm('Esti sigur ca vrei sa stergi acest ingredient?')) return;
        setError('');
        try{
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/ingrediente/${id}`,{
                headers:{Authorization:`Bearer ${token}`}
            });
            fetchIngredients();
        }catch(err){
            if(err.response?.data?.message){
                setError(err.response.data.message);
            }else{
                setError('Eroare la stergerea ingredientului');
            }
        }
    };

    const handleAdd=()=>{
        setError('');
        setEditIngredient(null);
        setFormData({name:'', unit:''});
        setShowModal(true);
    };

    return(
        <div className="min-h-screen p-6" style={{background:'#F8F9FA'}}>
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold" style={{color:'#2D2D2D'}}>Ingrediente</h1>
                    <button
                        onClick={handleAdd}
                        className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition"
                        style={{background:GREEN}}
                    >
                        + Adaugă ingredient
                    </button>
                </div>

                {error&&<div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

                {/* lista ingrediente ca carduri */}
                <div className="flex flex-col gap-2">
                    {ingredients.length===0?(
                        <div className="bg-white rounded-xl border p-6 text-center text-gray-400" style={{borderColor:'#D1E4D3'}}>
                            Nu există ingrediente
                        </div>
                    ):(
                        ingredients.map(ingredient=>(
                            <div key={ingredient.id} className="bg-white rounded-xl border flex items-center gap-3 px-4 py-3 hover:border-green-400 transition" style={{borderColor:'#D1E4D3'}}>
                                {/* icon unitate masura */}
                                <div className="rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{width:'36px', height:'36px', background:GREEN_LIGHT, color:GREEN_DARK}}>
                                    {ingredient.unitate_masura}
                                </div>
                                {/* nume ingredient */}
                                <div style={{flex:1}}>
                                    <p className="font-medium text-sm" style={{color:'#2D2D2D'}}>{ingredient.denumire}</p>
                                </div>
                                {/* butoane */}
                                <div className="flex gap-2 flex-shrink-0">
                                    <button onClick={()=>handleEdit(ingredient)}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                                        style={{background:GREEN_LIGHT, color:GREEN_DARK}}>
                                        Editează
                                    </button>
                                    <button onClick={()=>handleDelete(ingredient.id)}
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

            {/* Modal adaugare/editare ingredient */}
            {showModal&&(
                <div className="fixed inset-0 flex items-center justify-center z-50" style={{background:'rgba(0,0,0,0.4)'}}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md" style={{border:'0.5px solid #D1E4D3'}}>
                        <h2 className="text-xl font-bold mb-4" style={{color:'#2D2D2D'}}>
                            {editIngredient?'Editează ingredient':'Adaugă ingredient nou'}
                        </h2>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-600 mb-1">Denumire</label>
                                <input type="text" value={formData.name}
                                    onChange={(e)=>setFormData({...formData, name:e.target.value})}
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                    style={{borderColor:'#D1E4D3'}} required/>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-600 mb-1">Unitate de măsură</label>
                                <select value={formData.unit}
                                    onChange={(e)=>setFormData({...formData, unit:e.target.value})}
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                    style={{borderColor:'#D1E4D3'}} required>
                                    <option value="">Selectează unitatea</option>
                                    <option value="kg">kg</option>
                                    <option value="g">g</option>
                                    <option value="l">l</option>
                                    <option value="ml">ml</option>
                                    <option value="buc">buc</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button type="button"
                                    onClick={()=>{setShowModal(false); setEditIngredient(null); setFormData({name:'', unit:''}); }}
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

export default Ingredients;