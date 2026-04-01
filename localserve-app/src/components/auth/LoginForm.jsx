import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function LoginForm({ onSwitchToSignup }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ emailOrPhone: "", password: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.emailOrPhone.trim()) e.emailOrPhone = "Email or phone is required";
    if (!form.password) e.password = "Password is required";
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
    
    const res = await login({ emailOrPhone: form.emailOrPhone, password: form.password });
    setLoading(false);
    
    if (!res.success) {
      setApiError(res.error || "Invalid credentials. Please try again.");
    }
  };

  const handleForgot = () => {
    setForgotSent(true);
    setTimeout(() => setForgotSent(false), 4000);
  };

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-headline font-extrabold text-on-surface">Welcome back!</h2>
        <p className="text-on-surface-variant text-sm">Login to your LocalServe AI account</p>
      </div>

      {apiError && (
        <div className="p-3 bg-error/10 border border-error/20 rounded-xl flex items-center gap-2 text-error text-sm font-semibold">
          <span className="material-symbols-outlined">error</span>
          <span>{apiError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email/Phone */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Email or Phone</label>
          <div className={`flex items-center border rounded-xl overflow-hidden ${errors.emailOrPhone ? "border-error bg-error/5" : "border-outline-variant/40 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 bg-surface-container-lowest"}`}>
            <span className={`material-symbols-outlined px-3 text-xl ${errors.emailOrPhone ? "text-error" : "text-on-surface-variant"}`}>person</span>
            <input
              type="text"
              value={form.emailOrPhone}
              onChange={set("emailOrPhone")}
              placeholder="you@example.com or 9876543210"
              className="flex-1 py-3 pr-4 bg-transparent text-on-surface placeholder-on-surface-variant/50 text-sm focus:outline-none"
            />
          </div>
          {errors.emailOrPhone && <p className="text-xs text-error flex items-center gap-1"><span className="material-symbols-outlined text-xs">error</span>{errors.emailOrPhone}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Password</label>
            <button type="button" onClick={handleForgot} className="text-xs text-primary font-semibold hover:underline">
              {forgotSent ? "✓ Reset link sent!" : "Forgot Password?"}
            </button>
          </div>
          <div className={`flex items-center border rounded-xl overflow-hidden ${errors.password ? "border-error bg-error/5" : "border-outline-variant/40 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 bg-surface-container-lowest"}`}>
            <span className={`material-symbols-outlined px-3 text-xl ${errors.password ? "text-error" : "text-on-surface-variant"}`}>lock</span>
            <input
              type={showPass ? "text" : "password"}
              value={form.password}
              onChange={set("password")}
              placeholder="Enter your password"
              className="flex-1 py-3 bg-transparent text-on-surface placeholder-on-surface-variant/50 text-sm focus:outline-none"
            />
            <button type="button" onClick={() => setShowPass((p) => !p)} className="px-3 text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-xl">{showPass ? "visibility_off" : "visibility"}</span>
            </button>
          </div>
          {errors.password && <p className="text-xs text-error flex items-center gap-1"><span className="material-symbols-outlined text-xs">error</span>{errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3.5 rounded-xl bg-primary text-on-primary font-bold text-sm hover:bg-primary-dim transition-all hover:scale-[0.98] ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
              Logging in...
            </span>
          ) : "Login"}
        </button>
      </form>

      {/* Social Login */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant/20" /></div>
        <div className="relative text-center"><span className="bg-white px-3 text-xs text-on-surface-variant">or continue with</span></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {["Google", "Apple"].map((provider) => (
          <button key={provider} className="flex items-center justify-center gap-2 border border-outline-variant/30 rounded-xl py-2.5 hover:bg-surface-container-low transition-colors text-sm font-semibold text-on-surface">
            <span className="material-symbols-outlined text-lg">{provider === "Google" ? "g_translate" : "phone_iphone"}</span>
            {provider}
          </button>
        ))}
      </div>

      <p className="text-center text-sm text-on-surface-variant">
        Don't have an account?{" "}
        <button onClick={onSwitchToSignup} className="text-primary font-bold hover:underline">Sign up</button>
      </p>
    </div>
  );
}
