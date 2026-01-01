import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import UserPortal from './UserPortal';
import AdminDashboard from './AdminDashboard';
import Login from './Login';
import AdminLogin from './AdminLogin';
import UserDashboard from './UserDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/user/dashboard" element={<UserDashboard />} />
        {/* Helper route for simple complaint without login, keeping for backwards compatibility or quick demo */}
        <Route path="/quick-complaint" element={<UserPortal />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

const Home = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-600 to-red-900 text-white p-6 overflow-hidden relative">
    {/* Decorative Balls */}
    <div className="absolute top-20 left-20 w-64 h-64 bg-red-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
    <div className="absolute bottom-20 right-20 w-80 h-80 bg-orange-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>

    <div className="text-center max-w-4xl z-10">
      <div className="inline-block px-4 py-1.5 bg-white/10 rounded-full text-xs font-bold tracking-widest uppercase mb-6 backdrop-blur-md border border-white/20">
        Hackathon 2025 • Team Antigravity
      </div>
      <h1 className="text-7xl font-black mb-6 tracking-tight leading-tight">
        SmartPost <span className="text-yellow-400">AI</span>
      </h1>
      <p className="text-2xl text-red-100 mb-12 font-light max-w-2xl mx-auto">
        Revolutionizing Public Grievance Redressal with <strong className="text-white font-semibold">Generative AI</strong> and <strong className="text-white font-semibold">Real-time Analytics</strong>.
      </p>

      <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
        <Link to="/login" className="w-64 py-4 bg-white text-red-700 font-bold rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] hover:bg-gray-50 transition-all hover:scale-105 flex items-center justify-center gap-2 group">
          Citizens Login <span className="text-xl group-hover:translate-x-1 transition">→</span>
        </Link>
        <Link to="/admin" className="w-64 py-4 bg-transparent border-2 border-white/30 text-white font-bold rounded-xl hover:bg-white/10 transition-all hover:scale-105">
          Admin Dashboard
        </Link>
      </div>

      <div className="mt-16 grid grid-cols-3 gap-8 text-center text-white/60">
        <div>
          <div className="text-3xl font-bold text-white mb-1">92%</div>
          <div className="text-xs uppercase tracking-wider">Automated Resolution</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-white mb-1">&lt; 2s</div>
          <div className="text-xs uppercase tracking-wider">Response Time</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-white mb-1">24/7</div>
          <div className="text-xs uppercase tracking-wider">Availability</div>
        </div>
      </div>
    </div>
  </div>
);

export default App;
