import { useParams, Link } from 'react-router-dom';
import PageShell from '../components/ui/PageShell';

const POLICIES = {
  shipping: {
    title: 'Shipping Policy',
    content: [
      { heading: 'Processing Time', body: 'Orders are processed within 1–2 business days of placement. You will receive a confirmation email with tracking details once your order is shipped.' },
      { heading: 'Shipping Time', body: 'Standard delivery: 5–7 business days across India. Express delivery (available at checkout): 2–3 business days for major cities.' },
      { heading: 'Free Shipping', body: 'Enjoy free shipping on all orders above ₹999. Orders below ₹999 attract a flat shipping fee of ₹99.' },
      { heading: 'Tracking', body: "Once shipped, you will receive an SMS and email with your tracking ID. You can track your order via the shipping partner's website." },
    ],
  },
  returns: {
    title: 'Returns & Exchanges',
    content: [
      { heading: '7-Day Return Window', body: 'We accept returns within 7 days of delivery for items that are unused, unwashed, and in their original condition with all tags intact.' },
      { heading: 'Exchange Policy', body: 'Exchanges for a different size or colour are accepted within 7 days. Stock availability may vary; if unavailable, a refund will be processed.' },
      { heading: 'Non-Returnable Items', body: 'Items marked as "Final Sale", customised pieces, and accessories (jewellery, stoles) are non-returnable for hygiene reasons.' },
      { heading: 'Refund Process', body: 'Approved refunds are processed within 5–7 business days to the original payment method. For COD orders, refunds are issued as store credit.' },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    content: [
      { heading: 'Data We Collect', body: 'We collect information you provide directly (name, email, mobile, address) and usage data to improve your experience.' },
      { heading: 'How We Use It', body: 'Your data is used for order processing, customer support, and personalised offers. We do not sell your data to third parties.' },
      { heading: 'Security', body: 'We use industry-standard encryption (TLS) for all data in transit. Passwords are never stored in plain text.' },
      { heading: 'Virtual Try-On Photos', body: 'If you use Virtual Try-On, the photo you upload or capture is processed by our AI service only to create a preview of the outfit you chose. We store your photo and the preview temporarily in private storage that only you can access when signed in. They are deleted automatically about 30 minutes after your preview is ready (sooner if you cancel or delete them yourself, or if the preview fails or is abandoned), and you can delete them at any time from the preview page. We do not use your photo or the preview for advertising or to train AI models. We keep a short record of each request (date, product, status and when you gave consent) without the images. Previews are AI illustrations and cannot show exact fit, size or colour.' },
      { heading: 'Your Rights', body: 'You may request access to, correction of, or deletion of your personal data at any time by contacting us at hello@mayilboutique.in.' },
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    content: [
      { heading: 'Acceptance', body: 'By accessing or using Mayil Boutique, you agree to be bound by these terms. If you disagree, please do not use our services.' },
      { heading: 'Products', body: 'We strive to display product colours accurately, but slight variations due to screen settings are possible. Sizes follow our published size guide.' },
      { heading: 'Pricing', body: 'All prices are in Indian Rupees (INR) and include applicable taxes. We reserve the right to modify prices without prior notice.' },
      { heading: 'Intellectual Property', body: 'All content on this site — images, copy, design — is owned by Mayil Boutique and protected under applicable copyright laws.' },
    ],
  },
  sizing: {
    title: 'Size Guide',
    content: [
      { heading: 'How to Measure', body: 'Use a soft measuring tape. Measure over your regular clothing. For best results, measure Bust (fullest part), Waist (narrowest part), and Hip (widest part).' },
      { heading: 'Size Chart (cm)', body: 'XS: Bust 80, Waist 63, Hip 87\nS: Bust 85, Waist 68, Hip 92\nM: Bust 90, Waist 73, Hip 97\nL: Bust 96, Waist 79, Hip 103\nXL: Bust 102, Waist 85, Hip 109\nXXL: Bust 108, Waist 91, Hip 115' },
      { heading: 'Fit Tips', body: 'When in between sizes, size up for a relaxed fit. Kurtas and coord tops generally run true to size. Fitted dresses may run small — check the product description.' },
    ],
  },
};

export default function PolicyPage() {
  const { type } = useParams();
  const policy = POLICIES[type] || POLICIES.shipping;

  return (
    <PageShell crumb={policy.title} title={policy.title}>
      <div className="max-w-3xl">
        <div className="card-cream space-y-6 p-6 sm:p-8">
          {policy.content.map((section) => (
            <div key={section.heading}>
              <h2 className="mb-2 font-serif text-lg text-[#0f3d2e] sm:text-xl">{section.heading}</h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-[#4a4a3f]">{section.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
          {Object.entries(POLICIES)
            .filter(([k]) => k !== type)
            .map(([k, v]) => (
              <Link key={k} to={`/policy/${k}`} className="text-sm text-[#0f5a3f] hover:underline">
                {v.title} →
              </Link>
            ))}
        </div>
      </div>
    </PageShell>
  );
}
