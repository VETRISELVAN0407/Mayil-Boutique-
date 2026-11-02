import { Link } from 'react-router-dom';

export default function EmptyState({ icon, title, description, actionLabel, actionTo, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      {icon && <div className="text-5xl mb-4 text-brand-secondary">{icon}</div>}
      <h3 className="font-serif text-xl font-semibold text-peacock-deep mb-2">{title}</h3>
      {description && <p className="text-sm text-brand-secondary max-w-xs mb-6">{description}</p>}
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary">
          {actionLabel}
        </button>
      )}
      {actionLabel && actionTo && !onAction && (
        <Link to={actionTo} className="btn-primary">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
