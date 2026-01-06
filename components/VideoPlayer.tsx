import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Layers, X, Loader2, Settings, MonitorPlay
} from 'lucide-react';
import { Movie, Episode, Stream } from '../types';
import { getAnimeDetail, getEpisodeStreams, getYouTubePlaylistEpisodes } from '../services/movieService';

interface VideoPlayerProps {
  movie: Movie;
  onClose: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ movie: initialMovie, onClose }) => {
  const [movie, setMovie] = useState<Movie>(initialMovie);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  
  // Data States
  const [streams, setStreams] = useState<Stream[]>([]);
  const [currentStream, setCurrentStream] = useState<Stream | null>(null);
  
  // UI States
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [isLoadingStream, setIsLoadingStream] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const hideControlsTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  // 1. Initial Load: Get Full Anime Details (Episodes)
  useEffect(() => {
    const fetchDetails = async () => {
      // HANDLE YOUTUBE SOURCE WITH SCRAPING
      if (initialMovie.source === 'youtube') {
         setIsLoadingDetails(true);
         
         // 1. Try to scrape real episodes from the YouTube playlist to get VideoIDs
         if (initialMovie.youtubeId) {
             const realEpisodes = await getYouTubePlaylistEpisodes(initialMovie.youtubeId);
             
             if (realEpisodes.length > 0) {
                 // Success: We have real episodes with Direct Video IDs
                 const updatedMovie = { ...initialMovie, episodes: realEpisodes };
                 setMovie(updatedMovie);
                 
                 // Try to match the clicked episode number or default to first
                 const startEp = realEpisodes.find(e => e.number === (initialMovie.episodes?.[0]?.number || 1));
                 setCurrentEpisode(startEp || realEpisodes[0]);
                 setIsLoadingDetails(false);
                 return;
             }
         }

         // 2. Fallback: Use the Jikan-generated dummy episodes (Will use Search Fallback)
         setMovie(initialMovie);
         if (initialMovie.episodes && initialMovie.episodes.length > 0) {
             setCurrentEpisode(initialMovie.episodes[0]);
         }
         setIsLoadingDetails(false);
         return;
      }

      // HANDLE STANDARD SOURCES (Scrape/Jikan)
      if (!initialMovie.slug) {
          setIsLoadingDetails(false);
          return;
      }
      
      // Temporary data while fetching
      if (initialMovie.episodes && initialMovie.episodes.length > 0) {
          setMovie(initialMovie);
          setCurrentEpisode(initialMovie.episodes[0]); 
      }

      setIsLoadingDetails(true);
      const fullDetails = await getAnimeDetail(initialMovie.slug);
      
      if (fullDetails) {
          setMovie(fullDetails);
          if (!currentEpisode && fullDetails.episodes && fullDetails.episodes.length > 0) {
              setCurrentEpisode(fullDetails.episodes[0]);
          }
      }
      setIsLoadingDetails(false);
    };

    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMovie.id]); 

  // 2. Stream Fetching: Runs when currentEpisode changes
  useEffect(() => {
    const fetchStreams = async () => {
        if (!currentEpisode || !currentEpisode.slug) return;
        
        setIsLoadingStream(true);
        setStreams([]);
        setCurrentStream(null);

        const foundStreams = await getEpisodeStreams(currentEpisode.slug);
        setStreams(foundStreams);
        
        if (foundStreams.length > 0) {
            setCurrentStream(foundStreams[0]);
        }
        setIsLoadingStream(false);
    };

    fetchStreams();
  }, [currentEpisode]);

  // Auto-hide controls interaction
  useEffect(() => {
    const resetTimer = () => {
      setShowControls(true);
      if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
      if (!showSidebar && !showSettings) {
        hideControlsTimeout.current = setTimeout(() => setShowControls(false), 3500);
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
  }, [showSidebar, showSettings]);

  const handleEpisodeSelect = (episode: Episode) => {
    setCurrentEpisode(episode);
    setShowSidebar(false); 
  };

  const handleStreamSelect = (stream: Stream) => {
    setCurrentStream(stream);
    setShowSettings(false);
  };

  const currentTitle = currentEpisode ? `Ep ${currentEpisode.number}: ${currentEpisode.title}` : movie.title;

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col justify-center overflow-hidden font-sans select-none">
      
      {/* --- HEADER --- */}
      <div className={`absolute top-0 left-0 right-0 z-50 p-4 md:p-6 flex justify-between items-start transition-transform duration-300 ${showControls ? 'translate-y-0' : '-translate-y-full'}`}>
        <button 
          onClick={onClose} 
          className="bg-black/50 backdrop-blur-md p-3 rounded-full hover:bg-white/20 text-white transition-all group border border-white/10"
        >
          <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
        </button>
        
        <div className="flex flex-col items-end">
             <h2 className="text-white font-bold text-lg md:text-xl tracking-wide drop-shadow-md text-right">{movie.title}</h2>
             <span className="text-[#1ce783] font-medium text-sm md:text-base drop-shadow-md">
                {movie.source === 'youtube' && <span className="text-red-500 mr-2">● YouTube</span>}
                {currentTitle}
             </span>
        </div>
      </div>

      {/* --- MAIN PLAYER AREA --- */}
      <div className="relative w-full h-full bg-[#0b0c0f] flex items-center justify-center">
        
        {/* Loading Overlay */}
        {(isLoadingDetails || isLoadingStream) && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/90 text-white">
                <Loader2 className="w-16 h-16 animate-spin text-[#1ce783] mb-6" />
                <h3 className="text-xl font-bold animate-pulse">
                    {isLoadingDetails ? "Loading Anime Data..." : "Connecting to Server..."}
                </h3>
                <p className="text-gray-400 mt-2 text-sm">
                    {movie.source === 'youtube' ? 'Syncing YouTube Playlist...' : 'Searching for best stream...'}
                </p>
            </div>
        )}

        {/* Empty State */}
        {!isLoadingStream && streams.length === 0 && !isLoadingDetails && (
             <div className="text-center p-8 bg-gray-900 rounded-xl border border-gray-700">
                <MonitorPlay className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-300 text-lg">No streams found for this episode.</p>
                <button onClick={() => window.location.reload()} className="mt-4 text-[#1ce783] hover:underline">Try Refreshing</button>
             </div>
        )}

        {/* The Iframe Player */}
        {!isLoadingStream && currentStream && (
             <iframe
                key={currentStream.url} // Force re-render on url change
                src={currentStream.url}
                className="w-full h-full border-none"
                allowFullScreen
                allow="autoplay; encrypted-media; picture-in-picture; gyroscope; accelerometer"
                title="Video Player"
             />
        )}
      </div>

      {/* --- SETTINGS MENU (Resolution/Server) --- */}
      {showSettings && (
        <div className="absolute bottom-24 right-6 z-50 bg-[#1a1c21]/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 w-72 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
             <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                 <h3 className="text-white font-bold flex items-center gap-2">
                     <Settings className="w-4 h-4 text-[#1ce783]" /> Stream Source
                 </h3>
                 <button onClick={() => setShowSettings(false)}><X className="w-4 h-4 text-gray-400" /></button>
             </div>
             
             <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                 {streams.map((stream, idx) => (
                     <button
                        key={idx}
                        onClick={() => handleStreamSelect(stream)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex justify-between items-center ${currentStream?.url === stream.url ? 'bg-[#1ce783] text-black font-bold' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
                     >
                        <span className="truncate max-w-[140px]">{stream.server}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${currentStream?.url === stream.url ? 'bg-black/20' : 'bg-black/40'}`}>
                            {stream.resolution}
                        </span>
                     </button>
                 ))}
             </div>
        </div>
      )}

      {/* --- EPISODE SIDEBAR --- */}
      <div className={`absolute top-0 right-0 bottom-0 w-80 md:w-96 bg-[#121212]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-[55] transform transition-transform duration-300 ease-in-out flex flex-col ${showSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
         <div className="p-5 flex items-center justify-between border-b border-white/10 bg-black/20">
            <div>
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[#1ce783]" />
                    Episodes
                </h3>
                <p className="text-xs text-gray-400 mt-1">{movie.episodes?.length || 0} Episodes Available</p>
            </div>
            <button onClick={() => setShowSidebar(false)} className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-full transition">
                <X className="w-6 h-6" />
            </button>
         </div>
         
         <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {movie.episodes?.map((ep) => (
                <div 
                    key={ep.id} 
                    onClick={() => handleEpisodeSelect(ep)}
                    className={`flex gap-3 p-3 rounded-xl cursor-pointer transition-all group ${currentEpisode?.id === ep.id ? 'bg-[#1ce783] text-black' : 'hover:bg-white/10 text-gray-300'}`}
                >
                    <div className="relative w-24 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-black flex items-center justify-center border border-white/5">
                        <img src={ep.thumbnailUrl || movie.thumbnailUrl} alt={ep.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" />
                         <div className="absolute inset-0 flex items-center justify-center font-black text-lg drop-shadow-md text-white">
                            {ep.number}
                         </div>
                    </div>
                    <div className="flex flex-col justify-center min-w-0">
                        <h4 className={`text-sm font-bold truncate ${currentEpisode?.id === ep.id ? 'text-black' : 'text-white'}`}>{ep.title}</h4>
                        <span className={`text-xs ${currentEpisode?.id === ep.id ? 'text-black/70' : 'text-gray-500'}`}>{ep.description || 'Watch Now'}</span>
                    </div>
                </div>
            ))}
         </div>
      </div>

      {/* --- BOTTOM CONTROLS BAR --- */}
      <div className={`absolute bottom-0 left-0 right-0 z-40 px-6 py-8 pointer-events-none transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex items-center justify-center md:justify-end gap-4 pointer-events-auto">
            
            {/* Stream Settings Button */}
            <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all backdrop-blur-md border border-white/10 shadow-lg ${showSettings ? 'bg-[#1ce783] text-black' : 'bg-black/60 text-white hover:bg-white/20'}`}
            >
                <Settings className="w-4 h-4" />
                <span className="hidden md:inline">{currentStream?.resolution || 'Auto'}</span>
            </button>

            {/* Episodes Toggle Button */}
            <button 
                onClick={() => setShowSidebar(!showSidebar)}
                className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold text-sm transition-all backdrop-blur-md border border-white/10 shadow-lg ${showSidebar ? 'bg-[#1ce783] text-black' : 'bg-black/60 text-white hover:bg-white/20'}`}
            >
                <Layers className="w-4 h-4" />
                <span>Episodes</span>
            </button>
        </div>
      </div>

    </div>
  );
};

export default VideoPlayer;