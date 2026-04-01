import HeroSection from "../components/home/HeroSection";
import ServicesGrid from "../components/home/ServicesGrid";
import StatsSection from "../components/home/StatsSection";
import TestimonialsSection from "../components/home/TestimonialsSection";
import PopularServices from "../components/home/PopularServices";
import AIRecommendations from "../components/home/AIRecommendations";

export default function HomePage() {
  return (
    <main className="pt-20">
      <HeroSection />
      <ServicesGrid />
      <StatsSection />
      <AIRecommendations />
      <TestimonialsSection />
      <PopularServices />
    </main>
  );
}
