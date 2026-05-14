import { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'Terms & Conditions - Financial Freedom Mentor',
  description: 'Terms and Conditions for Financial Freedom Mentor mentorship programs. Read before enrolling.',
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main>
        <section className="w-full py-16 md:py-24 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-foreground mb-4">Terms &amp; Conditions</h1>
            <p className="text-muted-foreground">Last updated: May 2026</p>
          </div>
        </section>

        <section className="w-full py-12 pb-24">
          <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 text-muted-foreground leading-relaxed">

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">1. Acceptance of Terms</h2>
              <p>
                By registering on or using the website <strong className="text-foreground">www.ffmentor.com</strong> or enrolling in any program offered by Financial Freedom Mentor, you agree to be bound by these Terms &amp; Conditions. If you do not agree, please do not use our services.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">2. Services Offered</h2>
              <p>
                Financial Freedom Mentor provides online commodity trading mentorship programs including live trading sessions, strategy coaching, doubt-solving support, and educational resources. The specific content and duration vary by plan:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 mt-3">
                <li><strong className="text-foreground">Basic Plan</strong> — 1 Month</li>
                <li><strong className="text-foreground">Pro Plan</strong> — 3 Months</li>
                <li><strong className="text-foreground">Elite Plan</strong> — 6 Months with lifetime access &amp; updates</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">3. Enrollment & Payment</h2>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>All enrollments are subject to successful payment via Razorpay.</li>
                <li>Fees are due in full at the time of registration.</li>
                <li>Your account is activated upon successful payment verification.</li>
                <li>Login credentials will be sent to your registered email address.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">4. User Obligations</h2>
              <p className="mb-3">As a student, you agree to:</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Provide accurate and truthful information during registration</li>
                <li>Keep your login credentials confidential and not share them with others</li>
                <li>Use the educational content solely for personal learning purposes</li>
                <li>Not reproduce, redistribute, or resell any course material</li>
                <li>Treat mentors and fellow students with respect during live sessions</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">5. Intellectual Property</h2>
              <p>
                All content provided — including videos, PDFs, strategies, and live session recordings — is the exclusive intellectual property of Financial Freedom Mentor. Unauthorized copying, sharing, or distribution is strictly prohibited and may result in legal action.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">6. Disclaimer of Financial Advice</h2>
              <p>
                The content provided by Financial Freedom Mentor is for educational and informational purposes only. It does not constitute financial, investment, or trading advice. Trading in commodity markets involves risk of loss. Past performance is not indicative of future results. Students are solely responsible for their own trading decisions.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">7. Limitation of Liability</h2>
              <p>
                Financial Freedom Mentor shall not be liable for any direct, indirect, incidental, or consequential losses arising from your use of our services or reliance on educational content provided. Our total liability is limited to the fees paid for the specific program.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">8. Modification of Services</h2>
              <p>
                We reserve the right to modify, update, or discontinue any part of our services at any time. Changes to programs or schedules will be communicated to enrolled students via email with reasonable notice.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">9. Termination</h2>
              <p>
                We reserve the right to terminate or suspend your account if you violate these terms, engage in fraudulent activity, or misuse our platform. No refund will be issued in cases of termination due to policy violations.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">10. Governing Law</h2>
              <p>
                These Terms &amp; Conditions are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in India.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">11. Contact Us Us</h2>
              <p>For any questions regarding these Terms, please contact:</p>
              <div className="mt-3 bg-card border border-border rounded-xl p-5 space-y-1">
                <p className="font-semibold text-foreground">Financial Freedom Mentor</p>
                <p>Email: <a href="mailto:info@ffmentor.com" className="text-primary hover:underline">info@ffmentor.com</a></p>
                <p>Phone: <a href="tel:+918000160017" className="text-primary hover:underline">+91 98317 40535</a></p>
              </div>
            </div>

          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
