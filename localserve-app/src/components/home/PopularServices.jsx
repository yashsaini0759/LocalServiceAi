import { useNavigate } from "react-router-dom";
import { popularServices } from "../../data/mockData";

export default function PopularServices() {
  const navigate = useNavigate();
  return (
    <section className="max-w-7xl mx-auto px-6 md:px-8 py-20">
      <h2 className="text-3xl font-headline font-extrabold text-on-surface mb-10">Popular Services This Week</h2>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-outline-variant/10">
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-outline-variant/10">
          {popularServices.map((svc) => (
            <button
              key={svc.name}
              onClick={() => navigate(`/services?q=${encodeURIComponent(svc.name)}`)}
              className="p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors cursor-pointer group text-left"
            >
              <div className="flex items-center gap-4">
                <span className={`material-symbols-outlined ${svc.color} text-2xl`}>{svc.icon}</span>
                <span className="font-semibold text-on-surface group-hover:text-primary transition-colors">{svc.name}</span>
              </div>
              <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-full group-hover:bg-primary group-hover:text-on-primary transition-all">
                {svc.badge}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
