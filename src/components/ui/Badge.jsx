export default function Badge({ type }) {
  if (type === 'new') return <span className="badge-new">New</span>;
  if (type === 'sale') return <span className="badge-sale">Sale</span>;
  if (type === 'bestseller')
    return (
      <span className="inline-block rounded-sm bg-gold-500 px-2 py-0.5 text-xs font-semibold uppercase tracking-widest text-white">
        Best Seller
      </span>
    );
  return null;
}
