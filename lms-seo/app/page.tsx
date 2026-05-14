import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { HeroSection } from '@/components/home/hero-section';
import { MentorshipPrograms } from '@/components/home/mentorship-programs';
import { TradingStrategies } from '@/components/home/trading-strategies';
import { Testimonials } from '@/components/home/testimonials';
import { MentorIntro } from '@/components/home/mentor-intro';
import { FAQ } from '@/components/home/faq';
import { CTASection } from '@/components/cta-section';
import { CourseShowcase } from '@/components/course-showcase';
import { TradingRoomGallery } from '@/components/home/trading-room-gallery';


export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <MentorshipPrograms />
        <TradingStrategies />
        <Testimonials />
        <MentorIntro />
        <FAQ />
        <CourseShowcase />
        <TradingRoomGallery />
        <CTASection
          title="Ready to Ride the Bull and Rule the Bear?"
          description="Join thousands of successful traders who have achieved financial freedom through expert mentorship and proven strategies. Learn, Invest, Grow."
          primaryButtonText="Enroll in a Course"
          primaryButtonHref="/courses"
        />
      </main>
      <Footer />
    </>
  );
}