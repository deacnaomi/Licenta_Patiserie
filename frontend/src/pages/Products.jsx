import {useState, useEffect} from 'react';
import axios from 'axios';
import {useNavigate} from 'react-router-dom';

const GREEN='#6B8F71';
const GREEN_LIGHT='#EDF5EE';
const GREEN_DARK='#4A6B50';
const GOLD='#C9A84C';

const convertQuantity=(cantitate, unitate)=>{
    if(unitate==='g' && cantitate>=1000) return `${parseFloat((cantitate/1000).toFixed(2))} kg`;
    if(unitate==='ml' && cantitate>=1000) return `${parseFloat((cantitate/1000).toFixed(2))} l`;
    return `${parseFloat(cantitate)} ${unitate}`;
};

function Products(){
    const [products, setProducts]=useState([]);
    const [error, setError]=useState('');
    const [showModal, setShowModal]=useState(false);
    const [showRecipeModal, setShowRecipeModal]=useState(false);
    const [editProduct, setEditProduct]=useState(null);
    const [selectedProduct, setSelectedProduct]=useState(null);
    const [recipe, setRecipe]=useState([]);
    const [ingredients, setIngredients]=useState([]);
    const [search, setSearch]=useState('');
    const [filterCategory, setFilterCategory]=useState('toate');//filtrul de categorie
    const [recipeFormData, setRecipeFormData]=useState({ingredient_id:'', cantitate_pe_produs:''});
    const [formData, setFormData]=useState({name:'', description:'', price:'', category:'Dulce'});
    const [showNewIngredient, setShowNewIngredient]=useState(false);
    const [newIngredientData, setNewIngredientData]=useState({name:'', unit:'g'});
    const [selectedFile, setSelectedFile]=useState(null);//fisierul selectat pentru upload
    const [previewUrl, setPreviewUrl]=useState(null);//preview poza inainte de upload

    const navigate=useNavigate();
    const token=localStorage.getItem('token');

    const fetchProducts=async()=>{
        try{
            const response=await axios.get(`${import.meta.env.VITE_API_URL}/api/produse`,{
                headers:{Authorization:`Bearer ${token}`}
            });
            setProducts(response.data);
        }catch(err){
            if(err.response?.status===401){
                localStorage.removeItem('token');
                navigate('/login');
            }else{
                setError('Eroare la incarcarea produselor');
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

    const fetchRecipe=async(productId)=>{
        try{
            const response=await axios.get(`${import.meta.env.VITE_API_URL}/api/retete/${productId}`,{
                headers:{Authorization:`Bearer ${token}`}
            });
            setRecipe(response.data);
        }catch(err){console.error(err);}
    };

    useEffect(()=>{
        if(!token){navigate('/login'); return;}
        fetchProducts();
        fetchIngredients();
    },[token, navigate]);

    const handleFileChange=(e)=>{
        const file=e.target.files[0];
        if(file){
            if(previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit=async(e)=>{
        e.preventDefault(); 
        setError('');
        try{
            // folosim FormData pentru a trimite si fisierul
            const data=new FormData();
            data.append('name', formData.name);
            data.append('description', formData.description);
            data.append('price', formData.price);
            data.append('category', formData.category);
            if(selectedFile){
                data.append('poza', selectedFile);//adaugam poza daca exista
            }

            if(editProduct){
                await axios.put(`${import.meta.env.VITE_API_URL}/api/produse/${editProduct.id}`, data,{
                    headers:{Authorization:`Bearer ${token}`}
                    // nu setam Content-Type, axios il seteaza automat pentru FormData
                });
            }else{
                await axios.post(`${import.meta.env.VITE_API_URL}/api/produse`, data,{
                    headers:{Authorization:`Bearer ${token}`}
                });
            }
            setShowModal(false);
            setEditProduct(null);
            setFormData({name:'', description:'', price:'', category:'Dulce'});
            setSelectedFile(null);
            setPreviewUrl(null);
            fetchProducts();
        }catch(err){
            setError('Eroare la salvarea produsului');
        }
    };

    const handleEdit=(product)=>{
        setError('');
        setEditProduct(product);
        setFormData({
            name:product.denumire,
            description:product.descriere||'',
            price:product.pret,
            category:product.categorie
        });
        setSelectedFile(null);
        setPreviewUrl(product.poza ? `${import.meta.env.VITE_API_URL}/uploads/${product.poza}` : null);
        setShowModal(true);
    };

    const handleDelete=async(id)=>{
        if(!window.confirm('Esti sigur ca vrei sa stergi acest produs?')) return;
        setError('');
        try{
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/produse/${id}`,{
                headers:{Authorization:`Bearer ${token}`}
            });
            fetchProducts();
        }catch(err){
            if(err.response?.data?.message){
                setError(err.response.data.message);
            }else{
                setError('Eroare la stergerea produsului');
            }
        }
    };

    const handleOpenRecipe=async(product)=>{
        setSelectedProduct(product);
        await fetchRecipe(product.id);
        setRecipeFormData({ingredient_id:'', cantitate_pe_produs:''});
        setShowRecipeModal(true);
    };

    const handleAddToRecipe=async(e)=>{
        e.preventDefault();
        setError('');
        try{
            await axios.post(`${import.meta.env.VITE_API_URL}/api/retete`,{
                produs_id:selectedProduct.id,
                ingredient_id:recipeFormData.ingredient_id,
                cantitate_pe_produs:recipeFormData.cantitate_pe_produs
            },{headers:{Authorization:`Bearer ${token}`}});
            setRecipeFormData({ingredient_id:'', cantitate_pe_produs:''});
            fetchRecipe(selectedProduct.id);
            fetchProducts();
        }catch(err){
            setError(err.response?.data?.message||'Eroare la adaugarea ingredientului');
        }
    };

    const handleDeleteFromRecipe=async(id)=>{
        if(!window.confirm('Stergi acest ingredient din reteta?')) return;
        try{
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/retete/${id}`,{
                headers:{Authorization:`Bearer ${token}`}
            });
            fetchRecipe(selectedProduct.id);
            fetchProducts();
        }catch(err){
            setError('Eroare la stergerea ingredientului din reteta');
        }
    };

    const handleAddNewIngredient=async()=>{
        if(!newIngredientData.name){setError('Introdu numele ingredientului'); return;}
        setError('');
        try{
            const response=await axios.post(`${import.meta.env.VITE_API_URL}/api/ingrediente`,
                {name:newIngredientData.name, unit:newIngredientData.unit},
                {headers:{Authorization:`Bearer ${token}`}}
            );
            await fetchIngredients();
            setRecipeFormData({...recipeFormData, ingredient_id:response.data.id});
            setNewIngredientData({name:'', unit:'g'});
            setShowNewIngredient(false);
        }catch(err){
            setError('Eroare la adaugarea ingredientului');
        }
    };
    const filteredProducts=products
        .filter(p=>p.denumire.toLowerCase().includes(search.toLowerCase()))
        .filter(p=>filterCategory==='toate' || p.categorie===filterCategory);

    return(
        <div className="min-h-screen p-6" style={{background:'#F8F9FA'}}>
            <div className="max-w-4xl mx-auto">
                {/* header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold" style={{color:'#2D2D2D'}}>Produse</h1>
                    <div className="flex gap-3 items-center">
                        {/* butoane filtrare categorie */}
                        <div className="flex gap-2">
                            {['toate','Dulce','Sarat','Inmormantare'].map(cat=>(
                                <button
                                    key={cat}
                                    onClick={()=>setFilterCategory(cat)}
                                    className="px-3 py-2 rounded-lg text-sm font-medium transition"
                                    style={filterCategory===cat
                                        ?{background:GREEN, color:'#fff'}
                                        :{background:'#fff', color:'#555', border:'0.5px solid #D1E4D3'}
                                    }
                                >
                                    {cat==='toate'?'Toate':cat}
                                </button>
                            ))}
                        </div>
                        <input
                            type="text"
                            value={search}
                            onChange={(e)=>setSearch(e.target.value)}
                            placeholder="Caută produs..."
                            className="border rounded-lg px-3 py-2 text-sm focus:outline-none"
                            style={{borderColor:'#D1E4D3', width:'200px'}}
                        />
                        <button
                            onClick={()=>{setEditProduct(null); setFormData({name:'', description:'', price:'', category:'Dulce'}); setSelectedFile(null); setPreviewUrl(null); setShowModal(true);}}
                            className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition"
                            style={{background:GREEN}}
                        >
                            + Adaugă produs
                        </button>
                    </div>
                </div>

                {error&&<div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

                {/* lista produse */}
                <div className="flex flex-col gap-3">
                    {filteredProducts.length===0?(
                        <div className="bg-white rounded-xl border p-6 text-center text-gray-400" style={{borderColor:'#D1E4D3'}}>
                            Nu există produse
                        </div>
                    ):(
                        filteredProducts.map(product=>(
                            <div key={product.id} className="bg-white rounded-xl border flex items-center gap-4 p-4 hover:border-green-400 transition" style={{borderColor:'#D1E4D3'}}>
                                {/* poza produs */}
                            <div className="rounded-lg overflow-hidden flex-shrink-0" style={{width:'80px', height:'80px', background:GREEN_LIGHT}}>    
                                    {product.poza?(
                                        <img
                                            src={`${import.meta.env.VITE_API_URL}/uploads/${product.poza}`}
                                            alt={product.denumire}
                                            style={{width:'100%', height:'100%', objectFit:'cover'}}
                                        />
                                    ):(
                                        <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px'}}>
                                            🥐
                                        </div>
                                    )}
                                </div>

                                {/* informatii produs */}
                                <div style={{flex:1}}>
                                    <p className="font-medium" style={{color:'#2D2D2D'}}>{product.denumire}</p>
                                    <span className="text-xs px-2 py-0.5 rounded-full" style={{background:GREEN_LIGHT, color:GREEN_DARK}}>
                                        {product.categorie}
                                    </span>
                                </div>

                                <div style={{minWidth:'100px', textAlign:'right'}}>
                                    <p className="font-medium text-sm" style={{color:GOLD}}>
                                        {(Number(product.pret) * (1 + (product.tva ?? 11)/100)).toFixed(2)} RON
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        fără TVA: {Number(product.pret).toFixed(2)} RON · TVA {product.tva ?? 11}%
                                    </p>
                                </div>
                                {/* butoane actiuni */}
                                <div className="flex gap-2 flex-shrink-0">
                                    <button
                                        onClick={()=>handleOpenRecipe(product)}
                                        className="px-4 py-2 rounded-lg text-sm font-medium"
                                        style={{background:'#FEF9EB', color:'#8B6914'}}
                                    >
                                        Rețetă
                                    </button>
                                    <button
                                        onClick={()=>handleEdit(product)}
                                        className="px-4 py-2 rounded-lg text-sm font-medium"
                                        style={{background:GREEN_LIGHT, color:GREEN_DARK}}
                                    >
                                        Editează
                                    </button>
                                    <button
                                        onClick={()=>handleDelete(product.id)}
                                        className="px-4 py-2 rounded-lg text-sm font-medium"
                                        style={{background:'#FEF2F2', color:'#B91C1C'}}
                                    >
                                        Șterge
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal adaugare/editare produs */}
            {showModal&&(
                <div className="fixed inset-0 flex items-center justify-center z-50" style={{background:'rgba(0,0,0,0.4)'}}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md" style={{border:'0.5px solid #D1E4D3'}}>
                        <h2 className="text-xl font-bold mb-4" style={{color:'#2D2D2D'}}>
                            {editProduct?'Editează produs':'Adaugă produs nou'}
                        </h2>

                        <form onSubmit={handleSubmit}>
                            {/* upload poza */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-600 mb-1">Poză produs</label>
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg overflow-hidden flex-shrink-0" style={{width:'64px', height:'64px', background:GREEN_LIGHT}}>
                                        {previewUrl?(
                                            <img src={previewUrl} alt="preview" style={{width:'100%', height:'100%', objectFit:'cover'}}/>
                                        ):(
                                            <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px'}}>🥐</div>
                                        )}
                                    </div>
                                    <label className="cursor-pointer px-3 py-2 rounded-lg text-sm font-medium hover:opacity-80 transition"
                                        style={{background:GREEN_LIGHT, color:GREEN_DARK}}>
                                        Alege poză
                                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden"/>
                                    </label>
                                    {previewUrl&&(
                                        <button type="button" onClick={()=>{
                                            if(previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
                                            setSelectedFile(null); setPreviewUrl(null);
                                        }}
                                            className="text-sm text-red-400 hover:text-red-600">
                                            Șterge
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-600 mb-1">Denumire</label>
                                <input type="text" value={formData.name}
                                    onChange={(e)=>setFormData({...formData, name:e.target.value})}
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                    style={{borderColor:'#D1E4D3'}} required/>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-600 mb-1">Descriere</label>
                                <textarea value={formData.description}
                                    onChange={(e)=>setFormData({...formData, description:e.target.value})}
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                    style={{borderColor:'#D1E4D3'}} rows="2"/>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-600 mb-1">Preț (RON)</label>
                                <input type="number" step="0.01" value={formData.price}
                                    onChange={(e)=>setFormData({...formData, price:e.target.value})}
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                    style={{borderColor:'#D1E4D3'}} required/>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-600 mb-1">Categorie</label>
                                <select value={formData.category}
                                    onChange={(e)=>setFormData({...formData, category:e.target.value})}
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                    style={{borderColor:'#D1E4D3'}}>
                                    <option value="Dulce">Dulce</option>
                                    <option value="Sarat">Sărat</option>
                                    <option value="Inmormantare">Înmormântare</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button type="button"
                                    onClick={()=>{setShowModal(false); setEditProduct(null); setSelectedFile(null); setPreviewUrl(null);}}
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

            {/* Modal reteta produs */}
            {showRecipeModal&&selectedProduct&&(
                <div className="fixed inset-0 flex items-center justify-center z-50" style={{background:'rgba(0,0,0,0.4)'}}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-screen overflow-y-auto" style={{border:'0.5px solid #D1E4D3'}}>
                        <h2 className="text-xl font-bold mb-1" style={{color:'#2D2D2D'}}>Rețetă — {selectedProduct.denumire}</h2>
                        <p className="text-sm text-gray-400 mb-4">Ingrediente necesare per bucată</p>

                        {recipe.length===0?(
                            <p className="text-gray-400 text-sm mb-4">Nu există ingrediente în rețetă</p>
                        ):(
                            <div className="mb-4 flex flex-col gap-2">
                                {recipe.map(item=>(
                                    <div key={item.id} className="flex justify-between items-center py-2 px-3 rounded-lg" style={{background:GREEN_LIGHT}}>
                                        <span className="font-medium" style={{color:'#2D2D2D'}}>{item.nume_ingredient}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold" style={{color:GREEN}}>{convertQuantity(Number(item.cantitate_pe_produs), item.unitate_masura)}</span>
                                            <button onClick={()=>handleDeleteFromRecipe(item.id)}
                                                className="text-xs text-red-400 hover:text-red-600">Șterge</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <form onSubmit={handleAddToRecipe} className="border-t pt-4" style={{borderColor:'#D1E4D3'}}>
                            <p className="text-sm font-medium text-gray-600 mb-2">
                                Adaugă ingredient
                                <button type="button" onClick={()=>setShowNewIngredient(!showNewIngredient)}
                                    className="ml-2 text-xs font-medium hover:opacity-80"
                                    style={{color:GREEN}}>
                                    {showNewIngredient ? '✕ Anulează' : '+ Ingredient nou'}
                                </button>
                            </p>
                            {showNewIngredient&&(
                                <div className="flex gap-2 mb-3 p-3 rounded-lg" style={{background:GREEN_LIGHT}}>
                                    <input type="text" value={newIngredientData.name}
                                        onChange={(e)=>setNewIngredientData({...newIngredientData, name:e.target.value})}
                                        className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                        style={{borderColor:'#D1E4D3'}} placeholder="Nume ingredient"/>
                                    <select value={newIngredientData.unit}
                                        onChange={(e)=>setNewIngredientData({...newIngredientData, unit:e.target.value})}
                                        className="border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                        style={{borderColor:'#D1E4D3'}}>
                                        <option value="g">g</option>
                                        <option value="kg">kg</option>
                                        <option value="ml">ml</option>
                                        <option value="l">l</option>
                                        <option value="buc">buc</option>
                                    </select>
                                    <button type="button" onClick={handleAddNewIngredient}
                                        className="px-3 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90"
                                        style={{background:GREEN}}>
                                        Salvează
                                    </button>
                                </div>
                            )}
                            <div className="flex gap-2 mb-3">
                                <select value={recipeFormData.ingredient_id}
                                    onChange={(e)=>setRecipeFormData({...recipeFormData, ingredient_id:e.target.value})}
                                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                    style={{borderColor:'#D1E4D3'}} required>
                                    <option value="">Selectează ingredient</option>
                                    {ingredients.map(ingredient=>(
                                        <option key={ingredient.id} value={ingredient.id}>
                                            {ingredient.denumire} ({ingredient.unitate_masura})
                                        </option>
                                    ))}
                                </select>
                                <input type="number" step="0.001" min="0"
                                    value={recipeFormData.cantitate_pe_produs}
                                    onChange={(e)=>setRecipeFormData({...recipeFormData, cantitate_pe_produs:e.target.value})}
                                    className="w-24 border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                    style={{borderColor:'#D1E4D3'}} placeholder="Cant." required/>
                                <button type="submit"
                                    className="px-3 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90"
                                    style={{background:GREEN}}>
                                    + Adaugă
                                </button>
                            </div>
                        </form>

                        {error&&<div className="bg-red-50 text-red-700 p-2 rounded text-sm mb-3">{error}</div>}

                        <div className="flex justify-end">
                            <button onClick={()=>{setShowRecipeModal(false); setSelectedProduct(null); setRecipe([]); setError('');}}
                                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 transition"
                                style={{borderColor:'#D1E4D3', color:'#555'}}>
                                Închide
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Products;