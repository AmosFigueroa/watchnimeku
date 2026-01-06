import React from 'react';
import { Mic, Captions } from 'lucide-react';
import { Movie } from '../types';

interface ListColumnProps {
  title: string;
  movies: Movie[];
  onPlay: (movie: Movie) => void;
}

const ListColumn: React.FC<ListColumnProps> = ({ title, movies, onPlay }) => {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-[#facc15] font-bold text-xl mb-2">{title}</h3>
      <div className="flex flex-col gap-4">
        {movies.map((movie) => (
          <div 
            key={movie.id} 
            className="flex gap-4 group cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors"
            onClick={() => onPlay(movie)}
          >
            {/* Thumbnail */}
            <div className="relative w-16 h-24 flex-shrink-0 rounded-md overflow-hidden bg-gray-800">
              <img 
                src={movie.thumbnailUrl} 
                alt={movie.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                loading="lazy"
              />
            </div>

            {/* Content */}
            <div className="flex flex-col justify-center flex-1 min-w-0">
              <h4 className="text-white font-bold text-sm md:text-base truncate group-hover:text-[#1ce783] transition-colors">
                {movie.title}
              </h4>
              
              <div className="flex items-center gap-2 mt-2 text-xs">
                {movie.rating !== "N/A" && (
                    <div className="flex items-center gap-1 bg-white/10 px-1.5 py-0.5 rounded text-gray-300">
                        <span>★ {movie.rating}</span>
                    </div>
                )}
                
                {/* Type Dot */}
                <div className="flex items-center gap-1 text-gray-400 ml-1">
                   <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                   <span className="truncate">{movie.duration}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface FeaturedListsProps {
  topAiring: Movie[];
  mostPopular: Movie[];
  mostFavorite: Movie[];
  latestCompleted: Movie[];
  onPlay: (movie: Movie) => void;
}

const FeaturedLists: React.FC<FeaturedListsProps> = ({ 
  topAiring, 
  mostPopular, 
  mostFavorite, 
  latestCompleted,
  onPlay 
}) => {
  return (
    <div className="px-4 md:px-12 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        <div>
           <ListColumn title="Top Airing" movies={topAiring} onPlay={onPlay} />
        </div>
        <div>
           <ListColumn title="Most Popular" movies={mostPopular} onPlay={onPlay} />
        </div>
        <div>
           <ListColumn title="Most Favorite" movies={mostFavorite} onPlay={onPlay} />
        </div>
        <div>
           <ListColumn title="Latest Completed" movies={latestCompleted} onPlay={onPlay} />
        </div>
      </div>
    </div>
  );
};

export default FeaturedLists;