import React, { useState } from 'react';
import axios from 'axios';
import { Send, CheckCircle, Mail, AlertTriangle } from 'lucide-react';

const UserPortal = () => {
    const [complaint, setComplaint] = useState('');
    const [submitted, setSubmitted] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post('http://localhost:5000/api/complaint', {
                text: complaint,
                user: "Citizen User"
            });
            setSubmitted(res.data);
            setComplaint('');
        } catch (err) {
            console.error(err);
            setError("Failed to submit complaint. Please try again. (Server might be down)");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-6 flex items-center justify-center font-sans">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="text-center mb-8">
                    <div className="bg-red-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-200">
                        <Mail className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">SmartPost <span className="text-red-600">AI</span></h2>
                    <p className="text-gray-500 text-sm mt-1">Smart Grievance Resolution Portal</p>
                </div>

                {submitted ? (
                    <div className="bg-green-50 border border-green-100 rounded-xl p-6 text-center animate-fade-in-up">
                        <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-green-100 mb-4">
                            <CheckCircle className="h-7 w-7 text-green-600" />
                        </div>
                        <h3 className="text-lg font-bold text-green-900">Complaint Lodged!</h3>
                        <div className="text-sm text-green-800 mt-2 bg-white/50 p-3 rounded-lg border border-green-100">
                            <p><strong>Ticket ID:</strong> #{submitted.id}</p>
                            <p className="mt-1">
                                Our AI Agent has marked this as: <br />
                                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold uppercase ${submitted.priority === 'Critical' ? 'bg-red-200 text-red-800' :
                                        submitted.priority === 'High' ? 'bg-orange-200 text-orange-800' : 'bg-blue-200 text-blue-800'
                                    }`}>
                                    {submitted.priority} Priority
                                </span>
                            </p>
                        </div>
                        <button
                            onClick={() => setSubmitted(null)}
                            className="mt-6 w-full py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                        >
                            Submit Another Grievance
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">Describe Your Grievance</label>
                            <textarea
                                required
                                value={complaint}
                                onChange={(e) => setComplaint(e.target.value)}
                                rows={5}
                                className="w-full rounded-xl border-gray-200 bg-gray-50 p-4 text-gray-700 placeholder-gray-400 focus:border-red-500 focus:ring-red-500 focus:bg-white transition-all outline-none resize-none shadow-sm"
                                placeholder="E.g., My package ID #12345 hasn't moved in 3 days..."
                            />
                        </div>

                        {error && (
                            <div className="text-red-600 text-sm flex items-center gap-2 bg-red-50 p-2 rounded">
                                <AlertTriangle className="h-4 w-4" /> {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-red-200 text-sm font-bold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                                    Processing with AI...
                                </div>
                            ) : (
                                <span className="flex items-center">Generate Ticket <Send className="ml-2 h-4 w-4" /></span>
                            )}
                        </button>

                        <p className="text-xs text-center text-gray-400">
                            Powered by SmartPost Neural Engine v1.0
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
};

export default UserPortal;
