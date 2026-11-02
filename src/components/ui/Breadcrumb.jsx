import { Link } from 'react-router-dom';

export default function Breadcrumb({ crumbs }) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-brand-secondary flex items-center gap-1.5 flex-wrap">
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span>/</span>}
          {c.to ? (
            <Link to={c.to} className="hover:text-peacock-teal transition-colors">
              {c.label}
            </Link>
          ) : (
            <span className="text-brand-primary font-medium">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
