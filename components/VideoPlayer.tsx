import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Maximize, Minimize, Volume2, VolumeX, 
  Play, Pause, SkipForward, SkipBack, Layers, X, Clock,
  Loader2
} from 'lucide-react';
import { Movie, Episode } from '../types';
import { getAnimeDetail, getEpisodeStream } from '../services/movieService';

interface VideoPlayerProps {
  movie: Movie;
  onClose: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ movie: initialMovie, onClose }) => {
  const [movie, setMovie] = useState<Movie>(initialMovie);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [isLoadingStream, setIsLoadingStream] = useState(false);
  
  const [showControls, setShowControls] = useState(true);
  const [showEpisodeList, setShowEpisodeList] = useState(false);
  
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [streamUrl, setStreamUrl] = useState<string>("");
  
  const hideControlsTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  // 1. Fetch full details (episodes) if not present
  useEffect(() => {
    const fetchDetails = async () => {
      if (!initialMovie.slug) {
          setIsLoadingDetails(false);
          return;
      }
      
      // If we already have episodes, use them (rare in this flow)
      if (initialMovie.episodes && initialMovie.episodes.length > 0) {
          setMovie(initialMovie);
          setCurrentEpisode(initialMovie.episodes[0]);
          setIsLoadingDetails(false);
          return;
      }

      setIsLoadingDetails(true);
      const fullDetails = await getAnimeDetail(initialMovie.slug);
      if (fullDetails) {
          setMovie(fullDetails);
          if (fullDetails.episodes && fullDetails.episodes.length > 0) {
              setCurrentEpisode(fullDetails.episodes[0]);
          }
      }
      setIsLoadingDetails(false);
    };

    fetchDetails();
  }, [initialMovie]);

  // 2. Fetch Stream URL when currentEpisode changes
  useEffect(() => {
    const fetchStream = async () => {
        if (!currentEpisode || !currentEpisode.slug) return;
        
        setIsLoadingStream(true);
        const url = await getEpisodeStream(currentEpisode.slug);
        if (url) {
            setStreamUrl(url);
        }
        setIsLoadingStream(false);
    };

    fetchStream();
  }, [currentEpisode]);


  // Auto-hide controls
  useEffect(() => {
    const resetTimer = () => {
      setShowControls(true);
      if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
      if (!showEpisodeList) {
        hideControlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
      }
    };
    
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('click', resetTimer);
    resetTimer();

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('click', resetTimer);
      if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
    };
  }, [showEpisodeList]);

  const handleEpisodeSelect = (episode: Episode) => {
    setCurrentEpisode(episode);
    setStreamUrl(""); // Clear old stream
  };

  const currentTitle = currentEpisode ? `${movie.title} - Ep ${currentEpisode.number}` : movie.title;

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col justify-center overflow-hidden font-sans">
      {/* Top Header - Visible on hover */}
      <div className={`absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-start transition-transform duration-300 ${showControls ? 'translate-y-0' : '-translate-y-full'}`}>
        <button 
          onClick={onClose} 
          className="bg-black/40 backdrop-blur-md p-3 rounded-full hover:bg-white/20 text-white transition-all group"
        >
          <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
        </button>
        
        <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg max-w-lg truncate">
             <h2 className="text-white font-bold text-sm md:text-lg tracking-wide">{currentTitle}</h2>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative w-full h-full bg-black flex items-center justify-center">
        
        {/* Loading States */}
        {(isLoadingDetails || isLoadingStream) && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 text-white">
                <Loader2 className="w-12 h-12 animate-spin text-[#1ce783] mb-4" />
                <p className="font-medium animate-pulse">
                    {isLoadingDetails ? "Fetching Anime Details..." : "Loading Stream Source..."}
                </p>
            </div>
        )}

        {/* Video Player (Iframe for API streams) */}
        {!isLoadingStream && streamUrl ? (
             <iframe
                src={streamUrl}
                className="w-full h-full border-none"
                allowFullScreen
                allow="autoplay; encrypted-media"
                title="Video Player"
             />
        ) : (
             !isLoadingDetails && !isLoadingStream && (
                 <div className="text-gray-500">Select an episode to play</div>
             )
        )}
      </div>

      {/* Episode Sidebar Drawer */}
      <div className={`absolute top-0 right-0 bottom-0 w-80 md:w-96 bg-[#1a1c21]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${showEpisodeList ? 'translate-x-0' : 'translate-x-full'}`}>
         <div className="p-5 flex items-center justify-between border-b border-white/10">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#1ce783]" />
                Episodes
            </h3>
            <button onClick={() => setShowEpisodeList(false)} className="text-gray-400 hover:text-white transition">
                <X className="w-6 h-6" />
            </button>
         </div>
         
         <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {movie.episodes?.map((ep) => (
                <div 
                    key={ep.id} 
                    onClick={() => handleEpisodeSelect(ep)}
                    className={`flex gap-3 p-2 rounded-lg cursor-pointer transition-all group ${currentEpisode?.id === ep.id ? 'bg-[#1ce783]/20 border border-[#1ce783]/50' : 'hover:bg-white/5 border border-transparent'}`}
                >
                    <div className="relative w-16 h-12 flex-shrink-0 rounded overflow-hidden bg-black flex items-center justify-center">
                        {/* No episode thumb in this API, use movie thumb */}
                        <img src={movie.thumbnailUrl} alt={ep.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition" />
                         <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-white drop-shadow-md">
                            {ep.number}
                         </div>
                    </div>
                    <div className="flex flex-col justify-center min-w-0">
                        <h4 className={`text-sm font-medium truncate ${currentEpisode?.id === ep.id ? 'text-white' : 'text-gray-200'}`}>{ep.title}</h4>
                        <span className="text-[10px] text-gray-500">{ep.description}</span>
                    </div>
                </div>
            ))}
         </div>
      </div>

      {/* Bottom Controls (Simple for Iframe) */}
      <div className={`absolute bottom-0 left-0 right-0 z-40 px-6 py-6 pointer-events-none transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex items-center justify-end text-white pointer-events-auto">
          <div className="flex items-center gap-4">
            {/* Episode List Toggle Button */}
            {movie.episodes && movie.episodes.length > 0 && (
                <button 
                    onClick={() => setShowEpisodeList(!showEpisodeList)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium text-sm transition-all ${showEpisodeList ? 'bg-[#1ce783] text-black' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                >
                    <Layers className="w-4 h-4" />
                    <span className="hidden md:inline">Episodes</span>
                    <span className="md:hidden">Eps</span>
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;