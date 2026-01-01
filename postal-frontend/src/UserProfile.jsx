import React, { useState } from 'react';
import axios from 'axios';
import { User, MapPin, Phone, Mail, Globe, Save, Lock } from 'lucide-react';

const UserProfile = ({ user, setUser }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        pincode: user.pincode || '',
        state: user.state || '',
        language: user.language || 'English',
        avatar: user.avatar || ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 25 * 1024 * 1024) { // 25 MB Limit
                alert("File size exceeds 25MB!");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, avatar: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post('http://localhost:5000/api/auth/update-profile', formData);
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            alert("Profile Updated Successfully!");
        } catch (err) {
            alert("Update Failed");
        }
        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl border-2 border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-10 text-white flex items-center gap-8">
                <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center border-4 border-white/20 overflow-hidden">
                        {formData.avatar ? (
                            <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User className="h-10 w-10 text-white" />
                        )}
                    </div>
                    <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </label>
                </div>
                <div>
                    <h1 className="text-3xl font-bold">{user.name || 'User Profile'}</h1>
                    <p className="text-gray-400 font-mono">{user.email}</p>
                    <span className="inline-block mt-3 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/30">
                        Verified Citizen
                    </span>
                </div>
            </div>

            <form onSubmit={handleSave} className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <h3 className="font-bold text-gray-400 uppercase tracking-widest text-xs border-b pb-2">Personal Details</h3>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input name="name" value={formData.name} onChange={handleChange} className="w-full pl-10 p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-400 outline-none transition-all" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input name="phone" value={formData.phone} onChange={handleChange} className="w-full pl-10 p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-400 outline-none transition-all" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Preferred Language</label>
                        <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <select name="language" value={formData.language} onChange={handleChange} className="w-full pl-10 p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-400 outline-none transition-all appearance-none">
                                <option>English</option>
                                <option>Hindi</option>
                                <option>Telugu</option>
                                <option>Tamil</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="font-bold text-gray-400 uppercase tracking-widest text-xs border-b pb-2">Address & Location</h3>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Residential Address</label>
                        <textarea name="address" value={formData.address} onChange={handleChange} rows="3" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-400 outline-none transition-all" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">City</label>
                            <input name="city" value={formData.city} onChange={handleChange} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-400 outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Pincode</label>
                            <input name="pincode" value={formData.pincode} onChange={handleChange} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-400 outline-none transition-all" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">State</label>
                        <input name="state" value={formData.state} onChange={handleChange} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:ring-2 focus:ring-gray-400 outline-none transition-all" />
                    </div>
                </div>

                <div className="md:col-span-2 pt-6 border-t border-gray-100 flex justify-end">
                    <button type="submit" disabled={loading} className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold shadow-xl hover:bg-black transition-all flex items-center gap-2">
                        <Save className="h-5 w-5" /> Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UserProfile;
