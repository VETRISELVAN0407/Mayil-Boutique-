import { Link } from 'react-router-dom';
import PageShell from '../components/ui/PageShell';

export default function NotFoundPage() {
  return (
    <PageShell center title="Page Not Found" subtitle="Error 404">
      <div className="mx-auto max-w-md text-center">
        <p className="mb-8 text-sm text-[#4a4a3f]">The page you are looking for does not exist or may have moved.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/" className="btn-green">Back to Home</Link>
          <Link to="/products" className="btn-green-outline px-6 py-3">Browse Products</Link>
        </div>
      </div>
    </PageShell>
  );
}
