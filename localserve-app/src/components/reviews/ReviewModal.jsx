import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";

export default function ReviewModal({ providerId, providerName, onClose }) {
  const { addReview } = useApp();
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!rating || !comment.trim()) return;
    setLoading(true);
    setTimeout(() => {
      addReview({ providerProfileId: providerId, providerName, rating, comment, userId: user?.id || "guest" });
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn">
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/10">
          <h3 className="font-bold text-on-surface">{submitted ? "Review Submitted!" : `Rate ${providerName}`}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-tertiary/20 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-tertiary text-3xl fill-icon">check_circle</span>
            </div>
            <h4 className="font-bold text-lg text-on-surface">Thank you for your review!</h4>
            <p className="text-sm text-on-surface-variant">Your feedback helps others find the best service providers.</p>
            <button onClick={onClose} className="w-full py-3 rounded-xl bg-primary text-on-primary font-bold text-sm hover:bg-primary-dim transition-all">
              Done
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Stars */}
            <div className="text-center space-y-2">
              <p className="text-sm text-on-surface-variant font-medium">How would you rate this service?</p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-125"
                  >
                    <span className={`material-symbols-outlined text-4xl transition-colors ${
                      star <= (hover || rating) ? "text-secondary fill-icon" : "text-surface-container-high"
                    }`}>star</span>
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm font-bold text-on-surface">
                  {["", "Poor", "Fair", "Good", "Very Good", "Excellent!"][rating]}
                </p>
              )}
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Your Review</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with others..."
                rows={4}
                className="w-full rounded-xl border border-outline-variant/30 focus:border-primary focus:ring-2 focus:ring-primary/10 p-3 text-sm text-on-surface placeholder-on-surface-variant/50 resize-none focus:outline-none bg-surface-container-lowest"
              />
              <p className="text-xs text-on-surface-variant text-right">{comment.length}/500</p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!rating || !comment.trim() || loading}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
                rating && comment.trim() && !loading
                  ? "bg-primary text-on-primary hover:bg-primary-dim hover:scale-[0.98]"
                  : "bg-surface-container text-on-surface-variant cursor-not-allowed"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                  Submitting...
                </span>
              ) : "Submit Review"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
