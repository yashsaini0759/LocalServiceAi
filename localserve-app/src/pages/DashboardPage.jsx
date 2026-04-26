import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";

import ReviewCard from "../components/reviews/ReviewCard";
import ReviewModal from "../components/reviews/ReviewModal";
import BookingModal from "../components/booking/BookingModal";
import EmptyState from "../components/ui/EmptyState";
import LocationAutocomplete from "../components/ui/LocationAutocomplete";

const STATUS_STYLE = {
  Upcoming: "bg-primary/10 text-primary",
  Completed: "bg-tertiary/10 text-tertiary",
  Cancelled: "bg-error/10 text-error",
  Pending: "bg-amber-500/10 text-amber-600",
};

function BookingCard({ booking, onReview, onUpdateStatus, role }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (booking.status === "Upcoming" && booking.confirmedAt && role === "user") {
      const updateTimer = () => {
        const confirmedTime = new Date(booking.confirmedAt).getTime();
        const now = new Date().getTime();
        const diffInSeconds = Math.floor((confirmedTime + 5 * 60 * 1000 - now) / 1000);
        
        if (diffInSeconds <= 0) {
          setTimeLeft(null);
        } else {
          const m = Math.floor(diffInSeconds / 60).toString().padStart(2, '0');
          const s = (diffInSeconds % 60).toString().padStart(2, '0');
          setTimeLeft(`${m}:${s}`);
        }
      };

      updateTimer(); // run immediately
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [booking.status, booking.confirmedAt, role]);

  const isServicePast = () => {
    if (!booking.date || !booking.time) return false;
    const today = new Date();
    const [y, m, d] = booking.date.split("-").map(Number);
    const [time, period] = booking.time.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    const appointmentTime = new Date(y, m - 1, d, hours, minutes);
    return today >= appointmentTime;
  };

  const serviceFinished = booking.status === "Upcoming" && isServicePast();

  const handleMarkDone = async () => {
    const updated = await onUpdateStatus(booking.id, "Completed");
    if (updated) {
      onReview(updated);
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl p-5 border border-outline-variant/10 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-bold text-on-surface">{booking.providerName}</h4>
            <p className="text-sm text-on-surface-variant">{booking.service}</p>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_STYLE[booking.status] || "bg-surface-container text-on-surface-variant"}`}>
            {booking.status}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm text-on-surface-variant mb-4">
          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-primary text-base">calendar_month</span>{booking.date}</span>
          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-primary text-base">schedule</span>{booking.time}</span>
          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-primary text-base">payments</span>₹{booking.price}</span>
          {booking.notes && <span className="flex items-center gap-1 col-span-2 truncate"><span className="material-symbols-outlined text-primary text-base">notes</span>{booking.notes}</span>}
        </div>
      </div>

      <div className="mt-4">
        {booking.status === "Completed" && (
          <button
            onClick={() => onReview(booking)}
            className="w-full py-2 rounded-xl border border-primary/30 text-primary font-semibold text-xs hover:bg-primary/5 transition-colors"
          >
            + Write a Review
          </button>
        )}

        {booking.status === "Pending" && role === "provider" && (
          <div className="flex gap-2">
            <button onClick={() => onUpdateStatus(booking.id, "Upcoming")} className="flex-1 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary-dim transition-colors">
              Confirm
            </button>
            <button onClick={() => onUpdateStatus(booking.id, "Cancelled")} className="flex-1 py-2 rounded-xl border border-error/50 text-error font-bold text-xs hover:bg-error/5 transition-colors">
              Reject
            </button>
          </div>
        )}

        {booking.status === "Pending" && role === "user" && (
          <div className="flex gap-2 items-center">
            <div className="flex-1 py-2 text-center rounded-xl bg-surface-container-low text-on-surface-variant text-xs font-semibold">
              Awaiting Confirmation
            </div>
            <button onClick={() => onUpdateStatus(booking.id, "Cancelled")} title="Cancel Request" className="w-10 h-10 shrink-0 rounded-xl border border-error/50 text-error flex items-center justify-center hover:bg-error/5 transition-colors">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        )}

        {booking.status === "Upcoming" && role === "user" && (
          <div className="space-y-3">
            {timeLeft && !serviceFinished && (
              <button onClick={() => onUpdateStatus(booking.id, "Cancelled")} className="w-full py-2 rounded-xl border border-error/50 text-error font-bold text-xs hover:bg-error/5 transition-colors flex items-center justify-center gap-2">
                Cancel Booking <span className="font-mono bg-error/10 px-1.5 py-0.5 rounded text-[10px]">{timeLeft}</span>
              </button>
            )}

            {serviceFinished && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 animate-fadeIn">
                <p className="text-xs font-bold text-primary mb-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">verified</span> Is the service done?
                </p>
                <button onClick={handleMarkDone} className="w-full py-2 rounded-lg bg-primary text-on-primary font-bold text-xs hover:bg-primary-dim transition-colors">
                  Yes, Mark Completed
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user, logout, updateProfile } = useAuth();
  const { providers, bookings, updateBookingStatus, reviews, wishlist, toggleWishlist, recentlyViewed } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [activeTab, setActiveTab] = useState(params.get("tab") || "bookings");
  const [reviewTarget, setReviewTarget] = useState(null);

  const [activeEditField, setActiveEditField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  if (!user) {
    return (
      <div className="pt-24">
        <EmptyState
          icon="lock"
          title="Please log in"
          description="You need to be logged in to view your dashboard."
          action={() => navigate("/auth?mode=login")}
          actionLabel="Login"
        />
      </div>
    );
  }

  const pending = bookings.filter((b) => b.status === "Pending");
  const upcoming = bookings.filter((b) => b.status === "Upcoming");
  const past = bookings.filter((b) => b.status === "Completed" || b.status === "Cancelled");
  const wishlisted = providers.filter((p) => wishlist.includes(p.id));
  const myReviews = reviews.filter((r) => 
    user.role === "provider" ? r.providerUserId === user.id : r.userId === user.id
  );

  const tabs = [
    { key: "bookings", label: user.role === "provider" ? "Jobs Booked" : "My Bookings", icon: "calendar_month" },
    { key: "reviews", label: user.role === "provider" ? "Reviews Received" : "My Reviews", icon: "reviews" },
    ...(user.role === "user" ? [{ key: "wishlist", label: "Wishlist", icon: "favorite" }] : []),
    ...(user.role === "user" ? [{ key: "recent", label: "Recently Viewed", icon: "history" }] : []),
    { key: "settings", label: "Settings", icon: "settings" },
  ];

  const handleSaveProfile = async (fieldKey) => {
    setSavingProfile(true);
    await updateProfile({ [fieldKey]: editValue });
    setActiveEditField(null);
    setSavingProfile(false);
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Header */}
      <div className="bg-on-background py-10 px-6 md:px-8">
        <div className="max-w-5xl mx-auto flex items-center gap-5">
          <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-2xl bg-surface-container border-2 border-white/20" />
          <div>
            <h1 className="text-xl md:text-2xl font-headline font-extrabold text-white">Hi, {user.name.split(" ")[0]}! 👋</h1>
            <p className="text-on-surface-variant text-sm mt-0.5">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-primary bg-primary/20 px-2.5 py-1 rounded-full capitalize">{user.role}</span>
              <span className="text-xs text-on-surface-variant">{user.location}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="max-w-5xl mx-auto px-6 md:px-8 -mt-5">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: user.role === "provider" ? "Total Jobs" : "Total Bookings", value: bookings.length, icon: "calendar_month" },
            { label: user.role === "provider" ? "Reviews Received" : "Reviews Given", value: myReviews.length, icon: "reviews" },
            ...(user.role === "user" ? [{ label: "Wishlist", value: wishlist.length, icon: "favorite" }] : []),
          ].map((s, idx) => (
            <motion.div 
              key={s.label} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
              className="bg-white rounded-2xl p-4 text-center shadow-sm border border-outline-variant/10"
            >
              <span className="material-symbols-outlined text-primary text-2xl">{s.icon}</span>
              <p className="text-2xl font-extrabold text-on-surface mt-1">{s.value}</p>
              <p className="text-xs text-on-surface-variant">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 md:px-8 py-8 flex gap-6">
        {/* Sidebar Tabs */}
        <div className="hidden md:block shrink-0 w-52">
          <div className="bg-white rounded-2xl border border-outline-variant/10 overflow-hidden shadow-sm p-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left mb-1 last:mb-0 transition-all ${
                  activeTab === t.key ? "bg-primary/10 text-primary" : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-xl">{t.icon}</span>
                <span className="text-sm font-semibold">{t.label}</span>
              </button>
            ))}
            <div className="border-t border-outline-variant/10 mt-2 pt-2">
              <button onClick={() => { logout(); navigate("/"); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-error hover:bg-error/10 text-left">
                <span className="material-symbols-outlined text-xl">logout</span>
                <span className="text-sm font-semibold">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Tab Row */}
        <div className="md:hidden w-full -mt-2 mb-4 flex gap-2 overflow-x-auto scrollbar-hide absolute left-0 px-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all ${
                activeTab === t.key ? "bg-primary text-on-primary" : "bg-white border border-outline-variant/30 text-on-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined text-sm">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 mt-12 md:mt-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full"
            >
              {/* BOOKINGS */}
              {activeTab === "bookings" && (
                <div className="space-y-5">
              {pending.length > 0 && (
                <div>
                  <h2 className="font-bold text-on-surface text-lg mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500">pending_actions</span> Pending Requests ({pending.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pending.map((b) => <BookingCard key={b.id} booking={b} onReview={setReviewTarget} onUpdateStatus={updateBookingStatus} role={user.role} />)}
                  </div>
                </div>
              )}
              
              <div>
                <h2 className="font-bold text-on-surface text-lg mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">upcoming</span> Upcoming ({upcoming.length})
                </h2>
                {upcoming.length === 0 && pending.length === 0 ? (
                  <EmptyState icon="calendar_month" title={user.role === "provider" ? "No jobs yet" : "No upcoming bookings"} description={user.role === "provider" ? "Share your profile to get booked." : "Book a service to get started."} action={() => navigate("/services")} actionLabel="Browse Services" />
                ) : upcoming.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">No confirmed upcoming bookings.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {upcoming.map((b) => <BookingCard key={b.id} booking={b} onReview={setReviewTarget} onUpdateStatus={updateBookingStatus} role={user.role} />)}
                  </div>
                )}
              </div>
              <div>
                <h2 className="font-bold text-on-surface text-lg mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary">task_alt</span> Past ({past.length})
                </h2>
                {past.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">No completed bookings yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {past.map((b) => <BookingCard key={b.id} booking={b} onReview={setReviewTarget} onUpdateStatus={updateBookingStatus} role={user.role} />)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* REVIEWS */}
          {activeTab === "reviews" && (
            <div className="space-y-4">
              <h2 className="font-bold text-on-surface text-lg">{user.role === "provider" ? "Reviews Received" : "My Reviews"} ({myReviews.length})</h2>
              {myReviews.length === 0 ? (
                <EmptyState icon="reviews" title="No reviews yet" description="Complete a booking to leave a review." />
              ) : (
                myReviews.map((r) => <ReviewCard key={r.id} review={r} />)
              )}
            </div>
          )}

          {/* WISHLIST */}
          {activeTab === "wishlist" && (
            <div>
              <h2 className="font-bold text-on-surface text-lg mb-4">Wishlist ({wishlisted.length})</h2>
              {wishlisted.length === 0 ? (
                <EmptyState icon="favorite" title="Your wishlist is empty" description="Save providers you like to revisit them anytime." action={() => navigate("/services")} actionLabel="Browse Services" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {wishlisted.map((p) => (
                    <div key={p.id} className="bg-white rounded-2xl p-4 border border-outline-variant/10 flex items-center gap-4 hover:shadow-md transition-all">
                      <img src={p.avatar} alt={p.name} className="w-12 h-12 rounded-xl bg-surface-container" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-on-surface text-sm">{p.name}</p>
                        <p className="text-xs text-on-surface-variant">{p.service}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-secondary text-xs fill-icon">star</span>
                          <span className="text-xs font-bold">{p.rating}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => toggleWishlist(p.id)} className="text-secondary hover:opacity-70 transition-opacity">
                          <span className="material-symbols-outlined fill-icon">favorite</span>
                        </button>
                        <button onClick={() => navigate(`/provider/${p.id}`)} className="text-primary hover:opacity-70 transition-opacity">
                          <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* RECENTLY VIEWED */}
          {activeTab === "recent" && (
            <div>
              <h2 className="font-bold text-on-surface text-lg mb-4">Recently Viewed ({recentlyViewed.length})</h2>
              {recentlyViewed.length === 0 ? (
                <EmptyState icon="history" title="Nothing here yet" description="Providers you visit will appear here." action={() => navigate("/services")} actionLabel="Browse Services" />
              ) : (
                <div className="space-y-3">
                  {recentlyViewed.map((p) => (
                    <button key={p.id} onClick={() => navigate(`/provider/${p.id}`)} className="w-full bg-white rounded-2xl p-4 border border-outline-variant/10 flex items-center gap-4 hover:shadow-md transition-all text-left">
                      <img src={p.avatar} alt={p.name} className="w-11 h-11 rounded-xl bg-surface-container" />
                      <div>
                        <p className="font-bold text-on-surface text-sm">{p.name}</p>
                        <p className="text-xs text-on-surface-variant">{p.service} · ₹{p.price}+</p>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant ml-auto">chevron_right</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === "settings" && (
            <div className="space-y-4">
              <h2 className="font-bold text-on-surface text-lg">Account Settings</h2>
              <div className="bg-white rounded-2xl border border-outline-variant/10 divide-y divide-outline-variant/10">
                {[
                  { label: "Full Name", key: "name", value: user.name, icon: "person", editable: true },
                  { label: "Email", key: "email", value: user.email, icon: "email", editable: true },
                  { label: "Phone", key: "phone", value: user.phone || "Not set", icon: "phone", editable: true },
                  { label: "Location", key: "location", value: user.location || "Not set", icon: "location_on", editable: true },
                  { label: "Role", key: "role", value: user.role === "provider" ? "Service Provider" : "User", icon: "badge", editable: false },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between px-5 py-4 min-h-[72px]">
                    <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                      <span className={`material-symbols-outlined ${activeEditField === item.key ? "text-primary mt-1 self-start" : "text-primary"}`}>{item.icon}</span>
                      <div className="flex-1 w-full min-w-0">
                        <p className="text-xs text-on-surface-variant font-medium mb-0.5">{item.label}</p>
                        
                        {activeEditField === item.key ? (
                          <div className="w-full relative z-10 mt-1">
                            {item.key === "location" ? (
                              <LocationAutocomplete 
                                value={editValue} 
                                onChange={setEditValue} 
                                className="w-full sm:w-[350px]" 
                              />
                            ) : (
                              <input 
                                type={item.key === "email" ? "email" : "text"}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                autoFocus
                                className="w-full sm:w-[350px] bg-white border border-primary/40 focus:border-primary shadow-sm text-sm text-on-surface font-semibold px-3 py-2.5 rounded-lg focus:outline-none transition-all"
                              />
                            )}
                          </div>
                        ) : (
                          <p className="font-semibold text-on-surface text-sm truncate">{item.value}</p>
                        )}
                      </div>
                    </div>
                    
                    {item.editable && (
                      <div className="shrink-0 flex items-center">
                        {activeEditField === item.key ? (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setActiveEditField(null)} 
                              className="text-on-surface-variant text-xs font-semibold hover:text-on-surface px-2 py-1 rounded"
                              disabled={savingProfile}
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={() => handleSaveProfile(item.key)} 
                              className="bg-primary text-on-primary text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-primary-dim shadow-sm flex items-center gap-1"
                              disabled={savingProfile}
                            >
                              {savingProfile ? "Saving..." : "Save"}
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => {
                              setEditValue(item.value === "Not set" ? "" : item.value);
                              setActiveEditField(item.key);
                            }} 
                            className="text-primary text-xs font-bold hover:underline py-1 px-2 -mr-2"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => { logout(); navigate("/"); }}
                className="w-full py-3 rounded-xl border border-error/30 text-error font-bold text-sm hover:bg-error/5 transition-colors flex items-center justify-center gap-2 mt-8"
              >
                <span className="material-symbols-outlined">logout</span> Logout
              </button>
            </div>
          )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {reviewTarget && (
        <ReviewModal
          providerId={reviewTarget.providerProfileId}
          providerName={reviewTarget.providerName}
          onClose={() => setReviewTarget(null)}
        />
      )}
    </div>
  );
}
