import React from 'react';
import { X } from 'lucide-react';
import { Movie } from '../types';

interface VideoPlayerProps {
  movie: Movie;
  onClose: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ movie, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10">
         <h2 className="text-white font-bold text-lg truncate pr-4 shadow-black drop-shadow-md">{movie.title}</h2>
         <button 
            onClick={onClose} 
            className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition backdrop-blur-sm"
         >
            <X className="w-6 h-6 text-white" />
         </button>
      </div>

      <div className="w-full h-full max-w-7xl max-h-[80vh] bg-black aspect-video flex items-center justify-center">
        {movie.source === 'youtube' && movie.youtubeId ? (
            <iframe 
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${movie.youtubeId}?autoplay=1&rel=0`} 
                title={movie.title} 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
            ></iframe>
        ) : movie.videoUrl ? (
             <iframe 
                className="w-full h-full"
                src={movie.videoUrl} 
                title={movie.title} 
                frameBorder="0" 
                allowFullScreen
            ></iframe>
        ) : (
            <div className="text-white">
                <p>Video source not available.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
