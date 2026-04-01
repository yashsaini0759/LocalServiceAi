export default function RoleSelect({ onSelect }) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-headline font-extrabold text-on-surface">Join LocalServe AI</h2>
        <p className="text-on-surface-variant text-sm">Choose how you'd like to use the platform</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* User Card */}
        <button
          onClick={() => onSelect("user")}
          className="group p-6 rounded-2xl border-2 border-outline-variant/30 hover:border-primary hover:bg-primary/5 transition-all text-left space-y-3 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-primary text-2xl">person</span>
          </div>
          <div>
            <p className="font-bold text-on-surface group-hover:text-primary transition-colors">Join as User</p>
            <p className="text-xs text-on-surface-variant mt-1 leading-snug">Search, compare, and book trusted professionals</p>
          </div>
          <div className="flex items-center gap-1 text-primary text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
            Get Started <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </div>
        </button>

        {/* Provider Card */}
        <button
          onClick={() => onSelect("provider")}
          className="group p-6 rounded-2xl border-2 border-outline-variant/30 hover:border-secondary hover:bg-secondary/5 transition-all text-left space-y-3 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-secondary/10 group-hover:bg-secondary/20 flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-secondary text-2xl">handyman</span>
          </div>
          <div>
            <p className="font-bold text-on-surface group-hover:text-secondary transition-colors">Join as Provider</p>
            <p className="text-xs text-on-surface-variant mt-1 leading-snug">List your services and grow your client base</p>
          </div>
          <div className="flex items-center gap-1 text-secondary text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
            Get Started <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </div>
        </button>
      </div>

      <div className="p-4 bg-surface-container-low rounded-xl">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-tertiary text-lg fill-icon">verified</span>
          <div>
            <p className="text-sm font-semibold text-on-surface">All providers are verified</p>
            <p className="text-xs text-on-surface-variant mt-0.5">Background checks, identity verification, and skill assessments.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
