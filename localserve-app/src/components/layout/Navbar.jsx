import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { serviceCategories } from "../../data/mockData";

function NotificationDropdown({ onClose }) {
  const { notifications, markAllRead, unreadCount } = useApp();
  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-outline-variant/20 overflow-hidden animate-slideDown z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/10">
        <span className="font-bold text-on-surface text-sm">Notifications</span>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-xs text-primary font-semibold hover:underline">Mark all read</button>
        )}
      </div>
      <div className="max-h-72 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-on-surface-variant text-sm">No notifications</div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className={`px-4 py-3 border-b border-outline-variant/10 last:border-0 ${!n.read ? "bg-primary/5" : ""}`}>
              <p className="text-sm text-on-surface leading-snug">{n.message}</p>
              <p className="text-xs text-on-surface-variant mt-1">{n.time}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ServicesDropdown({ onClose }) {
  const navigate = useNavigate();
  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 bg-white rounded-xl shadow-2xl border border-outline-variant/20 overflow-hidden animate-slideDown z-50 p-2">
      {serviceCategories.map((cat) => (
        <button
          key={cat.name}
          onClick={() => { navigate(`/services?q=${encodeURIComponent(cat.name)}`); onClose(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-container-low text-left group"
        >
          <span className={`material-symbols-outlined ${cat.color} text-xl`}>{cat.icon}</span>
          <span className="text-on-surface font-medium text-sm group-hover:text-primary">{cat.name}</span>
        </button>
      ))}
    </div>
  );
}

function UserDropdown({ onClose }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const items = [
    { label: "My Dashboard", icon: "dashboard", path: user?.role === "provider" ? "/provider-dashboard" : "/dashboard" },
    { label: "My Bookings", icon: "calendar_month", path: "/dashboard?tab=bookings" },
    { label: "My Reviews", icon: "reviews", path: "/dashboard?tab=reviews" },
    { label: "Wishlist", icon: "favorite", path: "/dashboard?tab=wishlist" },
    { label: "Settings", icon: "settings", path: "/dashboard?tab=settings" },
  ];
  return (
    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-2xl border border-outline-variant/20 overflow-hidden animate-slideDown z-50 p-2">
      {items.map((item) => (
        <button
          key={item.label}
          onClick={() => { navigate(item.path); onClose(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-container-low text-left group"
        >
          <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-xl">{item.icon}</span>
          <span className="text-on-surface text-sm font-medium group-hover:text-primary">{item.label}</span>
        </button>
      ))}
      <div className="my-1 border-t border-outline-variant/20" />
      <button
        onClick={() => { logout(); onClose(); navigate("/"); }}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-error/10 text-left group"
      >
        <span className="material-symbols-outlined text-error text-xl">logout</span>
        <span className="text-error text-sm font-medium">Logout</span>
      </button>
    </div>
  );
}

function JoinDropdown({ onClose }) {
  const navigate = useNavigate();
  return (
    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-2xl border border-outline-variant/20 overflow-hidden animate-slideDown z-50 p-2">
      <button
        onClick={() => { navigate("/auth?mode=signup&role=user"); onClose(); }}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-primary/5 text-left"
      >
        <span className="material-symbols-outlined text-primary">person</span>
        <div>
          <p className="font-semibold text-sm text-on-surface">Join as User</p>
          <p className="text-xs text-on-surface-variant">Find & book services</p>
        </div>
      </button>
      <button
        onClick={() => { navigate("/auth?mode=signup&role=provider"); onClose(); }}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary/5 text-left"
      >
        <span className="material-symbols-outlined text-secondary">handyman</span>
        <div>
          <p className="font-semibold text-sm text-on-surface">Join as Provider</p>
          <p className="text-xs text-on-surface-variant">Offer your services</p>
        </div>
      </button>
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [openDropdown, setOpenDropdown] = useState(null); // "services"|"user"|"join"|"notifications"
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpenDropdown(null);
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setOpenDropdown(null);
    setMobileOpen(false);
  }, [location]);

  const toggle = (name) => setOpenDropdown((prev) => (prev === name ? null : name));

  return (
    <header
      ref={ref}
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-surface"
      }`}
    >
      <nav className="flex justify-between items-center px-6 md:px-8 py-3 max-w-7xl mx-auto">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-on-primary text-lg fill-icon">auto_awesome</span>
          </div>
          <span className="text-xl font-headline font-extrabold text-primary tracking-tight">LocalServe <span className="text-secondary">AI</span></span>
        </Link>

        {/* Center Nav */}
        <div className="hidden md:flex items-center gap-1">
          <div className="relative">
            <button
              onClick={() => toggle("services")}
              className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                openDropdown === "services" ? "bg-primary/10 text-primary" : "text-on-surface-variant hover:text-primary hover:bg-primary/5"
              }`}
            >
              Services
              <span className={`material-symbols-outlined text-sm transition-transform ${openDropdown === "services" ? "rotate-180" : ""}`}>expand_more</span>
            </button>
            {openDropdown === "services" && <ServicesDropdown onClose={() => setOpenDropdown(null)} />}
          </div>
          <Link to="/services" className="px-4 py-2 rounded-full text-sm font-semibold text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-all">
            Browse All
          </Link>
          <Link to="/#about" className="px-4 py-2 rounded-full text-sm font-semibold text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-all">
            About Us
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => toggle("notifications")}
                  className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-secondary text-on-secondary text-[9px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                {openDropdown === "notifications" && <NotificationDropdown onClose={() => setOpenDropdown(null)} />}
              </div>

              {/* Avatar */}
              <div className="relative">
                <button
                  onClick={() => toggle("user")}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-surface-container transition-colors border border-outline-variant/30"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-7 h-7 rounded-full bg-primary-container object-cover"
                  />
                  <span className="text-sm font-semibold text-on-surface hidden md:block max-w-[100px] truncate">{user.name.split(" ")[0]}</span>
                  <span className={`material-symbols-outlined text-sm text-on-surface-variant transition-transform ${openDropdown === "user" ? "rotate-180" : ""}`}>expand_more</span>
                </button>
                {openDropdown === "user" && <UserDropdown onClose={() => setOpenDropdown(null)} />}
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate("/auth?mode=login")}
                className="px-4 py-2 rounded-full text-sm font-semibold text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-all hidden md:block"
              >
                Login
              </button>
              <div className="relative">
                <button
                  onClick={() => toggle("join")}
                  className="bg-primary text-on-primary px-5 py-2 rounded-full text-sm font-bold hover:bg-primary-dim transition-all hover:scale-95 flex items-center gap-1"
                >
                  Join Now
                  <span className={`material-symbols-outlined text-sm transition-transform ${openDropdown === "join" ? "rotate-180" : ""}`}>expand_more</span>
                </button>
                {openDropdown === "join" && <JoinDropdown onClose={() => setOpenDropdown(null)} />}
              </div>
            </>
          )}

          {/* Mobile Hamburger */}
          <button
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
            onClick={() => setMobileOpen((p) => !p)}
          >
            <span className="material-symbols-outlined text-on-surface">{mobileOpen ? "close" : "menu"}</span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-outline-variant/20 px-4 py-4 space-y-1 animate-slideDown">
          <Link to="/services" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-container-low font-semibold text-on-surface">
            <span className="material-symbols-outlined text-primary">grid_view</span> Browse Services
          </Link>
          {!user && (
            <>
              <button onClick={() => navigate("/auth?mode=login")} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-container-low font-semibold text-on-surface text-left">
                <span className="material-symbols-outlined text-primary">login</span> Login
              </button>
              <button onClick={() => navigate("/auth?mode=signup")} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary text-on-primary font-bold text-left">
                <span className="material-symbols-outlined">person_add</span> Join Now
              </button>
            </>
          )}
          {user && (
            <>
              <div className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant/10 mb-1">
                <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover bg-primary-container" />
                <div>
                  <p className="font-bold text-on-surface text-sm">{user.name}</p>
                  <p className="text-xs text-on-surface-variant capitalize">{user.role}</p>
                </div>
              </div>
              <Link to={user?.role === "provider" ? "/provider-dashboard" : "/dashboard"} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-container-low font-semibold text-on-surface">
                <span className="material-symbols-outlined text-primary">dashboard</span> My Dashboard
              </Link>
              <Link to="/dashboard?tab=bookings" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-container-low font-semibold text-on-surface">
                <span className="material-symbols-outlined text-primary">calendar_month</span> My Bookings
              </Link>
              <Link to="/dashboard?tab=reviews" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-container-low font-semibold text-on-surface">
                <span className="material-symbols-outlined text-primary">reviews</span> My Reviews
              </Link>
              {user.role === "user" && (
                <Link to="/dashboard?tab=wishlist" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-container-low font-semibold text-on-surface">
                  <span className="material-symbols-outlined text-primary">favorite</span> Wishlist
                </Link>
              )}
              <Link to="/dashboard?tab=settings" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-container-low font-semibold text-on-surface">
                <span className="material-symbols-outlined text-primary">settings</span> Settings
              </Link>
              <div className="border-t border-outline-variant/10 mt-1 pt-1">
                <button
                  onClick={() => { logout(); navigate("/"); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-error/10 font-semibold text-error text-left"
                >
                  <span className="material-symbols-outlined">logout</span> Logout
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
}
