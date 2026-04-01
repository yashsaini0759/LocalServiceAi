import { Link } from "react-router-dom";
import { serviceCategories } from "../../data/mockData";

export default function Footer() {
  return (
    <footer className="bg-on-background text-on-error mt-0">
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-lg fill-icon">auto_awesome</span>
              </div>
              <span className="text-xl font-headline font-extrabold text-white">LocalServe <span className="text-secondary-fixed-dim">AI</span></span>
            </div>
            <p className="text-on-surface-variant max-w-xs leading-relaxed text-sm">
              Your intelligent companion for finding and booking the best local services. Powered by AI for smart recommendations.
            </p>
            <div className="flex gap-3">
              {["facebook", "twitter", "instagram", "linkedin"].map((s) => (
                <button key={s} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary/40 transition-colors">
                  <span className="material-symbols-outlined text-sm text-white">link</span>
                </button>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Services</h4>
            <ul className="space-y-2">
              {serviceCategories.slice(0, 5).map((cat) => (
                <li key={cat.name}>
                  <Link to={`/services?q=${encodeURIComponent(cat.name)}`} className="text-on-surface-variant text-sm hover:text-white transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-2">
              {["About Us", "Careers", "Blog", "Help Center", "Privacy Policy", "Terms of Service"].map((l) => (
                <li key={l}>
                  <a href="#" className="text-on-surface-variant text-sm hover:text-white transition-colors">{l}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-on-surface-variant text-sm">© 2026 LocalServe AI. All rights reserved.</p>
          <div className="flex items-center gap-2 text-on-surface-variant text-sm">
            <span className="material-symbols-outlined text-primary text-base fill-icon">auto_awesome</span>
            Powered by AI Technology
          </div>
        </div>
      </div>
    </footer>
  );
}
