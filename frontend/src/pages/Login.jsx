import {useState} from 'react';
import axios from 'axios';
import {useNavigate} from 'react-router-dom';

const GREEN='#6B8F71';

function Login(){
    const [email, setEmail]=useState('');
    const [password, setPassword]=useState('');
    const [error, setError]=useState('');
    const navigate=useNavigate();

    const handleLogin=async(e)=>{
        e.preventDefault();
        setError('');
        try{
            const response=await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`,{
                email,
                password//trimit email si parola catre backend
            });

            //salvam tokenul si datele userului in localStorage
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            //redirectionam in functie de rol
            const userRole=response.data.user.role;
            if(userRole==='admin'){
                navigate('/dashboard');
            }else{
                navigate('/comenzi');
            }
        }catch(err){
            setError('Email sau parolă incorecte');
        }
    };

    return(
        <div className="min-h-screen flex items-center justify-center" style={{background:'#F8F9FA'}}>
            <div className="w-full max-w-md">
                {/* logo/brand */}
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">🥐</div>
                    <h1 className="text-3xl font-bold" style={{color:'#2D2D2D'}}>Patiserie</h1>
                    <p className="text-sm mt-1" style={{color:GREEN}}>Sistem de management intern</p>
                </div>

                {/* card login */}
                <div className="bg-white rounded-2xl p-8" style={{border:'0.5px solid #D1E4D3'}}>
                    <h2 className="text-xl font-bold mb-6" style={{color:'#2D2D2D'}}>Autentificare</h2>

                    {error&&(
                        <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1" style={{color:'#555'}}>
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e)=>setEmail(e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                style={{borderColor:'#D1E4D3'}}
                                placeholder="admin@patiserie.ro"
                                required
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-1" style={{color:'#555'}}>
                                Parolă
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e)=>setPassword(e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none"
                                style={{borderColor:'#D1E4D3'}}
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-2 rounded-lg text-white font-medium hover:opacity-90 transition"
                            style={{background:GREEN}}
                        >
                            Intră în cont
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;