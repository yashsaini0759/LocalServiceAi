export default function StatsSection() {
  const stats = [
    { value: "24/7", label: "Instant Booking Support", icon: "schedule", color: "bg-[#ff9a62]", rotate: "rotate-2" },
    { value: "2k+", label: "Services Completed", icon: "task_alt", color: "bg-[#929bfa]", rotate: "-rotate-1 translate-y-8", fill: true },
    { value: "98%", label: "AI Match Accuracy", icon: "auto_awesome", color: "bg-[#81f3e5]", rotate: "-rotate-2", textDark: true },
    { value: "4.9", label: "User Trust Rating", icon: "star", color: "bg-[#ffc2ce]", rotate: "rotate-1 translate-y-8", fill: true, textDark: true },
  ];

  const features = [
    "Fully Background Checked Professionals",
    "Transparent Upfront Pricing",
    "Service Guarantee Insurance",
    "Real-time Booking Tracking",
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 md:px-8 py-20 lg:py-28 grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
      {/* Stats Grid */}
      <div className="order-2 lg:order-1 grid grid-cols-2 gap-5">
        {stats.map((stat) => (
          <div
            key={stat.value}
            className={`${stat.color} p-7 rounded-2xl space-y-3 shadow-lg transform ${stat.rotate} transition-transform hover:rotate-0 hover:scale-105 cursor-default`}
          >
            <span className={`material-symbols-outlined text-4xl ${stat.fill ? "fill-icon" : ""} ${stat.textDark ? "text-on-surface" : "text-white"}`}>
              {stat.icon}
            </span>
            <h3 className={`text-4xl font-extrabold font-headline ${stat.textDark ? "text-on-surface" : "text-white"}`}>{stat.value}</h3>
            <p className={`font-semibold text-sm opacity-90 ${stat.textDark ? "text-on-surface-variant" : "text-white"}`}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Text */}
      <div className="order-1 lg:order-2 space-y-7">
        <div className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
          Trust &amp; Reliability
        </div>
        <h2 className="text-4xl lg:text-5xl font-headline font-extrabold text-on-surface leading-tight">
          The Smartest Way to Book Local Services
        </h2>
        <p className="text-lg text-on-surface-variant leading-relaxed">
          We've eliminated the guesswork. Our AI analyzes thousands of reviews and performance data to match you with the perfect professional for your specific project.
        </p>
        <ul className="space-y-3">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-full bg-tertiary/20 flex items-center justify-center text-tertiary shrink-0">
                <span className="material-symbols-outlined text-sm font-bold">check</span>
              </div>
              <span className="font-semibold text-on-surface">{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
