import {Navigate} from 'react-router-dom';

function ProtectedRoute({children, allowedRoles}){
    const token=localStorage.getItem('token');
    const user=JSON.parse(localStorage.getItem('user'));

    if(!token || !user){
        return <Navigate to="/login" />;
    }

    if(allowedRoles && !allowedRoles.includes(user.role)){
        return <Navigate to="/comenzi" />;
    }
    return children;
}

export default ProtectedRoute;