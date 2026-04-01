export default function ReviewCard({ review }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-outline-variant/10 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary fill-icon">person</span>
          </div>
          <div>
            <p className="font-bold text-on-surface text-sm">
              {review.userId === "mock-user" ? "You" : `User-${review.userId?.slice(-4)}`}
            </p>
            <p className="text-xs text-on-surface-variant">{review.date}</p>
          </div>
        </div>
        {/* Stars */}
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={`material-symbols-outlined text-secondary text-sm ${i < review.rating ? "fill-icon" : ""}`}>star</span>
          ))}
        </div>
      </div>
      <p className="text-sm text-on-surface-variant leading-relaxed">{review.comment}</p>
      {review.providerName && (
        <p className="text-xs text-primary font-semibold mt-2">@ {review.providerName}</p>
      )}
    </div>
  );
}
