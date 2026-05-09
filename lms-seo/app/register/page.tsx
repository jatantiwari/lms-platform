'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

type FormData = {
  studentName: string;
  fatherGuardianName: string;
  mobileNumber: string;
  emailId: string;
  address: string;
  educationalQualification: string;
  occupation: string;
  preferredCoursePlan: string;
  previousCommodityTradingExperience: string;
  whyJoin: string;
};

const PLAN_PRICES: Record<string, string> = {
  Basic: '₹10,000 / 1 Month',
  Pro: '₹25,000 / 3 Months',
  Elite: '₹50,000 / 6 Months',
};

const EMPTY_FORM: FormData = {
  studentName: '',
  fatherGuardianName: '',
  mobileNumber: '',
  emailId: '',
  address: '',
  educationalQualification: '',
  occupation: '',
  preferredCoursePlan: 'Basic',
  previousCommodityTradingExperience: 'No',
  whyJoin: '',
};

export default function RegisterPage() {
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.studentName.trim()) newErrors.studentName = 'Required';
    if (!formData.fatherGuardianName.trim()) newErrors.fatherGuardianName = 'Required';
    if (!formData.mobileNumber.trim()) newErrors.mobileNumber = 'Required';
    else if (!/^[6-9]\d{9}$/.test(formData.mobileNumber.replace(/\s/g, '')))
      newErrors.mobileNumber = 'Enter a valid 10-digit mobile number';
    if (!formData.emailId.trim()) newErrors.emailId = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailId))
      newErrors.emailId = 'Enter a valid email address';
    if (!formData.address.trim()) newErrors.address = 'Required';
    if (!formData.educationalQualification.trim()) newErrors.educationalQualification = 'Required';
    if (!formData.occupation.trim()) newErrors.occupation = 'Required';
    if (!formData.whyJoin.trim()) newErrors.whyJoin = 'Required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setApiError('');

    try {
      const res = await fetch(`${API_URL}/seo-registration/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setApiError(data.message ?? 'Registration failed. Please try again.');
        setSubmitting(false);
        return;
      }

      const { razorpayOrderId, amount, currency, razorpayKeyId, studentName, emailId } = data.data;

      const options = {
        key: razorpayKeyId,
        amount,
        currency,
        name: 'Financial Freedom Mentor',
        description: `${formData.preferredCoursePlan} Plan — Commodity Trading Mentorship`,
        order_id: razorpayOrderId,
        prefill: { name: studentName, email: emailId, contact: formData.mobileNumber },
        theme: { color: '#D4A017' },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
            setApiError('Payment was cancelled. Your account has been created — you can complete payment later by contacting us.');
          },
        },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const verifyRes = await fetch(`${API_URL}/seo-registration/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              setApiError(verifyData.message ?? 'Payment verification failed. Please contact support.');
            } else {
              setPaid(true);
            }
          } catch {
            setApiError('Network error during verification. Please contact support with your payment ID.');
          } finally {
            setSubmitting(false);
          }
        },
      };

      if (!window.Razorpay) {
        setApiError('Payment gateway failed to load. Please refresh and try again.');
        setSubmitting(false);
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      setApiError('Network error. Please check your connection and try again.');
      setSubmitting(false);
    }
  };

  if (paid) {
    return (
      <>
        <Header />
        <main>
          <section className="min-h-[70vh] flex items-center justify-center py-20 bg-background">
            <div className="max-w-lg mx-auto px-4 text-center space-y-6">
              <div className="w-20 h-20 bg-primary/15 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-4xl font-extrabold text-foreground">Registration Complete!</h1>
              <p className="text-lg text-muted-foreground">
                Your payment was successful. Check your email for login credentials.
                Your mentor will reach out within 24 hours to schedule your first session.
              </p>
              <div className="bg-card border border-primary/30 rounded-xl p-6 text-left space-y-2">
                <p className="text-sm font-semibold text-primary uppercase tracking-wide">What happens next?</p>
                {['Check your email for login credentials', 'Your mentor reviews your profile', 'Session scheduled within 24 hours', 'Your learning journey begins'].map((step, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0 text-primary-foreground font-bold text-xs">{i + 1}</span>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="w-full py-16 md:py-24 bg-card border-b border-border">
          <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
                <span className="text-sm font-semibold text-primary tracking-wide">Commodity Trading Mentorship</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-foreground leading-tight">
                Student <span className="text-primary">Registration</span>
              </h1>
              <p className="text-base md:text-xl text-muted-foreground">
                Fill out the form below — your account is created instantly and payment is processed securely via Razorpay.
              </p>
            </div>
          </div>
        </section>

        {/* Form */}
        <section className="w-full py-16 md:py-24 bg-background">
          <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
              <div className="p-8 md:p-10">
                <form onSubmit={handleSubmit} className="space-y-8">

                  {apiError && (
                    <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-sm text-destructive">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      {apiError}
                    </div>
                  )}

                  {/* Personal Information */}
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-6 pb-3 border-b border-border">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Field label="Student Name" id="studentName" name="studentName" value={formData.studentName} onChange={handleChange} placeholder="Your full name" error={errors.studentName} />
                      <Field label="Father / Guardian Name" id="fatherGuardianName" name="fatherGuardianName" value={formData.fatherGuardianName} onChange={handleChange} placeholder="Parent or guardian name" error={errors.fatherGuardianName} />
                      <Field label="Mobile Number" id="mobileNumber" name="mobileNumber" type="tel" value={formData.mobileNumber} onChange={handleChange} placeholder="10-digit mobile number" error={errors.mobileNumber} />
                      <Field label="Email ID" id="emailId" name="emailId" type="email" value={formData.emailId} onChange={handleChange} placeholder="your@email.com" error={errors.emailId} />
                    </div>
                    <div className="mt-6">
                      <label htmlFor="address" className="block text-sm font-medium text-foreground mb-2">Address <span className="text-destructive">*</span></label>
                      <textarea id="address" name="address" value={formData.address} onChange={handleChange} placeholder="Your full address" rows={3}
                        className={`w-full bg-background border rounded-lg px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${errors.address ? 'border-destructive' : 'border-border'}`}
                      />
                      {errors.address && <p className="text-destructive text-sm mt-1">{errors.address}</p>}
                    </div>
                  </div>

                  {/* Education & Career */}
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-6 pb-3 border-b border-border">Education &amp; Career</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Field label="Educational Qualification" id="educationalQualification" name="educationalQualification" value={formData.educationalQualification} onChange={handleChange} placeholder="e.g. B.Com, B.Tech, MBA" error={errors.educationalQualification} />
                      <Field label="Occupation" id="occupation" name="occupation" value={formData.occupation} onChange={handleChange} placeholder="e.g. Student, Engineer, Business" error={errors.occupation} />
                    </div>
                  </div>

                  {/* Course Selection */}
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-6 pb-3 border-b border-border">Course Selection</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="preferredCoursePlan" className="block text-sm font-medium text-foreground mb-2">Preferred Course Plan <span className="text-destructive">*</span></label>
                        <select id="preferredCoursePlan" name="preferredCoursePlan" value={formData.preferredCoursePlan} onChange={handleChange}
                          className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                          {Object.entries(PLAN_PRICES).map(([plan, label]) => (
                            <option key={plan} value={plan}>{plan} ({label})</option>
                          ))}
                        </select>
                        <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-primary bg-primary/10 border border-primary/25 rounded-lg px-4 py-2">
                          <span>{formData.preferredCoursePlan} Plan</span>
                          <span className="ml-auto">{PLAN_PRICES[formData.preferredCoursePlan]}</span>
                        </div>
                      </div>
                      <div>
                        <label htmlFor="previousCommodityTradingExperience" className="block text-sm font-medium text-foreground mb-2">Previous Commodity Trading Experience <span className="text-destructive">*</span></label>
                        <select id="previousCommodityTradingExperience" name="previousCommodityTradingExperience" value={formData.previousCommodityTradingExperience} onChange={handleChange}
                          className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Motivation */}
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-6 pb-3 border-b border-border">Why Are You Interested?</h3>
                    <label htmlFor="whyJoin" className="block text-sm font-medium text-foreground mb-2">Tell us your trading goals <span className="text-destructive">*</span></label>
                    <textarea id="whyJoin" name="whyJoin" value={formData.whyJoin} onChange={handleChange} placeholder="What do you want to achieve through this mentorship?" rows={5}
                      className={`w-full bg-background border rounded-lg px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${errors.whyJoin ? 'border-destructive' : 'border-border'}`}
                    />
                    {errors.whyJoin && <p className="text-destructive text-sm mt-1">{errors.whyJoin}</p>}
                  </div>

                  {/* Payment note */}
                  <div className="bg-primary/8 border border-primary/25 rounded-xl p-5 space-y-2">
                    <p className="text-sm font-semibold text-primary">What happens when you submit?</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Your student account is created instantly.</li>
                      <li>A Razorpay payment window opens — pay securely online.</li>
                      <li>Your login credentials are emailed to you immediately after payment.</li>
                      <li>Your mentor is notified and will contact you within 24 hours.</li>
                    </ol>
                  </div>

                  <Button type="submit" disabled={submitting}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-base font-bold shadow-lg shadow-primary/25">
                    {submitting ? (
                      <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" />Processing…</span>
                    ) : (
                      `Register & Pay ${PLAN_PRICES[formData.preferredCoursePlan]}`
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Secured by Razorpay &bull; 256-bit SSL encryption &bull; Your data is safe
                  </p>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Field({ label, id, name, type = 'text', value, onChange, placeholder, error }: {
  label: string; id: string; name: string; type?: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder: string; error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-foreground mb-2">
        {label} <span className="text-destructive">*</span>
      </label>
      <Input id={id} name={name} type={type} value={value} onChange={onChange} placeholder={placeholder}
        className={`w-full bg-background border-border text-foreground placeholder:text-muted-foreground ${error ? 'border-destructive' : ''}`}
      />
      {error && <p className="text-destructive text-sm mt-1">{error}</p>}
    </div>
  );
}
