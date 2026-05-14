import { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'Privacy Policy - Financial Freedom Mentor',
  description: 'Privacy Policy for Financial Freedom Mentor. Learn how we collect, use, and protect your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <main>
        <section className="w-full py-16 md:py-24 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-foreground mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: May 2026</p>
          </div>
        </section>

        <section className="w-full py-12 pb-24">
          <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 text-muted-foreground leading-relaxed">

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">1. Introduction</h2>
              <p>
                Financial Freedom Mentor (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website <strong className="text-foreground">www.ffmentor.com</strong> or enroll in our mentorship programs.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">2. Information We Collect</h2>
              <p className="mb-3">We collect information you provide directly to us, including:</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Full name and father/guardian name</li>
                <li>Email address and mobile number</li>
                <li>Residential address</li>
                <li>Educational qualification and occupation</li>
                <li>Payment information (processed securely via Razorpay — we do not store card details)</li>
                <li>Trading experience and goals submitted during registration</li>
              </ul>
              <p className="mt-3">
                We may also automatically collect certain technical data such as IP address, browser type, and pages visited via analytics tools.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">3. How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>To process your registration and payment</li>
                <li>To create and manage your student account</li>
                <li>To send login credentials and course access details</li>
                <li>To communicate session schedules, updates, and support</li>
                <li>To send educational content and newsletters (you may opt out at any time)</li>
                <li>To improve our website and services</li>
                <li>To comply with legal obligations</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">4. Sharing of Information</h2>
              <p>
                We do not sell, trade, or rent your personal information to third parties. We may share your data with:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 mt-3">
                <li><strong className="text-foreground">Razorpay</strong> — for secure payment processing</li>
                <li><strong className="text-foreground">Email service providers</strong> — to send transactional and marketing emails</li>
                <li><strong className="text-foreground">Legal authorities</strong> — when required by law or to protect our rights</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">5. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your personal data. Payments are processed using 256-bit SSL encryption via Razorpay. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">6. Data Retention</h2>
              <p>
                We retain your personal data for as long as your account is active or as needed to provide services. You may request deletion of your data at any time (see our Data Deletion Policy).
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">7. Cookies</h2>
              <p>
                We may use cookies and similar tracking technologies to enhance your experience on our website. You can control cookies through your browser settings.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">8. Your Rights</h2>
              <p className="mb-3">You have the right to:</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Access the personal data we hold about you</li>
                <li>Correct inaccurate or incomplete data</li>
                <li>Request deletion of your personal data</li>
                <li>Withdraw consent for marketing communications</li>
              </ul>
              <p className="mt-3">
                To exercise these rights, contact us at{' '}
                <a href="mailto:info@ffmentor.com" className="text-primary hover:underline">
                  info@ffmentor.com
                </a>.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">9. Contact Us Us</h2>
              <p>If you have any questions about this Privacy Policy, please contact:</p>
              <div className="mt-3 bg-card border border-border rounded-xl p-5 space-y-1">
                <p className="font-semibold text-foreground">Financial Freedom Mentor</p>
                <p>Email: <a href="mailto:info@ffmentor.com" className="text-primary hover:underline">info@ffmentor.com</a></p>
                <p>Phone: <a href="tel:+918000160017" className="text-primary hover:underline">+91 98317 40535</a></p>
                <p>Website: <a href="https://www.ffmentor.com" className="text-primary hover:underline">www.ffmentor.com</a></p>
              </div>
            </div>

          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
