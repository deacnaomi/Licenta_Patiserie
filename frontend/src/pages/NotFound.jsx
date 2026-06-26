import {useNavigate} from 'react-router-dom';

const GREEN='#6B8F71';

function NotFound(){
    const navigate=useNavigate();
    const user=JSON.parse(localStorage.getItem('user'));

    return(
        <div className="min-h-screen flex items-center justify-center" style={{background:'#F8F9FA'}}>
            <div className="text-center">
                <div className="text-6xl mb-4">🥐</div>
                <h1 className="text-6xl font-bold mb-2" style={{color:GREEN}}>404</h1>
                <p className="text-xl font-medium mb-2" style={{color:'#2D2D2D'}}>Pagina nu există</p>
                <p className="text-sm text-gray-400 mb-8">Se pare că ai nimerit pe o pagină greșită.</p>
                <button
                    onClick={()=>navigate(user ? (user.role==='admin' ? '/dashboard' : '/comenzi') : '/login')}
                    className="px-6 py-2 rounded-lg text-white font-medium hover:opacity-90 transition"
                    style={{background:GREEN}}
                >
                    Înapoi acasă
                </button>
            </div>
        </div>
    );
}

export default NotFound;