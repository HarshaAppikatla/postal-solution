import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, User } from 'lucide-react';

const AdminLogin = () => {
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('admin');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        if (username === 'admin' && password === 'admin') {
            localStorage.setItem('admin', JSON.stringify({ role: 'System Admin', name: 'Super Admin' }));
            navigate('/admin');
        } else {
            alert("Invalid credentials! Try admin/admin");
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-700">
                <div className="bg-gray-800 p-8 text-center border-b border-gray-700">
                    <div className="bg-blue-600/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-blue-500/30">
                        <ShieldCheck className="h-8 w-8 text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Postal Officer Login</h2>
                    <p className="text-gray-400 text-sm">Restricted Access • Authorized Personnel Only</p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Officer ID / Username</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-gray-500"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Secure Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                                <input
                                    type="password"
                                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-gray-500"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-900/50">
                            Authenticate & Access Dashboard
                        </button>
                    </form>
                </div>
                <div className="bg-gray-900/50 p-4 text-center text-xs text-gray-600">
                    System v1.0 • SmartPost AI
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
