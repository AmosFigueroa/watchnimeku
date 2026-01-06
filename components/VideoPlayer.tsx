import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Movie } from '../types';
import LoadingLottie from './LoadingLottie';

interface VideoPlayerProps {
  movie: Movie;
  onClose: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ movie, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);

  // Reset loading state when movie changes
  useEffect(() => {
    setIsLoading(true);
  }, [movie]);

  // Determine the correct URL.
  const getStreamUrl = () => {
      if (movie.youtubeId) {
          // Adding origin can sometimes help with embedding restrictions
          const origin = window.location.origin;
          return `https://www.youtube.com/embed/${movie.youtubeId}?autoplay=1&modestbranding=1&rel=0&showinfo=0&origin=${origin}`;
      }
      return movie.videoUrl;
  };

  const streamUrl = getStreamUrl();

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/90 to-transparent z-10 pointer-events-none">
         <h2 className="text-white font-bold text-lg truncate pr-4 drop-shadow-md pointer-events-auto">
            {movie.title} <span className="text-[#1ce783] text-sm ml-2 font-normal">({movie.source === 'external' ? 'External Source' : 'Official'})</span>
         </h2>
         <button 
            onClick={onClose} 
            className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition backdrop-blur-sm pointer-events-auto cursor-pointer"
         >
            <X className="w-6 h-6 text-white" />
         </button>
      </div>

      <div className="w-full h-full max-w-7xl max-h-[90vh] bg-black aspect-video flex items-center justify-center relative shadow-2xl">
        
        {/* Loading Overlay */}
        {isLoading && streamUrl && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black">
                <LoadingLottie />
            </div>
        )}

        {streamUrl ? (
            <iframe 
                onLoad={() => {
                    // Give a small delay to ensure rendering starts
                    setTimeout(() => setIsLoading(false), 1000);
                }}
                className={`w-full h-full transition-opacity duration-700 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                src={streamUrl} 
                title={movie.title} 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen
                sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation"
            ></iframe>
        ) : (
            <div className="text-white flex flex-col items-center justify-center p-8 text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <p className="text-2xl font-bold mb-2">Video Tidak Ditemukan</p>
                <p className="text-gray-400 max-w-md">
                    Maaf, sistem scraping tidak menemukan pemutar video yang valid untuk judul ini dari sumber eksternal.
                </p>
                <button onClick={onClose} className="mt-6 bg-white text-black px-6 py-2 rounded font-bold hover:bg-gray-200 transition">
                    Kembali
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;