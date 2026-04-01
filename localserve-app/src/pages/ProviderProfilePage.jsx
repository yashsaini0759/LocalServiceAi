import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import BookingModal from "../components/booking/BookingModal";
import ReviewCard from "../components/reviews/ReviewCard";
import ReviewModal from "../components/reviews/ReviewModal";
import EmptyState from "../components/ui/EmptyState";

function StarBar({ label, value, total }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold text-on-surface-variant w-4">{label}</span>
      <div className="flex-1 bg-surface-container-high rounded-full h-2 overflow-hidden">
        <div className="bg-secondary h-full rounded-full transition-all" style={{ width: `${(value / total) * 100}%` }} />
      </div>
      <span className="text-xs text-on-surface-variant w-4 text-right">{value}</span>
    </div>
  );
}

export default function ProviderProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { providers, wishlist, toggleWishlist, reviews } = useApp();
  const [showBooking, setShowBooking] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [activeTab, setActiveTab] = useState("about");

  const provider = providers.find((p) => p.id === id);
  if (!provider) return (
    <div className="pt-24">
      <EmptyState icon="person_off" title="Provider not found" description="This provider may have been removed." action={() => navigate("/services")} actionLabel="Back to Services" />
    </div>
  );

  const providerReviews = reviews.filter((r) => r.providerId === id);
  const isWishlisted = wishlist.includes(provider.id);

  const tabs = ["about", "services", "reviews"];

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Hero Banner */}
      <div className="bg-on-background h-40 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30" />
      </div>

      {/* Profile Header */}
      <div className="max-w-4xl mx-auto px-6 md:px-8">
        <div className="relative mt-6 mb-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <img
            src={provider.avatar}
            alt={provider.name}
            className="w-28 h-28 rounded-2xl border-4 border-white shadow-xl bg-surface-container shrink-0"
          />
          <div className="flex-1 w-full text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h1 className="text-2xl font-headline font-extrabold text-on-surface">{provider.name}</h1>
              {provider.verified && (
                <span className="flex items-center gap-1 text-xs font-bold text-tertiary bg-tertiary-container/30 px-2.5 py-1 rounded-full">
                  <span className="material-symbols-outlined text-xs fill-icon">verified</span> Verified
                </span>
              )}
              {provider.available ? (
                <span className="text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">● Available</span>
              ) : (
                <span className="text-xs font-bold text-error bg-error/10 px-2.5 py-1 rounded-full">Unavailable</span>
              )}
            </div>
            <p className="text-on-surface-variant text-sm mt-0.5 flex items-center justify-center sm:justify-start gap-1">
              <span className="material-symbols-outlined text-primary text-base">{provider.serviceIcon || "handyman"}</span>
              {provider.servicesOffered?.length > 0 ? provider.servicesOffered[0].category : provider.service} · {provider.servicesOffered?.length > 0 ? provider.servicesOffered[0].experience : provider.experience} experience
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-3 mt-2 flex-wrap">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={`material-symbols-outlined text-secondary text-sm ${i < Math.round(provider.rating) ? "fill-icon" : ""}`}>star</span>
                ))}
                <span className="font-bold text-sm ml-1">{provider.rating}</span>
                <span className="text-xs text-on-surface-variant">({provider.reviews} reviews)</span>
              </div>
              <span className="text-on-surface-variant text-xs">·</span>
              <span className="text-sm text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-primary text-base">near_me</span>{provider.distance} km away
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center sm:justify-end gap-2 w-full sm:w-auto mt-4 sm:mt-0">
            <button
              onClick={() => toggleWishlist(provider.id)}
              className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
                isWishlisted ? "bg-secondary/10 border-secondary/30 text-secondary" : "border-outline-variant/30 text-on-surface-variant hover:text-secondary hover:border-secondary/30"
              }`}
            >
              <span className={`material-symbols-outlined ${isWishlisted ? "fill-icon" : ""}`}>favorite</span>
            </button>
            <button
              onClick={() => setShowBooking(true)}
              disabled={!provider.available}
              className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-primary-dim hover:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Book Now — ₹{provider.servicesOffered?.length > 0 ? Math.min(...provider.servicesOffered.map(s => s.price)) : provider.price}
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {provider.tags.map((tag) => (
            <span key={tag} className="text-xs font-bold px-3 py-1.5 bg-primary/10 text-primary rounded-full">{tag}</span>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-outline-variant/20 mb-6 gap-1">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-5 py-3 text-sm font-bold capitalize transition-all ${
                activeTab === t
                  ? "text-primary border-b-2 border-primary -mb-px"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {t === "reviews" ? `Reviews (${provider.reviews})` : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "about" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12">
            <div className="md:col-span-2 space-y-5">
              <div className="bg-white rounded-2xl p-6 border border-outline-variant/10">
                <h3 className="font-bold text-on-surface mb-3">About</h3>
                <p className="text-on-surface-variant leading-relaxed text-sm">{provider.description}</p>
              </div>

              {/* Pricing */}
              <div className="bg-white rounded-2xl p-6 border border-outline-variant/10">
                <h3 className="font-bold text-on-surface mb-4">Pricing</h3>
                <div className="space-y-3">
                  {provider.servicesOffered && provider.servicesOffered.length > 0 ? provider.servicesOffered.map((item) => (
                    <div key={item.id || item.category} className="flex justify-between items-center py-2 border-b border-outline-variant/10 last:border-0">
                      <span className="text-sm text-on-surface font-medium">{item.category}</span>
                      <span className="font-bold text-primary">₹{item.price}</span>
                    </div>
                  )) : (
                    <div className="flex justify-between items-center py-2 border-b border-outline-variant/10 last:border-0">
                      <span className="text-sm text-on-surface font-medium">{provider.service}</span>
                      <span className="font-bold text-primary">₹{provider.price}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Info cards */}
            <div className="space-y-4">
              {[
                { icon: "calendar_month", label: "Joined", value: "Jan 2022" },
                { icon: "task_alt", label: "Jobs Done", value: `${provider.reviews + 20}+` },
                { icon: "payments", label: "Starting From", value: `₹${provider.servicesOffered?.length > 0 ? Math.min(...provider.servicesOffered.map(s => s.price)) : provider.price}` },
                { icon: "location_on", label: "Distance", value: `${provider.distance} km away` },
              ].map((item) => (
                <div key={item.label} className="bg-white rounded-2xl p-4 border border-outline-variant/10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-xl">{item.icon}</span>
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">{item.label}</p>
                    <p className="font-bold text-on-surface">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "services" && (
          <div className="pb-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {provider.servicesOffered && provider.servicesOffered.map((svc) => (
              <div key={svc.id || svc.category} className="bg-white rounded-2xl p-4 border border-outline-variant/10 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-tertiary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-tertiary text-lg">check_circle</span>
                  </div>
                  <span className="font-semibold text-on-surface text-sm uppercase">{svc.category}</span>
                </div>
                {svc.description && <p className="text-xs text-on-surface-variant leading-relaxed">{svc.description}</p>}
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-bold text-primary">₹{svc.price}</span>
                  <span className="text-xs text-on-surface-variant">{svc.experience} experience</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="pb-12 space-y-5">
            {/* Stats */}
            <div className="bg-white rounded-2xl p-6 border border-outline-variant/10 flex flex-col sm:flex-row gap-6 items-center">
              <div className="text-center">
                <p className="text-5xl font-extrabold font-headline text-on-surface">{provider.rating}</p>
                <div className="flex justify-center mt-1 mb-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`material-symbols-outlined text-secondary text-sm ${i < Math.round(provider.rating) ? "fill-icon" : ""}`}>star</span>
                  ))}
                </div>
                <p className="text-xs text-on-surface-variant">{provider.reviews} reviews</p>
              </div>
              <div className="flex-1 w-full space-y-2">
                <StarBar label="5" value={Math.round(provider.reviews * 0.6)} total={provider.reviews} />
                <StarBar label="4" value={Math.round(provider.reviews * 0.25)} total={provider.reviews} />
                <StarBar label="3" value={Math.round(provider.reviews * 0.1)} total={provider.reviews} />
                <StarBar label="2" value={Math.round(provider.reviews * 0.03)} total={provider.reviews} />
                <StarBar label="1" value={Math.round(provider.reviews * 0.02)} total={provider.reviews} />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <h3 className="font-bold text-on-surface">Customer Reviews</h3>
              <button onClick={() => setShowReview(true)} className="text-xs text-primary font-bold border border-primary/30 px-4 py-2 rounded-full hover:bg-primary/5 transition-colors">
                + Write Review
              </button>
            </div>

            {providerReviews.length === 0 ? (
              <EmptyState icon="reviews" title="No reviews yet" description="Be the first to review this provider." action={() => setShowReview(true)} actionLabel="Write a Review" />
            ) : (
              providerReviews.map((r) => <ReviewCard key={r.id} review={r} />)
            )}
          </div>
        )}
      </div>

      {showBooking && <BookingModal provider={provider} onClose={() => setShowBooking(false)} />}
      {showReview && <ReviewModal providerId={provider.id} providerName={provider.name} onClose={() => setShowReview(false)} />}
    </div>
  );
}
