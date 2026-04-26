import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";

const TAG_STYLES = {
  "Top Rated": "bg-tertiary-container/40 text-on-tertiary-container",
  "Fast Response": "bg-primary/10 text-primary",
  "AI Recommended": "bg-secondary-container/40 text-on-secondary-container",
  "Most Booked": "bg-[#ff9a62]/20 text-[#c45a1a]",
  "Verified": "bg-green-100 text-green-700",
};

function StarRating({ value, count }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`material-symbols-outlined text-secondary text-sm ${i < Math.round(value) ? "fill-icon" : ""}`}>star</span>
      ))}
      <span className="text-sm font-bold ml-1">{value}</span>
      <span className="text-xs text-on-surface-variant">({count})</span>
    </div>
  );
}

export default function ProviderCard({ provider, onBook }) {
  const navigate = useNavigate();
  const { wishlist, toggleWishlist, addRecentlyViewed } = useApp();
  const isWishlisted = wishlist.includes(provider.id);
  const hasAiScore = provider.aiScore !== null && provider.aiScore !== undefined;
  const hasSemanticScore = provider.semanticScore !== null && provider.semanticScore !== undefined;

  const handleViewProfile = () => {
    addRecentlyViewed(provider);
    navigate(`/provider/${provider.id}`);
  };

  const minPrice = provider.servicesOffered?.length > 0
    ? Math.min(...provider.servicesOffered.map(s => s.price))
    : provider.price;

  return (
    <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 overflow-hidden group flex flex-col">
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <img src={provider.avatar} alt={provider.name}
              className="w-16 h-16 rounded-2xl object-cover bg-surface-container border-2 border-surface-container-high" />
            {provider.available && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-tertiary border-2 border-white" title="Available" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-on-surface text-base leading-tight group-hover:text-primary transition-colors">{provider.name}</h3>
                <p className="text-on-surface-variant text-xs flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-xs">{provider.serviceIcon || "handyman"}</span>
                  {provider.servicesOffered?.length > 0 ? provider.servicesOffered[0].category : provider.service}
                  {provider.verified && <span className="material-symbols-outlined text-tertiary text-xs fill-icon ml-1" title="Verified">verified</span>}
                </p>
              </div>
              <button onClick={e => { e.stopPropagation(); toggleWishlist(provider.id); }}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 ${isWishlisted ? "bg-secondary/10 text-secondary" : "bg-surface-container text-on-surface-variant hover:text-secondary"}`}>
                <span className={`material-symbols-outlined text-lg ${isWishlisted ? "fill-icon" : ""}`}>favorite</span>
              </button>
            </div>
            <StarRating value={provider.rating} count={provider.reviews} />
          </div>
        </div>
      </div>

      {/* AI Score Badge */}
      {hasAiScore && !hasSemanticScore && (
        <div className="px-5 pb-2">
          <div className="flex items-center gap-2 bg-gradient-to-r from-secondary/10 to-primary/10 border border-secondary/20 rounded-xl px-3 py-2">
            <span className="material-symbols-outlined text-secondary text-sm fill-icon">auto_awesome</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black text-secondary uppercase tracking-wider">AI Match</span>
                <span className="text-sm font-black text-secondary">{provider.aiScore}%</span>
              </div>
              {/* Match reasons */}
              {provider.matchReasons?.length > 0 && (
                <p className="text-[10px] text-on-surface-variant leading-tight truncate">
                  {provider.matchReasons[0]}
                  {provider.matchReasons[1] && <> · {provider.matchReasons[1]}</>}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Semantic Search Badge */}
      {hasSemanticScore && (
        <div className="px-5 pb-2">
          <div className="flex items-center gap-2 bg-gradient-to-r from-primary/10 to-transparent border-l-4 border-primary rounded-r-xl px-3 py-2">
            <span className="material-symbols-outlined text-primary text-base fill-icon">psychology</span>
            <div className="flex-1 min-w-0">
               <div className="flex items-center justify-between">
                 <span className="text-xs font-bold text-primary">Contextual AI Output</span>
                 <span className="text-xs font-black text-primary">{provider.semanticScore}%</span>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Tags */}
      <div className="px-5 pb-3 flex flex-wrap gap-1.5">
        {provider.tags?.map(tag => (
          <span key={tag} className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${TAG_STYLES[tag] || "bg-surface-container text-on-surface-variant"}`}>
            {tag === "AI Recommended" && <span className="material-symbols-outlined text-[10px] fill-icon mr-0.5">auto_awesome</span>}
            {tag}
          </span>
        ))}
      </div>

      {/* Meta */}
      <div className="px-5 pb-4 flex items-center justify-between text-sm mt-auto">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-on-surface-variant font-medium">
            <span className="material-symbols-outlined text-primary text-base">near_me</span>
            {provider.distance} km
          </span>
          <span className="flex items-center gap-1 text-on-surface-variant font-medium">
            <span className="material-symbols-outlined text-primary text-base">work_history</span>
            {provider.experience}
          </span>
        </div>
        <div className="text-right">
          <p className="text-xs text-on-surface-variant">Starting from</p>
          <p className="font-extrabold text-primary text-base">₹{minPrice}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 flex gap-2 border-t border-outline-variant/10 pt-3">
        <button onClick={handleViewProfile}
          className="flex-1 py-2.5 rounded-xl border border-primary/30 text-primary font-semibold text-sm hover:bg-primary/5 transition-all text-center">
          View Profile
        </button>
        <button onClick={() => onBook(provider)} disabled={!provider.available}
          className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-[0.98] ${provider.available ? "bg-primary text-on-primary hover:bg-primary-dim" : "bg-surface-container text-on-surface-variant cursor-not-allowed"}`}>
          {provider.available ? "Book Now" : "Unavailable"}
        </button>
      </div>
    </div>
  );
}
