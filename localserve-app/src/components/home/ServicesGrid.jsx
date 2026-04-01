import { useNavigate } from "react-router-dom";
import { serviceCategories } from "../../data/mockData";

const extendedServices = [
  ...serviceCategories,
  { name: "Painting", icon: "format_paint", color: "text-orange-600", bg: "bg-orange-100" },
  { name: "Carpentry", icon: "carpenter", color: "text-amber-700", bg: "bg-amber-100" },
  { name: "Security", icon: "security", color: "text-slate-600", bg: "bg-slate-100" },
  { name: "Gardening", icon: "yard", color: "text-green-700", bg: "bg-green-100" },
];

export default function ServicesGrid() {
  const navigate = useNavigate();
  return (
    <section className="bg-surface-container-low py-20">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <div className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">Our Services</div>
            <h2 className="text-3xl font-headline font-extrabold text-on-surface mb-2">Explore Services Near You</h2>
            <p className="text-on-surface-variant">Quality professionals for every need, just a click away.</p>
          </div>
          <button
            onClick={() => navigate("/services")}
            className="hidden md:flex items-center gap-1 text-primary font-bold hover:underline text-sm"
          >
            View All <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {extendedServices.map((svc, i) => (
            <div
              key={svc.name}
              onClick={() => navigate(`/services?q=${encodeURIComponent(svc.name)}`)}
              className="group bg-white p-6 rounded-2xl transition-all hover:-translate-y-2 hover:shadow-xl cursor-pointer border border-outline-variant/10 hover:border-primary/20"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className={`h-14 w-14 rounded-xl ${svc.bg} ${svc.color} flex items-center justify-center mb-5 transition-all group-hover:scale-110`}>
                <span className="material-symbols-outlined text-3xl">{svc.icon}</span>
              </div>
              <h3 className="text-base font-bold text-on-surface mb-1 group-hover:text-primary transition-colors">{svc.name}</h3>
              <p className="text-on-surface-variant text-xs leading-relaxed mb-4">
                {getDescription(svc.name)}
              </p>
              <span className="text-primary font-bold text-xs flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                Book Now <span className="material-symbols-outlined text-xs">chevron_right</span>
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center md:hidden">
          <button onClick={() => navigate("/services")} className="flex items-center gap-1 text-primary font-bold text-sm border border-primary/30 px-5 py-2.5 rounded-full hover:bg-primary/5 transition-colors">
            View All Services <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>
    </section>
  );
}

function getDescription(name) {
  const map = {
    "Electrician": "Safety-first electrical repairs and smart home installations.",
    "Plumbing": "Leak fixes to complete pipe overhauls with verified expertise.",
    "Home Cleaning": "Eco-friendly deep cleaning for a healthier living space.",
    "Tutoring": "Personalized 1-on-1 learning with subject matter experts.",
    "AC Repair": "HVAC repair, installation, and annual maintenance.",
    "Pest Control": "Eco-safe pest elimination for home and office.",
    "Furniture Assembly": "Expert assembly for IKEA, office, and custom furniture.",
    "Elderly Care": "Compassionate, certified care for your loved ones.",
    "Painting": "Interior & exterior painting with premium finishes.",
    "Carpentry": "Custom woodwork, repairs, and door installations.",
    "Security": "CCTV, alarm, and access control systems setup.",
    "Gardening": "Lawn care, landscaping, and plant maintenance.",
  };
  return map[name] || "Professional services at your doorstep.";
}
