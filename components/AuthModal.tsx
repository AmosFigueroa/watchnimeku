import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
        if (isLogin) {
            const data = await api.login(email, password);
            login(data.token, data.user);
            onClose();
        } else {
            await api.register(username, email, password);
            // Auto login after register
            const data = await api.login(email, password);
            login(data.token, data.user);
            onClose();
        }
    } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan. Coba lagi.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#1a1c21] w-full max-w-md p-8 rounded-2xl border border-gray-800 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">{isLogin ? 'Selamat Datang Kembali' : 'Buat Akun Baru'}</h2>
            <p className="text-gray-400 text-sm">Masuk untuk menyimpan daftar tontonan dan komentar.</p>
        </div>

        {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-200 text-sm p-3 rounded mb-4 text-center">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
                <div className="relative">
                    <UserIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                    <input 
                        type="text" 
                        placeholder="Username" 
                        className="w-full bg-[#0b0c0f] border border-gray-700 rounded-lg py-3 pl-10 text-white focus:border-[#1ce783] focus:outline-none transition"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required={!isLogin}
                    />
                </div>
            )}
            <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                <input 
                    type="email" 
                    placeholder="Email" 
                    className="w-full bg-[#0b0c0f] border border-gray-700 rounded-lg py-3 pl-10 text-white focus:border-[#1ce783] focus:outline-none transition"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>
            <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                <input 
                    type="password" 
                    placeholder="Password" 
                    className="w-full bg-[#0b0c0f] border border-gray-700 rounded-lg py-3 pl-10 text-white focus:border-[#1ce783] focus:outline-none transition"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#1ce783] hover:bg-[#15bd6b] text-black font-bold py-3 rounded-lg transition transform active:scale-95 disabled:opacity-50"
            >
                {loading ? 'Memproses...' : (isLogin ? 'Masuk' : 'Daftar')}
            </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
            {isLogin ? "Belum punya akun? " : "Sudah punya akun? "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-[#1ce783] hover:underline font-bold">
                {isLogin ? 'Daftar disini' : 'Masuk disini'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
