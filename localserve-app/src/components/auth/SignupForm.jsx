import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { indianCities } from "../../data/mockData";

function InputField({ label, icon, type = "text", value, onChange, error, placeholder, children }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">{label}</label>
      <div className={`relative flex items-center border rounded-xl overflow-hidden transition-all ${error ? "border-error bg-error/5" : "border-outline-variant/40 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 bg-surface-container-lowest"}`}>
        {icon && (
          <span className={`material-symbols-outlined px-3 text-xl ${error ? "text-error" : "text-on-surface-variant"}`}>{icon}</span>
        )}
        {children || (
          <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="flex-1 py-3 pr-4 bg-transparent text-on-surface placeholder-on-surface-variant/50 text-sm focus:outline-none"
          />
        )}
      </div>
      {error && <p className="text-xs text-error flex items-center gap-1"><span className="material-symbols-outlined text-xs">error</span>{error}</p>}
    </div>
  );
}

export default function SignupForm({ role, onSwitchToLogin, onBack }) {
  const { signup } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "", location: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = "Name must be at least 2 characters";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address";
    if (!/^\d{10}$/.test(form.phone)) e.phone = "Enter a valid 10-digit phone number";
    if (form.password.length < 6) e.password = "Password must be at least 6 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    if (!form.location) e.location = "Please select your city";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    
    setLoading(true);
    // Artificial delay for UI polish 
    await new Promise(r => setTimeout(r, 600));
    
    const res = await signup({ ...form, role });
    setLoading(false);
    
    if (!res.success) {
      setApiError(res.error || "An unexpected error occurred. Please try again.");
    }
  };

  const roleColor = role === "provider" ? "secondary" : "primary";

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
        </button>
        <div>
          <h2 className="text-xl font-headline font-extrabold text-on-surface">Create your account</h2>
          <p className="text-xs text-on-surface-variant">
            Joining as <span className={`font-bold text-${roleColor}`}>{role === "provider" ? "Service Provider" : "User"}</span>
          </p>
        </div>
      </div>

      {apiError && (
        <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-xl flex items-center gap-2 text-error text-sm font-semibold">
          <span className="material-symbols-outlined">error</span>
          <span>{apiError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField label="Full Name" icon="person" value={form.name} onChange={set("name")} error={errors.name} placeholder="e.g. Anjali Mehta" />
        <InputField label="Email Address" icon="email" type="email" value={form.email} onChange={set("email")} error={errors.email} placeholder="you@example.com" />
        <InputField label="Phone Number" icon="phone" type="tel" value={form.phone} onChange={set("phone")} error={errors.phone} placeholder="10-digit mobile number" />

        {/* Password */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Password</label>
          <div className={`flex items-center border rounded-xl overflow-hidden ${errors.password ? "border-error bg-error/5" : "border-outline-variant/40 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 bg-surface-container-lowest"}`}>
            <span className={`material-symbols-outlined px-3 text-xl ${errors.password ? "text-error" : "text-on-surface-variant"}`}>lock</span>
            <input
              type={showPass ? "text" : "password"}
              value={form.password}
              onChange={set("password")}
              placeholder="At least 6 characters"
              className="flex-1 py-3 bg-transparent text-on-surface placeholder-on-surface-variant/50 text-sm focus:outline-none"
            />
            <button type="button" onClick={() => setShowPass((p) => !p)} className="px-3 text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-xl">{showPass ? "visibility_off" : "visibility"}</span>
            </button>
          </div>
          {errors.password && <p className="text-xs text-error flex items-center gap-1"><span className="material-symbols-outlined text-xs">error</span>{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Confirm Password</label>
          <div className={`flex items-center border rounded-xl overflow-hidden ${errors.confirmPassword ? "border-error bg-error/5" : "border-outline-variant/40 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 bg-surface-container-lowest"}`}>
            <span className={`material-symbols-outlined px-3 text-xl ${errors.confirmPassword ? "text-error" : "text-on-surface-variant"}`}>lock_reset</span>
            <input
              type={showConfirm ? "text" : "password"}
              value={form.confirmPassword}
              onChange={set("confirmPassword")}
              placeholder="Re-enter password"
              className="flex-1 py-3 bg-transparent text-on-surface placeholder-on-surface-variant/50 text-sm focus:outline-none"
            />
            <button type="button" onClick={() => setShowConfirm((p) => !p)} className="px-3 text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-xl">{showConfirm ? "visibility_off" : "visibility"}</span>
            </button>
          </div>
          {errors.confirmPassword && <p className="text-xs text-error flex items-center gap-1"><span className="material-symbols-outlined text-xs">error</span>{errors.confirmPassword}</p>}
        </div>

        {/* Location */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">City / Location</label>
          <div className={`flex items-center border rounded-xl overflow-hidden ${errors.location ? "border-error bg-error/5" : "border-outline-variant/40 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 bg-surface-container-lowest"}`}>
            <span className={`material-symbols-outlined px-3 text-xl ${errors.location ? "text-error" : "text-on-surface-variant"}`}>location_on</span>
            <select
              value={form.location}
              onChange={set("location")}
              className="flex-1 py-3 pr-4 bg-transparent text-on-surface text-sm focus:outline-none cursor-pointer"
            >
              <option value="">Select your city</option>
              {indianCities.map((city) => <option key={city} value={city}>{city}</option>)}
            </select>
          </div>
          {errors.location && <p className="text-xs text-error flex items-center gap-1"><span className="material-symbols-outlined text-xs">error</span>{errors.location}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-[0.98] ${
            role === "provider"
              ? "bg-secondary text-on-secondary hover:bg-secondary-dim"
              : "bg-primary text-on-primary hover:bg-primary-dim"
          } ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
              Creating account...
            </span>
          ) : "Create Account"}
        </button>
      </form>

      <p className="text-center text-sm text-on-surface-variant mt-4">
        Already have an account?{" "}
        <button onClick={onSwitchToLogin} className="text-primary font-bold hover:underline">Login</button>
      </p>
    </div>
  );
}
