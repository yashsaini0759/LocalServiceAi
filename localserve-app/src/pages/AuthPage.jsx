import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RoleSelect from "../components/auth/RoleSelect";
import SignupForm from "../components/auth/SignupForm";
import LoginForm from "../components/auth/LoginForm";

export default function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const initialMode = params.get("mode") || "login";
  const initialRole = params.get("role") || null;

  const [mode, setMode] = useState(initialMode); // "login" | "role-select" | "signup"
  const [role, setRole] = useState(initialRole); // "user" | "provider"

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user]);

  useEffect(() => {
    if (initialMode === "signup" && initialRole) {
      setRole(initialRole);
      setMode("signup");
    } else if (initialMode === "signup") {
      setMode("role-select");
    } else {
      setMode("login");
    }
  }, [initialMode, initialRole]);

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setMode("signup");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center px-4 py-16 pt-24">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-outline-variant/10">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-on-primary fill-icon">auto_awesome</span>
              </div>
              <span className="text-xl font-headline font-extrabold text-primary">LocalServe <span className="text-secondary">AI</span></span>
            </div>
          </div>

          {/* Forms */}
          {mode === "login" && (
            <LoginForm onSwitchToSignup={() => setMode("role-select")} />
          )}
          {mode === "role-select" && (
            <RoleSelect onSelect={handleRoleSelect} />
          )}
          {mode === "signup" && (
            <SignupForm
              role={role}
              onSwitchToLogin={() => setMode("login")}
              onBack={() => setMode("role-select")}
            />
          )}

          {/* Switch bottom link */}
          {mode === "role-select" && (
            <p className="text-center text-sm text-on-surface-variant mt-4">
              Already have an account?{" "}
              <button onClick={() => setMode("login")} className="text-primary font-bold hover:underline">Login</button>
            </p>
          )}
        </div>

        {/* Trust indicators */}
        <div className="flex justify-center gap-6 mt-6">
          {[
            { icon: "shield", label: "Secure" },
            { icon: "verified", label: "Verified" },
            { icon: "lock", label: "Private" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5 text-on-surface-variant text-xs font-semibold">
              <span className="material-symbols-outlined text-primary text-base">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
