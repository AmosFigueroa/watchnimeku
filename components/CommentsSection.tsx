import React, { useState, useEffect } from 'react';
import { Star, User, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Review } from '../types';

interface CommentsSectionProps {
    movieSlug: string;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ movieSlug }) => {
    const { user, isAuthenticated } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [newComment, setNewComment] = useState('');
    const [rating, setRating] = useState(5);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchReviews = async () => {
            const data = await api.getReviews(movieSlug);
            setReviews(data);
        };
        fetchReviews();
    }, [movieSlug]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated) return;
        
        setLoading(true);
        try {
            const newReview = await api.addReview(movieSlug, rating, newComment);
            setReviews([newReview, ...reviews]);
            setNewComment('');
            setRating(5);
        } catch (e) {
            alert("Gagal mengirim komentar.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#0b0c0f] p-4 md:p-6 rounded-xl border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                Komentar & Rating <span className="text-gray-500 text-sm font-normal">({reviews.length})</span>
            </h3>

            {/* Input Form */}
            {isAuthenticated ? (
                <form onSubmit={handleSubmit} className="mb-8 bg-[#1a1c21] p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-gray-400 text-sm">Rating:</span>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                                key={star}
                                className={`w-5 h-5 cursor-pointer transition ${star <= rating ? 'fill-[#facc15] text-[#facc15]' : 'text-gray-600'}`}
                                onClick={() => setRating(star)}
                            />
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 bg-black border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-[#1ce783] text-sm"
                            placeholder="Tulis pendapatmu tentang film ini..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            required
                        />
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="bg-[#1ce783] p-2 rounded hover:bg-[#15bd6b] text-black disabled:opacity-50"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </form>
            ) : (
                <div className="bg-[#1a1c21] p-4 rounded-lg mb-8 text-center text-gray-400 text-sm">
                    Silakan login untuk memberi rating dan komentar.
                </div>
            )}

            {/* Reviews List */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {reviews.length > 0 ? reviews.map((rev) => (
                    <div key={rev._id} className="border-b border-gray-800 pb-4 last:border-0">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
                                    <User className="w-3 h-3 text-white" />
                                </div>
                                <span className="font-bold text-gray-300 text-sm">{rev.username}</span>
                            </div>
                            <div className="flex items-center gap-0.5">
                                <Star className="w-3 h-3 fill-[#facc15] text-[#facc15]" />
                                <span className="text-[#facc15] text-sm font-bold">{rev.rating}</span>
                            </div>
                        </div>
                        <p className="text-gray-400 text-sm ml-8">{rev.comment}</p>
                        <span className="text-xs text-gray-600 ml-8 mt-1 block">{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>
                )) : (
                    <div className="text-center text-gray-600 italic">Belum ada komentar. Jadilah yang pertama!</div>
                )}
            </div>
        </div>
    );
};

export default CommentsSection;
