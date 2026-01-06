import React, { useState, useEffect } from 'react';
import { Play, Plus, Info } from 'lucide-react';
import { Movie } from '../types';

interface HeroProps {
  movies: Movie[];
  onPlay: (movie: Movie) => void;
}

const Hero: React.FC<HeroProps> = ({ movies, onPlay }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate every 6 seconds
  useEffect(() => {
    if (movies.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [movies]);

  if (!movies || movies.length === 0) return null;

  return (
    <div className="relative h-[80vh] md:h-[85vh] w-full text-white overflow-hidden group">
      
      {/* Background Layers */}
      {movies.map((movie, index) => (
        <div 
          key={movie.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          <img 
            src={movie.coverUrl || movie.thumbnailUrl} 
            alt={movie.title} 
            className="w-full h-full object-cover object-center transform scale-105 group-hover:scale-100 transition-transform duration-[10s]"
          />
          {/* Gradient Overlays */}
          {/* Right Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b0c0f] via-[#0b0c0f]/40 to-transparent"></div>
          
          {/* Bottom Gradient - Made stronger/taller for better separation */}
          <div className="absolute bottom-0 left-0 right-0 h-[400px] bg-gradient-to-t from-[#0b0c0f] via-[#0b0c0f]/90 to-transparent"></div>
        </div>
      ))}

      {/* Content Layers */}
      {movies.map((movie, index) => (
        <div 
            key={`content-${movie.id}`}
            className={`absolute top-0 left-0 w-full h-full flex flex-col justify-center px-6 md:px-12 z-20 transition-all duration-700 ${index === currentIndex ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-8 pointer-events-none'}`}
        >
          <div className="max-w-2xl space-y-4 mt-24 md:mt-12"> 
            {/* Metadata Tags */}
            <div className="flex items-center gap-3 text-xs md:text-sm font-semibold uppercase tracking-wider text-[#1ce783]">
                <span className="bg-white/10 backdrop-blur-md px-2 py-1 rounded border border-white/5">{movie.type}</span>
                <span className="hidden md:inline">{movie.year}</span>
                <span className="text-[#facc15]">{movie.rating !== 'N/A' ? `★ ${movie.rating}` : 'Trending'}</span>
                <span>{movie.duration}</span>
            </div>
            
            {/* Title */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight drop-shadow-2xl line-clamp-2 md:line-clamp-3">
              {movie.title}
            </h1>
            
            {/* Description */}
            <p className="text-gray-200 text-sm md:text-lg line-clamp-3 max-w-xl drop-shadow-md leading-relaxed">
              {movie.description}
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-6">
              <button 
                onClick={() => onPlay(movie)}
                className="flex items-center gap-2 bg-white text-black px-6 md:px-8 py-3 rounded hover:bg-[#1ce783] hover:text-black transition-all font-bold text-lg shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(28,231,131,0.5)] transform hover:scale-105"
              >
                <Play className="fill-black w-5 h-5" />
                Mulai Nonton
              </button>
              
              <button className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white px-4 py-3 rounded hover:bg-white/20 transition font-semibold hover:border-white">
                <Plus className="w-5 h-5" />
                <span className="hidden md:inline">Daftar Saya</span>
              </button>

               <button className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white px-4 py-3 rounded hover:bg-white/20 transition font-semibold hover:border-white">
                <Info className="w-5 h-5" />
                <span className="hidden md:inline">Detail</span>
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Carousel Indicators - Moved up slightly to not overlap with next section */}
      <div className="absolute bottom-16 right-6 md:right-12 z-30 flex gap-3">
        {movies.map((_, index) => (
          <button 
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-1.5 rounded-full transition-all duration-500 ${index === currentIndex ? 'w-8 bg-[#1ce783] shadow-[0_0_10px_#1ce783]' : 'w-2 bg-white/30 hover:bg-white/80'}`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

    </div>
  );
};

export default Hero;