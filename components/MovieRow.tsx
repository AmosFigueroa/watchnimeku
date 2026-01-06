import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, PlayCircle } from 'lucide-react';
import { Movie } from '../types';

interface MovieRowProps {
  title: string;
  movies: Movie[];
  onMovieSelect: (movie: Movie) => void;
}

const MovieRow: React.FC<MovieRowProps> = ({ title, movies, onMovieSelect }) => {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="px-4 md:px-12 py-8 space-y-4 group">
      <div className="flex items-end gap-3 mb-2">
        <h2 className="text-xl md:text-2xl font-bold text-white cursor-pointer transition">
          {title}
        </h2>
        <span className="text-sm font-semibold text-[#1ce783] cursor-pointer hover:underline mb-1 hidden group-hover:inline-block transition-opacity">
          View All
        </span>
      </div>
      
      <div className="relative group/row">
        {/* Left Arrow */}
        <div 
          className="absolute top-0 bottom-0 left-0 z-40 bg-gradient-to-r from-black/80 to-transparent w-16 hidden group-hover/row:flex items-center justify-start pl-2 cursor-pointer transition opacity-0 group-hover/row:opacity-100"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="text-white w-10 h-10 hover:scale-125 transition-transform" />
        </div>

        {/* Scroll Container */}
        <div 
          ref={rowRef}
          className="flex items-center space-x-4 overflow-x-scroll hide-scroll scroll-smooth py-4"
        >
          {movies.map((movie) => (
            <div 
              key={movie.id}
              className="relative min-w-[160px] md:min-w-[220px] h-[240px] md:h-[320px] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(28,231,131,0.3)] group/card bg-[#1a1c21]"
              onClick={() => onMovieSelect(movie)}
            >
              <img 
                src={movie.thumbnailUrl} 
                alt={movie.title} 
                className="w-full h-full object-cover transition duration-500"
              />
              
              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80"></div>
              
              {/* Content */}
              <div className="absolute bottom-0 left-0 p-4 w-full">
                <h3 className="text-white font-bold truncate text-base leading-tight mb-1">{movie.title}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-300">
                   <span className="text-[#1ce783] font-bold">{movie.year}</span>
                   <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                   <span className="uppercase">{movie.type}</span>
                   {movie.subCount && (
                     <span className="bg-white/20 px-1 rounded text-[10px] ml-auto">CC: {movie.subCount}</span>
                   )}
                </div>
              </div>

               {/* Hover Overlay Icon */}
               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition duration-300 bg-black/40 backdrop-blur-[2px]">
                  <PlayCircle className="text-[#1ce783] w-14 h-14 drop-shadow-lg scale-90 group-hover/card:scale-100 transition-transform" />
               </div>
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        <div 
          className="absolute top-0 bottom-0 right-0 z-40 bg-gradient-to-l from-black/80 to-transparent w-16 hidden group-hover/row:flex items-center justify-end pr-2 cursor-pointer transition opacity-0 group-hover/row:opacity-100"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="text-white w-10 h-10 hover:scale-125 transition-transform" />
        </div>
      </div>
    </div>
  );
};

export default MovieRow;