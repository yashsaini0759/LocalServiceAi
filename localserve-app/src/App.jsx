import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import HomePage from "./pages/HomePage";
import ServicesPage from "./pages/ServicesPage";
import ProviderProfilePage from "./pages/ProviderProfilePage";
import DashboardPage from "./pages/DashboardPage";
import ProviderDashboard from "./pages/ProviderDashboard";
import AuthPage from "./pages/AuthPage";
import ScrollToTop from "./components/ui/ScrollToTop";



export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <ScrollToTop />
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/provider/:id" element={<ProviderProfilePage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/provider-dashboard" element={<ProviderDashboard />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Footer />
          </div>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center pt-20 text-center px-6">
      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-primary text-5xl">error</span>
      </div>
      <h1 className="text-3xl font-headline font-extrabold text-on-surface mb-3">Page Not Found</h1>
      <p className="text-on-surface-variant mb-6">The page you're looking for doesn't exist.</p>
      <a href="/" className="bg-primary text-on-primary px-6 py-3 rounded-full font-bold hover:bg-primary-dim transition-all">
        Go Home
      </a>
    </div>
  );
}
