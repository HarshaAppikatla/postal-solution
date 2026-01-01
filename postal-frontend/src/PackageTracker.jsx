import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Truck, MapPin, Clock, Search, AlertCircle, CheckCircle } from 'lucide-react';

const PackageTracker = ({ user }) => {
    const [trackingId, setTrackingId] = useState('');
    const [packageData, setPackageData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [myPackages, setMyPackages] = useState([]);

    useEffect(() => {
        if (user) fetchMyPackages();
    }, [user]);

    const fetchMyPackages = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/packages/user/${user.id}`);
            setMyPackages(res.data);
        } catch (e) { console.error(e); }
    };

    const handleTrack = async (e) => {
        e.preventDefault();
        if (!trackingId) return;
        setLoading(true);
        try {
            const res = await axios.post('http://localhost:5000/api/packages/track', {
                trackingNumber: trackingId,
                userId: user.id
            });
            setPackageData(res.data);
            fetchMyPackages(); // Refresh list
        } catch (err) {
            alert("Tracking failed or invalid number");
        }
        setLoading(false);
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-10 text-white shadow-2xl mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl opacity-50"></div>
                <h2 className="text-3xl font-black mb-6 flex items-center gap-3 relative z-10">
                    <Package className="h-8 w-8" /> Track Consignment
                </h2>

                <form onSubmit={handleTrack} className="flex gap-4 relative z-10">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={trackingId}
                            onChange={(e) => setTrackingId(e.target.value)}
                            placeholder="Enter Tracking ID (e.g., SP123456IN)"
                            className="w-full p-4 pl-12 rounded-2xl text-gray-900 font-mono font-bold border-none focus:ring-4 focus:ring-blue-300 outline-none shadow-xl"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-yellow-400 text-blue-900 px-8 py-4 rounded-2xl font-bold shadow-xl hover:bg-yellow-300 transition-all transform hover:scale-105"
                    >
                        {loading ? 'Tracking...' : 'Track Now'}
                    </button>
                </form>
            </div>

            {packageData && (
                <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-8 mb-8 animate-fade-in-up">
                    <div className="flex justify-between items-start border-b-2 border-gray-100 pb-6 mb-6">
                        <div>
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 inline-block">
                                {packageData.status}
                            </span>
                            <h3 className="text-4xl font-black text-gray-800 tracking-tight">{packageData.trackingNumber}</h3>
                            <p className="text-gray-500 mt-1 flex items-center gap-2">
                                <Clock className="h-4 w-4" /> Est. Delivery:
                                <span className="font-bold text-gray-700">{new Date(packageData.estimatedDelivery).toDateString()}</span>
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="bg-green-50 p-3 rounded-2xl inline-flex mb-2">
                                <Truck className="h-8 w-8 text-green-600" />
                            </div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Current Location</p>
                            <p className="font-bold text-gray-800">{packageData.currentLocation}</p>
                        </div>
                    </div>

                    <div className="relative pl-8 border-l-2 border-dashed border-gray-200 space-y-8">
                        {packageData.history.map((h, i) => (
                            <div key={i} className="relative">
                                <div className="absolute -left-[41px] w-6 h-6 rounded-full bg-blue-500 border-4 border-white shadow-md"></div>
                                <div>
                                    <h4 className="font-bold text-gray-800 text-lg">{h.status}</h4>
                                    <p className="text-sm text-gray-500 mb-1">{h.location}</p>
                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{new Date(h.time).toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myPackages.map(pkg => (
                    <div
                        key={pkg.id}
                        onClick={() => setPackageData(pkg)}
                        className="bg-white p-6 rounded-2xl border border-gray-100 shadow-lg hover:shadow-2xl hover:border-blue-300 transition-all cursor-pointer group"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <span className="font-mono font-bold text-gray-600 group-hover:text-blue-600 transition-colors">{pkg.trackingNumber}</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${pkg.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{pkg.status}</span>
                        </div>
                        <p className="text-sm text-gray-500">Last update: {pkg.currentLocation}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PackageTracker;
