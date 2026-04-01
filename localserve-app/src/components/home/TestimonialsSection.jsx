const testimonials = [
  {
    name: "Sarah Jenkins",
    location: "New York, NY",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAxrn67AWKVOLfsf-xPgQVSXnDVHjAJCgoosBsw86o1NqZtxfQf4MswuNs3QtX3i9eVY3mlyaXGHHxa2lq-zLpIiyaRJbzVo45MInECqtAw85tv2HhRNnlY22nlrRVxWaU-skXiONUwlQYE7Wq9cEIOL5lc67K9JY60_WG4l9FvrKa-V8wjlPSh6t68Ikx3ZzFyjhFd4YYFod7JQN7MC7PVOX_onGby5S3AeH7SG6jXttaFL83wzVPTD5X_mPm3b3rYIS1bEPgu2t5a",
    quote: "The AI recommendation was spot on. I found an electrician within minutes, and they arrived exactly when they said they would. Highly professional!",
    rating: 5,
    featured: false,
  },
  {
    name: "David Chen",
    location: "San Francisco, CA",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCsGYp62H4d_NvZWs8zOKT_ga5_eUN7ge30Rkr6zC-v_f3RHAHFRSt2p5qIazFZa0SVnu7PC60h0YFdPEGQAyBKhQsPA_UGrGuWp13Y0zSK3x_yeaYQxI07pkyXa3p_PdXV3VsYDJg4kCPRFASETu98nh4BsgmBSilNUfD8SbYN4pmdkbgJ5mGA4XgdtM_g1tDoKPwES8Sg0rvI2YtvNwybtVfbSffnRBIRbS86U-MvFxGCgfvoWmv4NuWfcVMzZ-RjXunroDDeQyzz",
    quote: "LocalServe is my go-to for home maintenance now. The quality of pros is significantly higher than other platforms I've used in the past.",
    rating: 5,
    featured: true,
  },
  {
    name: "Elena Rodriguez",
    location: "Chicago, IL",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCuYA5x_6QGgBGIhx34pmK8Ts07Sq5m14Dj-qwVCasenysCFNs26nA6blDaxpu6j3phswl12IcY-Vnu8WJ44RurESFMwvxta3QzeUZknrGneH2EtROjoOYQc0gqaz9nv0ws1z0EeeKwwsVBuDh4nbFaWOCc_uL1VwgXp5Ybis1XukamwfnueB7N7e02pwONu39CxzXiIZwHWHrpvjjkd9HJIXGc-GHOpJCMMniIndc3_jSj3Mx2N7Cvq92g1teafzVC6F4vJjeVq2fX",
    quote: "Booking a deep cleaning service was seamless. The tracking features and secure payment gave me total peace of mind. Excellent service!",
    rating: 5,
    featured: false,
  },
];

function StarRow({ count = 5 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`material-symbols-outlined text-secondary text-sm ${i < count ? "fill-icon" : ""}`}>star</span>
      ))}
    </div>
  );
}

export default function TestimonialsSection() {
  return (
    <section className="bg-on-background py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="text-center mb-16">
          <div className="inline-block bg-white/10 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4">Testimonials</div>
          <h2 className="text-white text-3xl md:text-4xl font-headline font-extrabold mb-3">Loved by our Community</h2>
          <p className="text-on-surface-variant">See what people are saying about the LocalServe experience.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className={`relative bg-white/5 backdrop-blur-md p-7 rounded-2xl border transition-transform hover:-translate-y-1 ${
                t.featured ? "border-primary/30 bg-white/10 scale-[1.02] shadow-2xl z-10" : "border-white/10"
              }`}
            >
              <span className="material-symbols-outlined text-primary text-5xl opacity-20 absolute top-4 right-4 fill-icon">format_quote</span>

              <div className="flex items-center gap-3 mb-5">
                <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover bg-surface-container" />
                <div>
                  <h4 className="text-white font-bold text-sm">{t.name}</h4>
                  <p className="text-on-surface-variant text-xs">{t.location}</p>
                </div>
              </div>

              <StarRow count={t.rating} />

              <p className="text-on-error/90 leading-relaxed italic text-sm mt-3">"{t.quote}"</p>
            </div>
          ))}
        </div>

        {/* Trust numbers */}
        <div className="mt-16 grid grid-cols-3 gap-6 text-center">
          {[
            { value: "10k+", label: "Happy Customers" },
            { value: "500+", label: "Verified Providers" },
            { value: "4.9/5", label: "Average Rating" },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-3xl font-headline font-extrabold text-white">{item.value}</p>
              <p className="text-on-surface-variant text-sm mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
