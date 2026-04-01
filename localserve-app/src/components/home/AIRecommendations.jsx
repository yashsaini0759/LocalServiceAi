import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";

export default function AIRecommendations() {
  const navigate = useNavigate();
  const { providers, wishlist, toggleWishlist, affinityProfile } = useApp();

  const recommended = [...providers].sort((a, b) => {
      const getPrice = (p) => p.servicesOffered?.length > 0 ? Math.min(...p.servicesOffered.map(s => s.price)) : p.price;
      const getMatchScore = (p) => {
         let s = 0;
         const categories = p.servicesOffered && p.servicesOffered.length > 0 
            ? p.servicesOffered.map(x => x.category.toLowerCase().trim()) 
            : [p.service?.toLowerCase().trim() || ""];
            
         categories.forEach(cat => {
            if (affinityProfile?.categories?.[cat]) s += affinityProfile.categories[cat] * 12;
         });
         
         const avgRating = affinityProfile?.ratingPreferences?.length > 0 
             ? affinityProfile.ratingPreferences.reduce((acc, val) => acc + val, 0) / affinityProfile.ratingPreferences.length : 0;
         if (avgRating > 0 && p.rating >= avgRating) s += 15;
         
         const avgPrice = affinityProfile?.pricePreferences?.length > 0
             ? affinityProfile.pricePreferences.reduce((acc, val) => acc + val, 0) / affinityProfile.pricePreferences.length : 0;
         if (avgPrice > 0 && getPrice(p) <= avgPrice) s += 15;
         
         s += p.rating * 5 + Math.min(p.reviews, 50) * 0.4;
         if (p.tags.includes("AI Recommended")) s += 10;
         return s;
      };
      return getMatchScore(b) - getMatchScore(a);
  }).slice(0, 5);

  return (
    <section className="bg-gradient-to-br from-primary/5 to-secondary/5 py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-secondary fill-icon text-xl">auto_awesome</span>
              <span className="text-xs font-bold text-secondary uppercase tracking-widest">AI Curated</span>
            </div>
            <h2 className="text-2xl font-headline font-extrabold text-on-surface">Recommended For You</h2>
          </div>
          <button onClick={() => navigate("/services")} className="text-primary font-bold text-sm flex items-center gap-1 hover:underline">
            See All <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
          {recommended.map((provider) => (
            <div
              key={provider.id}
              className="min-w-[250px] bg-white rounded-2xl shadow-md border border-outline-variant/10 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
              onClick={() => navigate(`/provider/${provider.id}`)}
            >
              {/* AI Badge */}
              <div className="relative">
                <div className="h-28 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <img
                    src={provider.avatar}
                    alt={provider.name}
                    className="w-16 h-16 rounded-full border-4 border-white shadow-md bg-surface-container"
                  />
                </div>
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-secondary/90 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                  <span className="material-symbols-outlined text-xs fill-icon">auto_awesome</span>
                  AI Pick
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleWishlist(provider.id); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white shadow flex items-center justify-center"
                >
                  <span className={`material-symbols-outlined text-sm ${wishlist.includes(provider.id) ? "text-secondary fill-icon" : "text-on-surface-variant"}`}>
                    favorite
                  </span>
                </button>
              </div>

              <div className="p-4">
                <h4 className="font-bold text-on-surface text-sm group-hover:text-primary transition-colors">{provider.name}</h4>
                <p className="text-xs text-on-surface-variant mb-2">{provider.servicesOffered?.length > 0 ? provider.servicesOffered[0].category : provider.service}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-secondary text-sm fill-icon">star</span>
                    <span className="text-sm font-bold">{provider.rating}</span>
                    <span className="text-xs text-on-surface-variant">({provider.reviews})</span>
                  </div>
                  <span className="text-xs font-bold text-primary">₹{provider.servicesOffered?.length > 0 ? Math.min(...provider.servicesOffered.map(s => s.price)) : provider.price}+</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
