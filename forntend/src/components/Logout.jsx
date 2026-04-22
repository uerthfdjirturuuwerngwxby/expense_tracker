import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Logout = () => {
    const { logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        window.location.href = '/login';
    };

    return (
        <button 
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
            Logout
        </button>
    );
};

export default Logout;