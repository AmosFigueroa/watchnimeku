import React, { useEffect, useState } from 'react';
import { X, Play, Plus, Check, Calendar, Clock, Star } from 'lucide-react';
import { Movie } from '../types';
import { getAnimeDetail } from '../services/movieService';
import CommentsSection from './CommentsSection';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

interface MovieDetailModalProps {
  movie: Movie;
  onClose: () => void;
  onPlay: (movie: Movie) => void;
}

const MovieDetailModal: React.FC<MovieDetailModalProps> = ({ movie: initialMovie, onClose, onPlay }) => {
  const [movie, setMovie] = useState<Movie>(initialMovie);
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated, updateWatchlist } = useAuth();
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const { t } = useLanguage();

  // Check if movie is in user's watchlist
  useEffect(() => {
      if (user && movie) {
          const exists = user.watchlist.some(w => w.slug === (movie.slug || movie.id.toString()));
          setIsInWatchlist(exists);
      }
  }, [user, movie]);

  useEffect(() => {
    const loadDetails = async () => {
      // Jikan needs fetching detailed info for better resolution images/episodes
      if (initialMovie.id) {
        setLoading(true);
        const details = await getAnimeDetail(initialMovie.id.toString());
        if (details) {
          setMovie(prev => ({...prev, ...details}));
        }
        setLoading(false);
      }
    };
    loadDetails();
  }, [initialMovie]);

  const handleToggleList = async () => {
      if (!isAuthenticated) {
          alert("Silakan login terlebih dahulu.");
          return;
      }

      const slug = movie.slug || movie.id.toString();
      if (isInWatchlist) {
          await api.removeFromWatchlist(slug);
          setIsInWatchlist(false);
      } else {
          await api.addToWatchlist(movie);
          setIsInWatchlist(true);
      }
      updateWatchlist();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      <div className="relative bg-[#18181b] w-full max-w-4xl max-h-full rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 border border-gray-800">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-black/50 p-2 rounded-full hover:bg-white/20 transition text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Hero Header */}
          <div className="relative h-[300px] md:h-[400px] w-full">
            <div className="absolute inset-0">
               <img 
                 src={movie.coverUrl || movie.thumbnailUrl} 
                 alt={movie.title} 
                 className="w-full h-full object-cover"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-[#18181b] via-[#18181b]/20 to-transparent"></div>
            </div>

            <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 space-y-4">
              <h2 className="text-3xl md:text-5xl font-black text-white drop-shadow-xl leading-tight">
                {movie.title}
              </h2>
              
              <div className="flex flex-wrap items-center gap-4 text-sm md:text-base font-semibold text-gray-200">
                <span className="text-[#1ce783]">{movie.rating !== 'N/A' ? `${movie.rating} Score` : 'Recommended'}</span>
                <span className="text-gray-400">{movie.year}</span>
                <span className="border border-gray-600 px-2 py-0.5 rounded text-xs uppercase">{movie.type}</span>
                <span>{movie.duration}</span>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <button 
                  onClick={() => onPlay(movie)}
                  className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded hover:bg-[#1ce783] hover:text-black transition font-bold text-lg shadow-lg"
                >
                  <Play className="fill-black w-6 h-6" />
                  {t.play}
                </button>
                <button 
                    onClick={handleToggleList}
                    className={`p-3 border-2 rounded-full transition text-white ${isInWatchlist ? 'bg-[#1ce783] border-[#1ce783] text-black' : 'border-gray-500 hover:border-white hover:bg-white/10'}`}
                >
                  {isInWatchlist ? <Check className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 md:p-8">
            <div className="md:col-span-2 space-y-8">
               <div className="space-y-6">
                    <p className="text-gray-300 text-lg leading-relaxed">
                        {movie.description || 'No description available for this title.'}
                    </p>

                    <div className="border-t border-gray-800 pt-6">
                        <h3 className="text-xl font-bold text-white mb-4">{t.episodes}</h3>
                        {loading ? (
                        <div className="text-gray-500 animate-pulse">{t.loading}</div>
                        ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {movie.episodes && movie.episodes.length > 0 ? (
                                movie.episodes.map((ep) => (
                                <div 
                                    key={ep.id} 
                                    onClick={() => onPlay({...movie, episodes: movie.episodes})}
                                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition group"
                                >
                                    <div className="text-2xl font-bold text-gray-500 w-8">{ep.number}</div>
                                    <div className="relative w-32 h-20 bg-gray-800 rounded overflow-hidden flex-shrink-0">
                                        <img src={movie.thumbnailUrl} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition" alt="" />
                                        <Play className="absolute inset-0 m-auto text-white w-8 h-8 opacity-0 group-hover:opacity-100 transition transform scale-75 group-hover:scale-100" />
                                    </div>
                                    <div>
                                    <h4 className="text-white font-bold text-sm md:text-base">{ep.title || `Episode ${ep.number}`}</h4>
                                    <p className="text-gray-400 text-xs md:text-sm line-clamp-2 mt-1">{ep.description || movie.title}</p>
                                    </div>
                                    <div className="ml-auto text-xs text-gray-500">{ep.duration || '24m'}</div>
                                </div>
                                ))
                            ) : (
                                <div className="bg-gray-800/50 p-4 rounded text-center text-gray-400">
                                No episodes list available. Click Play to watch trailer.
                                </div>
                            )}
                        </div>
                        )}
                    </div>
               </div>
               
               {/* Comments Section */}
               <CommentsSection movieSlug={movie.slug || movie.id.toString()} />
            </div>

            <div className="space-y-6 text-sm">
               <div>
                 <span className="text-gray-500 block mb-1">{t.genre}:</span>
                 <div className="flex flex-wrap gap-2">
                   {movie.genre.map(g => (
                     <span key={g} className="text-white hover:text-[#1ce783] cursor-pointer transition">{g}</span>
                   ))}
                 </div>
               </div>
               <div>
                 <span className="text-gray-500 block mb-1">{t.year}:</span>
                 <span className="text-white">{movie.year}</span>
               </div>
               <div>
                 <span className="text-gray-500 block mb-1">{t.duration}:</span>
                 <span className="text-white">{movie.totalEpisodes ? `${movie.totalEpisodes} Eps` : movie.duration}</span>
               </div>
               <div>
                 <span className="text-gray-500 block mb-1">{t.status}:</span>
                 <span className="text-[#1ce783]">{movie.status || 'Released'}</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailModal;