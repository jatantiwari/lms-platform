import { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { MentorCard, MentorProfile } from '@/components/mentor-card';
import { Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Expert Mentors - Financial Freedom Mentor | Trading Experts',
  description: 'Meet our team of experienced trading mentors. 50+ experts with decades of combined trading experience ready to guide your financial journey.',
};

export default function MentorsPage() {
  const mentors: MentorProfile[] = [
    {
      name: 'Raj Kumar',
      title: 'Chief Trading Officer',
      specialization: 'Swing Trading & Technical Analysis',
      yearsOfExperience: 15,
      rating: 4.9,
      reviews: 450,
      bio: 'Former hedge fund manager with 15+ years of experience in stock markets. Specializes in swing trading and has trained 1000+ students.',
      image: '/mentor-1.jpg',
      credentials: ['CFA', 'NISM', '15+ Years Experience'],
    },
    {
      name: 'Priya Sharma',
      title: 'Options Trading Specialist',
      specialization: 'Options Strategies & Risk Management',
      yearsOfExperience: 12,
      rating: 4.8,
      reviews: 380,
      bio: 'Expert in options trading with proven strategies. Has generated consistent returns through options selling and spreads.',
      image: '/mentor-2.jpg',
      credentials: ['NISM-Options', 'BSE License', '12+ Years'],
    },
    {
      name: 'Amit Patel',
      title: 'Fundamental Analyst',
      specialization: 'Value Investing & Company Analysis',
      yearsOfExperience: 18,
      rating: 4.9,
      reviews: 520,
      bio: 'Warren Buffett style investor focusing on fundamental analysis. Helps students build long-term wealth through smart stock selection.',
      image: '/mentor-3.jpg',
      credentials: ['CFA Level 3', 'MBA Finance', '18+ Years'],
    },
    {
      name: 'Deepak Singh',
      title: 'Algorithmic Trading Expert',
      specialization: 'Quantitative Analysis & Algo Trading',
      yearsOfExperience: 10,
      rating: 4.7,
      reviews: 290,
      bio: 'Tech-savvy trader with expertise in algorithmic trading and quantitative strategies. Teaches coding for trading algorithms.',
      image: '/mentor-4.jpg',
      credentials: ['B.Tech Computer Science', 'Python Expert', '10+ Years'],
    },
    {
      name: 'Ananya Verma',
      title: 'Commodity Trading Expert',
      specialization: 'Commodity & Forex Markets',
      yearsOfExperience: 13,
      rating: 4.8,
      reviews: 340,
      bio: 'Specialist in commodity futures and forex trading. Guides students through global market trends and hedging strategies.',
      image: '/mentor-5.jpg',
      credentials: ['NISM-Commodities', 'MCX License', '13+ Years'],
    },
    {
      name: 'Vikram Nair',
      title: 'Portfolio Manager',
      specialization: 'Asset Allocation & Wealth Building',
      yearsOfExperience: 16,
      rating: 4.9,
      reviews: 480,
      bio: 'Manages portfolios worth 500+ crore. Teaches comprehensive wealth management and diversification strategies.',
      image: '/mentor-6.jpg',
      credentials: ['NISM-Portfolio', 'CFP', '16+ Years'],
    },
  ];

  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-br from-primary/10 to-secondary/10">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  Expert Team
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-foreground mb-6">
                Meet Our Expert Mentors
              </h1>
              <p className="text-base md:text-xl text-muted-foreground">
                Learn from the best. Our team of 50+ experienced traders and analysts with combined 500+ years of trading expertise.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-white border-b border-border">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-primary">50+</div>
                <p className="text-muted-foreground mt-2">Certified Mentors</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">500+</div>
                <p className="text-muted-foreground mt-2">Years Combined Experience</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">5000+</div>
                <p className="text-muted-foreground mt-2">Students Guided</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">4.9/5</div>
                <p className="text-muted-foreground mt-2">Average Mentor Rating</p>
              </div>
            </div>
          </div>
        </section>

        {/* Mentors Grid */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {mentors.map((mentor, index) => (
                <MentorCard key={index} mentor={mentor} />
              ))}
            </div>
          </div>
        </section>

        {/* Why Our Mentors Section */}
        <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
                Why Choose Our Mentors?
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <span className="text-primary font-bold text-xl flex-shrink-0">1</span>
                    <div>
                      <h3 className="font-bold text-foreground mb-1">Real Market Experience</h3>
                      <p className="text-muted-foreground">Each mentor has active trading experience with proven track records.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-primary font-bold text-xl flex-shrink-0">2</span>
                    <div>
                      <h3 className="font-bold text-foreground mb-1">Industry Certifications</h3>
                      <p className="text-muted-foreground">All mentors hold recognized trading and finance certifications.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-primary font-bold text-xl flex-shrink-0">3</span>
                    <div>
                      <h3 className="font-bold text-foreground mb-1">Personalized Guidance</h3>
                      <p className="text-muted-foreground">One-on-one mentorship available in Elite program.</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <span className="text-primary font-bold text-xl flex-shrink-0">4</span>
                    <div>
                      <h3 className="font-bold text-foreground mb-1">Continuous Learning</h3>
                      <p className="text-muted-foreground">Mentors stay updated with latest market trends and strategies.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-primary font-bold text-xl flex-shrink-0">5</span>
                    <div>
                      <h3 className="font-bold text-foreground mb-1">Student Success Focus</h3>
                      <p className="text-muted-foreground">Mentors are committed to student success with high satisfaction rates.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-primary font-bold text-xl flex-shrink-0">6</span>
                    <div>
                      <h3 className="font-bold text-foreground mb-1">Accessible & Supportive</h3>
                      <p className="text-muted-foreground">Regular doubt sessions and responsive support throughout your journey.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
