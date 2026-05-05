import { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { TestimonialGrid } from '@/components/testimonial-cards';
import { CTASection } from '@/components/cta-section';

export const metadata: Metadata = {
  title: 'Success Stories - Financial Freedom Mentor | Trader Testimonials',
  description: 'Read how thousands of traders achieved financial freedom with our mentorship. Real success stories from students who rode the bull and ruled the bear.',
};

const testimonials = [
  {
    name: 'Michael Thompson',
    role: 'Accountant turned Trader',
    image: '/testimonials/michael.jpg',
    content:
      'I went from losing money to becoming consistently profitable. The trading fundamentals course was a game-changer. Now I make more from trading than my day job!',
    rating: 5,
    result: '+$50K annual income from trading',
  },
  {
    name: 'Jessica Lee',
    role: 'Stay-at-home Mom',
    image: '/testimonials/jessica.jpg',
    content:
      'The flexibility of the courses and mentorship allowed me to learn at my own pace. I now manage a six-figure portfolio from home.',
    rating: 5,
    result: 'Built $250K+ trading portfolio',
  },
  {
    name: 'Robert Santos',
    role: 'Software Engineer',
    image: '/testimonials/robert.jpg',
    content:
      'As someone with no trading background, I was nervous. But the course structure and mentors made it so easy to understand. Now I trade with confidence.',
    rating: 5,
    result: '245% portfolio growth in 18 months',
  },
  {
    name: 'Amanda Foster',
    role: 'Marketing Manager',
    image: '/testimonials/amanda.jpg',
    content:
      'The live trading sessions with real traders showed me what professional trading actually looks like. Best investment I&apos;ve ever made in myself.',
    rating: 5,
    result: 'Achieved 40% annual returns',
  },
  {
    name: 'David Park',
    role: 'Retired Engineer',
    image: '/testimonials/david.jpg',
    content:
      'In retirement, I wanted to make my money work harder. This program gave me the skills and confidence to trade successfully. Best decision ever!',
    rating: 5,
    result: 'Created steady passive income stream',
  },
  {
    name: 'Sarah Wilson',
    role: 'Teacher',
    image: '/testimonials/sarah.jpg',
    content:
      'The comprehensive curriculum and patient mentors answered every question I had. I went from complete beginner to making my first profitable trades.',
    rating: 5,
    result: 'Turned $5K into $15K in 6 months',
  },
];

export default function TestimonialsPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="w-full py-16 md:py-24 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
                Success Stories from Our Students
              </h1>
              <p className="text-xl text-muted-foreground">
                See how real traders transformed their financial lives through our mentorship program.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="w-full py-12 md:py-16 bg-card border-b border-border">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-primary mb-2">50K+</p>
                <p className="text-sm text-muted-foreground">Students Worldwide</p>
              </div>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-primary mb-2">98%</p>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-primary mb-2">$500M+</p>
                <p className="text-sm text-muted-foreground">Trading Volume</p>
              </div>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-primary mb-2">4.9/5</p>
                <p className="text-sm text-muted-foreground">Average Rating</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Grid */}
        <section className="w-full py-16 md:py-24">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <TestimonialGrid testimonials={testimonials} />
          </div>
        </section>

        {/* Video Testimonial Section */}
        <section className="w-full py-16 md:py-24 bg-card border-y border-border">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-foreground text-center mb-12">
              Watch Real Student Testimonials
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="relative bg-background border border-border rounded-xl overflow-hidden group cursor-pointer hover:border-primary/50 transition-all"
                >
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                      <div className="w-0 h-0 border-l-8 border-l-transparent border-r-0 border-t-5 border-t-transparent border-b-5 border-b-transparent border-l-primary ml-1"></div>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground">Student Success Story {i}</p>
                    <p className="text-foreground font-semibold">Watch testimonial</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <CTASection
          title="Ready to Write Your Success Story?"
          description="Join thousands of successful traders. Start your mentorship journey and transform your financial future today."
          primaryButtonText="Enroll Now"
          primaryButtonHref="/courses"
        />
      </main>
      <Footer />
    </>
  );
}
