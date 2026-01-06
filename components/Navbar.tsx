import React, { useState, useEffect } from 'react';
import { Search, Bell, User, Menu } from 'lucide-react';

interface NavbarProps {
  onSearch: (query: string) => void;
  onNavigate: (page: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onSearch, onNavigate }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchValue, setSearchValue] = useState('');

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

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-[#0b0c0f] shadow-lg' : 'bg-gradient-to-b from-black/80 to-transparent'}`}>
      <div className="px-4 md:px-12 py-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-8">
          <div 
            className="text-[#1ce783] text-3xl font-black tracking-tighter cursor-pointer uppercase"
            onClick={() => onNavigate('home')}
          >
            HULU<span className="text-white">STREAM</span>
          </div>
          <ul className="hidden md:flex flex-row gap-6 text-gray-300 font-medium text-sm">
            <li className="hover:text-white cursor-pointer transition" onClick={() => onNavigate('home')}>Home</li>
            <li className="hover:text-white cursor-pointer transition">TV Shows</li>
            <li className="hover:text-white cursor-pointer transition">Movies</li>
            <li className="hover:text-white cursor-pointer transition">Anime</li>
            <li className="hover:text-white cursor-pointer transition">My Stuff</li>
          </ul>
        </div>

        <div className="flex items-center gap-6">
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center bg-gray-800/50 rounded-full px-3 py-1 border border-transparent focus-within:border-gray-500 transition">
             <Search className="w-4 h-4 text-gray-400" />
             <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none focus:outline-none text-white text-sm px-2 w-32 focus:w-48 transition-all"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
             />
          </form>
          
          <Search className="md:hidden w-6 h-6 text-gray-200" />
          <Bell className="w-5 h-5 text-gray-300 hover:text-white cursor-pointer" />
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold cursor-pointer hover:bg-green-500 transition">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;