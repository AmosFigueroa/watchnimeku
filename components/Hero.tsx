import React from 'react';
import { Play, Plus, Info } from 'lucide-react';
import { Movie } from '../types';

interface HeroProps {
  movie: Movie;
  onPlay: (movie: Movie) => void;
}

const Hero: React.FC<HeroProps> = ({ movie, onPlay }) => {
  return (
    <div className="relative h-[80vh] w-full text-white">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={movie.coverUrl} 
          alt={movie.title} 
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0c0f] via-[#0b0c0f]/60 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c0f] via-transparent to-transparent"></div>
      </div>

      {/* Content */}
      <div className="absolute top-[30%] left-4 md:left-12 max-w-xl space-y-4">
        <div className="flex items-center gap-3 text-xs md:text-sm font-semibold uppercase tracking-wider text-[#1ce783]">
            <span className="bg-white/10 px-2 py-1 rounded">{movie.type}</span>
            <span>{movie.year}</span>
            <span>{movie.rating}</span>
            <span>{movie.duration}</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold leading-none drop-shadow-lg">
          {movie.title}
        </h1>
        
        <p className="text-gray-300 text-sm md:text-lg line-clamp-3 drop-shadow-md">
          {movie.description}
        </p>
        
        <div className="flex items-center gap-4 pt-4">
          <button 
            onClick={() => onPlay(movie)}
            className="flex items-center gap-2 bg-white text-black px-6 md:px-8 py-3 rounded hover:bg-[#1ce783] hover:text-black transition-all font-bold text-lg"
          >
            <Play className="fill-black w-5 h-5" />
            Watch Now
          </button>
          
          <button className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white px-4 py-3 rounded hover:bg-white/20 transition font-semibold">
            <Plus className="w-5 h-5" />
            My List
          </button>

           <button className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white px-4 py-3 rounded hover:bg-white/20 transition font-semibold">
            <Info className="w-5 h-5" />
            Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default Hero;