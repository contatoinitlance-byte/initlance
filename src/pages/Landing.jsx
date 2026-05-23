import Navbar from '@/Components/landing/Navbar';
import HeroSection from '@/Components/landing/HeroSection';
import FeaturesSection from '@/Components/landing/FeaturesSection';
import RanksSection from '@/Components/landing/RanksSection';
import PricingSection from '@/Components/landing/PricingSection';
import Footer from '@/Components/landing/Footer';

export default function Landing() {
    return (
        <div className="min-h-screen bg-background font-body">
            <Navbar />
            <HeroSection />
            <FeaturesSection />
            <RanksSection />
            <PricingSection />
            <Footer />
        </div>
    );
}