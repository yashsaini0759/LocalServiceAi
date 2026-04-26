import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";

export default function AIRecommendations() {
  const navigate = useNavigate();
  const { providers, wishlist, toggleWishlist, categoryStack, serverRecommendations } = useApp();
  const { user } = useAuth();

  // Sort providers by their position in the categoryStack.
  // Stack index 0 = most recently interacted = highest priority.
  // Providers not in the stack fall back to rating sort.
  const getStackScore = (provider) => {
    const cats = provider.servicesOffered?.length > 0
      ? provider.servicesOffered.map(s => s.category.toLowerCase())
      : [provider.service?.toLowerCase() || ""];
    // Find the lowest (best) index in the stack this provider matches
    let bestIdx = Infinity;
    cats.forEach(cat => {
      const idx = categoryStack.indexOf(cat);
      if (idx !== -1 && idx < bestIdx) bestIdx = idx;
    });
    return bestIdx; // lower = better
  };

  const recommended = serverRecommendations?.length > 0
    ? serverRecommendations.slice(0, 5)
    : [...providers]
        .sort((a, b) => {
          const sa = getStackScore(a);
          const sb = getStackScore(b);
          // Stack matches always beat non-matches
          if (sa !== sb) return sa - sb;
          // Tie-break by rating
          return b.rating - a.rating;
        })
        .slice(0, 5);

  return (
    <section className="bg-gradient-to-br from-primary/5 to-secondary/5 py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-secondary fill-icon text-xl">auto_awesome</span>
              <span className="text-xs font-bold text-secondary uppercase tracking-widest">
                {user ? "Personalised For You" : "AI Curated"}
              </span>
            </div>
            <h2 className="text-2xl font-headline font-extrabold text-on-surface">Recommended For You</h2>
            {user && serverRecommendations.length > 0 && (
              <p className="text-xs text-on-surface-variant mt-1">Based on your bookings &amp; search history</p>
            )}
          </div>
          <button onClick={() => navigate("/services?sort=ai")} className="text-primary font-bold text-sm flex items-center gap-1 hover:underline">
            See All <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
          {recommended.map(provider => (
            <div key={provider.id}
              className="min-w-[250px] bg-white rounded-2xl shadow-md border border-outline-variant/10 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
              onClick={() => navigate(`/provider/${provider.id}`)}>

              <div className="relative">
                <div className="h-28 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <img src={provider.avatar} alt={provider.name}
                    className="w-16 h-16 rounded-full border-4 border-white shadow-md bg-surface-container" />
                </div>

                {/* AI Badge / Score */}
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-secondary/90 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                  <span className="material-symbols-outlined text-xs fill-icon">auto_awesome</span>
                  {provider.aiScore ? `${provider.aiScore}% match` : "AI Pick"}
                </div>

                <button onClick={e => { e.stopPropagation(); toggleWishlist(provider.id); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white shadow flex items-center justify-center">
                  <span className={`material-symbols-outlined text-sm ${wishlist.includes(provider.id) ? "text-secondary fill-icon" : "text-on-surface-variant"}`}>favorite</span>
                </button>
              </div>

              <div className="p-4">
                <h4 className="font-bold text-on-surface text-sm group-hover:text-primary transition-colors">{provider.name}</h4>
                <p className="text-xs text-on-surface-variant mb-2">
                  {provider.servicesOffered?.length > 0 ? provider.servicesOffered[0].category : provider.service}
                </p>

                {/* Match reasons */}
                {provider.matchReasons?.length > 0 && (
                  <p className="text-[10px] text-secondary font-semibold mb-2 truncate">{provider.matchReasons[0]}</p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-secondary text-sm fill-icon">star</span>
                    <span className="text-sm font-bold">{provider.rating}</span>
                    <span className="text-xs text-on-surface-variant">({provider.reviews})</span>
                  </div>
                  <span className="text-xs font-bold text-primary">
                    ₹{provider.servicesOffered?.length > 0 ? Math.min(...provider.servicesOffered.map(s => s.price)) : provider.price}+
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
