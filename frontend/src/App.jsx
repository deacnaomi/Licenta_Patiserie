import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import Login from './pages/Login';
import Products from './pages/Products';
import Clients from './pages/Clients';
import Navbar from './components/Navbar';
import Orders from './pages/Orders';
import Ingredients from './pages/Ingredients';
import Stocks from './pages/Stocks';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import OrderDetails from './pages/OrderDetails';
import NotFound from './pages/NotFound';

function App(){
    const token=localStorage.getItem('token');

    return(
        <BrowserRouter>
            {token && <Navbar />}
            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<Login />} />

                <Route path="/produse" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <Products />
                    </ProtectedRoute>
                } />
                <Route path="/clienti" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <Clients />
                    </ProtectedRoute>
                } />
                <Route path="/ingrediente" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <Ingredients />
                    </ProtectedRoute>
                } />
                <Route path="/stocuri" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <Stocks />
                    </ProtectedRoute>
                } />
                <Route path="/comenzi/:id" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <OrderDetails />
                    </ProtectedRoute>
                } />
                <Route path="/comenzi" element={
                    <ProtectedRoute allowedRoles={['admin', 'brutar']}>
                        <Orders />
                    </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                        <Dashboard />
                    </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;