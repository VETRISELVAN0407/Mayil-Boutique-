/* Product photo, or a branded placeholder until the product has images. */
export default function ProductImage({ src, alt = '', className = '', placeholderLabel }) {
  if (src) {
    return <img src={src} alt={alt} className={className} loading="lazy" />;
  }
  return (
    <div
      role="img"
      aria-label={alt}
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-ivory to-peacock-teal/20 ${className}`}
    >
      <span className="font-serif text-3xl font-bold text-peacock-deep/40">
        {(placeholderLabel || alt || 'M').trim().charAt(0).toUpperCase()}
      </span>
    </div>
  );
}
