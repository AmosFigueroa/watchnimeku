import React, { useState, useEffect } from 'react';
import { Search, Bell, User as UserIcon, LogOut, Heart, Globe, Youtube, ChevronDown, Check } from 'lucide-react';
import AuthModal from './AuthModal';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface NavbarProps {
  onSearch: (query: string) => void;
  onNavigate: (page: string) => void;
  activeCategory: string;
  selectedSource: string;
  onSourceChange: (source: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onSearch, onNavigate, activeCategory, selectedSource, onSourceChange }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSourceMenu, setShowSourceMenu] = useState(false);
  
  const { user, isAuthenticated, logout, notifications } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchValue);
  };

  const navItems = [
    { id: 'home', label: t.home },
    { id: 'series', label: t.tvSeries },
    { id: 'movies', label: t.movies },
    { id: 'anime', label: t.anime },
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'id' ? 'en' : 'id');
  };

  const sources = [
    { id: 'ALL', label: 'Semua Channel' },
    { id: 'MUSE', label: 'Muse Indonesia' },
    { id: 'ANIONE', label: 'Ani-One Asia' },
    { id: 'TROPICS', label: 'Tropics Anime' },
  ];

  const getSourceLabel = () => {
    return sources.find(s => s.id === selectedSource)?.label || 'Channels';
  };

  return (
    <>
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-[#0b0c0f] shadow-lg' : 'bg-gradient-to-b from-black/80 to-transparent'}`}>
      <div className="px-4 md:px-12 py-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-8">
          <div 
            className="text-[#1ce783] text-3xl font-black tracking-tighter cursor-pointer uppercase"
            onClick={() => onNavigate('home')}
          >
            HULU<span className="text-white">INDO</span>
          </div>
          <ul className="hidden md:flex flex-row gap-6 font-medium text-sm">
            {navItems.map((item) => (
              <li 
                key={item.id}
                className={`cursor-pointer transition hover:text-white ${activeCategory === item.id ? 'text-white font-bold border-b-2 border-[#1ce783] pb-1' : 'text-gray-300'}`}
                onClick={() => onNavigate(item.id)}
              >
                {item.label}
              </li>
            ))}
            {isAuthenticated && (
                <li 
                className={`cursor-pointer transition hover:text-white ${activeCategory === 'collection' ? 'text-white font-bold border-b-2 border-[#1ce783] pb-1' : 'text-gray-300'}`}
                onClick={() => onNavigate('collection')}
                >
                    {t.myList}
                </li>
            )}
          </ul>
        </div>

        <div className="flex items-center gap-4">
          {/* Source/Channel Selector */}
          <div className="relative">
             <button 
                onClick={() => setShowSourceMenu(!showSourceMenu)}
                className="flex items-center gap-2 text-gray-300 hover:text-white text-xs font-bold border border-gray-600 px-3 py-1.5 rounded-full transition bg-black/20 hover:bg-white/10"
             >
                <Youtube className="w-4 h-4 text-red-500" />
                <span className="hidden lg:inline">{getSourceLabel()}</span>
                <ChevronDown className="w-3 h-3" />
             </button>

             {showSourceMenu && (
                 <div className="absolute right-0 top-10 w-48 bg-[#1a1c21] border border-gray-700 rounded-lg shadow-xl p-1 flex flex-col z-50 animate-in fade-in zoom-in-95 duration-100">
                    {sources.map(source => (
                        <button
                            key={source.id}
                            onClick={() => {
                                onSourceChange(source.id);
                                setShowSourceMenu(false);
                            }}
                            className="flex items-center justify-between px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white rounded transition"
                        >
                            <span>{source.label}</span>
                            {selectedSource === source.id && <Check className="w-3 h-3 text-[#1ce783]" />}
                        </button>
                    ))}
                 </div>
             )}
          </div>

          {/* Language Toggler */}
          <button 
            onClick={toggleLanguage} 
            className="flex items-center gap-1 text-gray-300 hover:text-white text-xs font-bold border border-gray-600 px-2 py-1.5 rounded-full transition"
          >
            <Globe className="w-3 h-3" />
            {language.toUpperCase()}
          </button>

          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center bg-gray-800/50 rounded-full px-3 py-1 border border-transparent focus-within:border-gray-500 transition">
             <Search className="w-4 h-4 text-gray-400" />
             <input 
                type="text" 
                placeholder={t.search}
                className="bg-transparent border-none focus:outline-none text-white text-sm px-2 w-32 focus:w-48 transition-all"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
             />
          </form>
          
          <Search className="md:hidden w-6 h-6 text-gray-200" />
          
          {/* Notifications */}
          <div className="relative group">
            <Bell className="w-5 h-5 text-gray-300 hover:text-white cursor-pointer" />
            {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
            <div className="absolute right-0 top-8 w-64 bg-[#1a1c21] border border-gray-700 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition p-4 hidden md:block">
                <h4 className="text-white font-bold mb-2 text-sm border-b border-gray-700 pb-1">Notifikasi</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                    {notifications.length > 0 ? notifications.map(n => (
                        <div key={n._id} className="text-xs text-gray-300 bg-black/30 p-2 rounded">
                            {n.message}
                        </div>
                    )) : <div className="text-xs text-gray-500">Kosong</div>}
                </div>
            </div>
          </div>
          
          {/* User Auth */}
          {isAuthenticated ? (
             <div className="relative">
                <div 
                    className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-600 to-green-400 flex items-center justify-center text-white font-bold cursor-pointer hover:scale-105 transition shadow-[0_0_10px_#1ce783]"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                >
                    {user?.username.charAt(0).toUpperCase()}
                </div>
                
                {showUserMenu && (
                    <div className="absolute right-0 top-10 w-48 bg-[#1a1c21] border border-gray-700 rounded-lg shadow-xl p-2 flex flex-col gap-1">
                        <div className="px-3 py-2 border-b border-gray-700 mb-1">
                            <p className="text-white font-bold text-sm truncate">{user?.username}</p>
                            <p className="text-gray-500 text-xs truncate">{user?.email}</p>
                        </div>
                        <button onClick={() => onNavigate('collection')} className="text-left px-3 py-2 text-gray-300 hover:bg-white/10 hover:text-white rounded text-sm flex items-center gap-2">
                            <Heart className="w-4 h-4" /> {t.myList}
                        </button>
                        <button onClick={logout} className="text-left px-3 py-2 text-red-400 hover:bg-white/10 rounded text-sm flex items-center gap-2">
                            <LogOut className="w-4 h-4" /> {t.logout}
                        </button>
                    </div>
                )}
             </div>
          ) : (
             <button 
                onClick={() => setShowAuthModal(true)}
                className="bg-[#1ce783] text-black text-sm font-bold px-4 py-2 rounded hover:bg-[#15bd6b] transition"
             >
                {t.login}
             </button>
          )}
        </div>
      </div>
    </nav>
    {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </>
  );
};

export default Navbar;