import { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'Data Deletion Policy - Financial Freedom Mentor',
  description: 'Learn how to request deletion of your personal data from Financial Freedom Mentor.',
};

export default function DataDeletionPage() {
  return (
    <>
      <Header />
      <main>
        <section className="w-full py-16 md:py-24 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-foreground mb-4">Data Deletion Policy</h1>
            <p className="text-muted-foreground">Last updated: May 2026</p>
          </div>
        </section>

        <section className="w-full py-12 pb-24">
          <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 text-muted-foreground leading-relaxed">

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">1. Your Right to Data Deletion</h2>
              <p>
                Financial Freedom Mentor respects your right to control your personal data. Under applicable data protection regulations, you have the right to request the deletion of your personal information from our systems at any time.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">2. What Data Can Be Deleted</h2>
              <p className="mb-3">Upon a verified deletion request, we will remove or anonymize the following data:</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Full name and father/guardian name</li>
                <li>Email address and mobile number</li>
                <li>Residential address</li>
                <li>Educational qualification and occupation details</li>
                <li>Registration form responses (trading goals, experience)</li>
                <li>Profile and account information on our LMS platform</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">3. Data We Are Required to Retain</h2>
              <p className="mb-3">
                Certain data may be retained even after a deletion request due to legal, regulatory, or contractual obligations:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Transaction records and payment history (retained for financial/tax compliance — up to 7 years)</li>
                <li>Order IDs and Razorpay transaction references</li>
                <li>Any data required to resolve disputes or enforce our Terms &amp; Conditions</li>
              </ul>
              <p className="mt-3">
                Such retained data will be kept securely and used only for the stated legal purposes.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">4. How to Request Data Deletion</h2>
              <p className="mb-4">To request deletion of your personal data, follow these steps:</p>

              <div className="space-y-3">
                {[
                  { step: '1', title: 'Send a Request', desc: 'Email us at info@ffmentor.com with the subject line: "Data Deletion Request".' },
                  { step: '2', title: 'Provide Verification', desc: 'Include your registered full name, email address, and mobile number so we can verify your identity.' },
                  { step: '3', title: 'Confirmation', desc: 'We will acknowledge your request within 3 business days and confirm deletion within 30 days.' },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex gap-4 bg-card border border-border rounded-xl p-5">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 text-primary-foreground font-bold text-sm">
                      {step}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{title}</p>
                      <p className="text-sm mt-1">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">5. Facebook / Third-Party Login Data</h2>
              <p>
                If you connected to our services via a Facebook or social media login, you can also request data deletion directly through Facebook. Visit your Facebook settings → Apps and Websites → find Financial Freedom Mentor → Remove and delete data.
              </p>
              <p className="mt-3">
                Alternatively, contact us directly via email for complete deletion from our systems.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">6. Effect of Deletion</h2>
              <p>
                Please note that deleting your account data will result in:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 mt-3">
                <li>Loss of access to your LMS student account and all course content</li>
                <li>Removal from all marketing and communication lists</li>
                <li>Inability to access session recordings or past materials</li>
              </ul>
              <p className="mt-3">
                Data deletion is <strong className="text-foreground">irreversible</strong>. Deleted accounts cannot be restored.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">7. Contact Us Us</h2>
              <div className="bg-card border border-border rounded-xl p-5 space-y-1">
                <p className="font-semibold text-foreground">Financial Freedom Mentor — Data Privacy</p>
                <p>Email: <a href="mailto:info@ffmentor.com" className="text-primary hover:underline">info@ffmentor.com</a></p>
                <p>Phone / WhatsApp: <a href="tel:+918000160017" className="text-primary hover:underline">+91 98317 40535</a></p>
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
