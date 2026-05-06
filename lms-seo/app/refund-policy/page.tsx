import { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'Refund Policy - Financial Freedom Mentor',
  description: 'Refund Policy for Financial Freedom Mentor mentorship programs. Understand our cancellation and refund terms.',
};

export default function RefundPolicyPage() {
  return (
    <>
      <Header />
      <main>
        <section className="w-full py-16 md:py-24 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4">Refund Policy</h1>
            <p className="text-muted-foreground">Last updated: May 2026</p>
          </div>
        </section>

        <section className="w-full py-12 pb-24">
          <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 text-muted-foreground leading-relaxed">

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">1. Overview</h2>
              <p>
                At Financial Freedom Mentor, we are committed to delivering high-quality mentorship and education. We understand that circumstances may change, and we have designed this refund policy to be transparent and fair for all students.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">2. Eligibility for Refund</h2>
              <p className="mb-3">Refund requests are considered under the following conditions:</p>

              <div className="space-y-4">
                <div className="bg-card border border-primary/20 rounded-xl p-5">
                  <h3 className="font-semibold text-primary mb-2">Within 7 Days of Payment</h3>
                  <p>
                    If you have not attended any live session or accessed course material, you are eligible for a full refund within 7 days of your payment date. Submit your request to{' '}
                    <a href="mailto:ffmentor2024@gmail.com" className="text-primary hover:underline">ffmentor2024@gmail.com</a>.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-2">After 7 Days / Partial Use</h3>
                  <p>
                    No refund is applicable once you have attended live sessions, accessed recorded content, or if more than 7 days have passed since enrollment.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-2">Technical Issues by Our Side</h3>
                  <p>
                    If we are unable to deliver the promised service due to technical issues or circumstances on our end, a full or pro-rated refund will be issued at our discretion.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">3. Non-Refundable Cases</h2>
              <p className="mb-3">Refunds will NOT be issued in the following cases:</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Change of mind after accessing course content or attending any session</li>
                <li>Failure to attend sessions due to personal scheduling conflicts</li>
                <li>Account termination due to violation of Terms &amp; Conditions</li>
                <li>Requests made after 7 days from the payment date</li>
                <li>Requests citing lack of profit in trading (our services are educational, not profit guarantees)</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">4. Refund Process</h2>
              <ol className="list-decimal list-inside space-y-2 pl-2">
                <li>Email your refund request to <a href="mailto:ffmentor2024@gmail.com" className="text-primary hover:underline">ffmentor2024@gmail.com</a> with your registered name, email, payment ID, and reason for refund.</li>
                <li>Our team will review and respond within <strong className="text-foreground">3 business days</strong>.</li>
                <li>Approved refunds will be processed back to the original payment method within <strong className="text-foreground">7–10 business days</strong> via Razorpay.</li>
              </ol>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">5. Plan Transfers</h2>
              <p>
                Instead of a refund, you may request a transfer to a different plan (upgrade or downgrade) within the first 7 days of enrollment, subject to availability and fee adjustments.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">6. Contact for Refund Requests</h2>
              <div className="bg-card border border-border rounded-xl p-5 space-y-1">
                <p className="font-semibold text-foreground">Financial Freedom Mentor — Support</p>
                <p>Email: <a href="mailto:ffmentor2024@gmail.com" className="text-primary hover:underline">ffmentor2024@gmail.com</a></p>
                <p>Phone / WhatsApp: <a href="tel:+918000160017" className="text-primary hover:underline">+91 80001 60017</a></p>
                <p className="text-sm mt-2 text-muted-foreground">Please include your payment ID and registered email in all refund communications.</p>
              </div>
            </div>

          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
