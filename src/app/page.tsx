import HeroSection from "@/components/home/HeroSection";
import HomeContent from "@/components/home/HomeContent";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a]">
      <HeroSection />
      <HomeContent />
    </div>
  );
}
