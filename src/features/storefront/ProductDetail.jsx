import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as productService from '../../services/productService';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartMessage, setCartMessage] = useState(null);

  const { add: addToCart } = useCart();
  const { isInWishlist, toggle: toggleWishlist } = useWishlist();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [productData, variantData] = await Promise.all([
          productService.getPublicProductBySlug(slug),
          productService.getPublicProductVariantsBySlug(slug),
        ]);
        if (!cancelled) {
          setProduct(productData);
          setVariants(variantData ?? []);
          setSelectedVariantId(variantData?.[0]?.id ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.message || 'Failed to load product');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? null;

  const handleAddToCart = async () => {
    if (!selectedVariantId) return;
    try {
      await addToCart(selectedVariantId, quantity);
      setCartMessage('Added to cart!');
      setTimeout(() => setCartMessage(null), 2000);
    } catch (err) {
      setCartMessage(err?.response?.data?.message || 'Could not add to cart');
      setTimeout(() => setCartMessage(null), 3000);
    }
  };

  if (loading) {
    return <div className="px-4 py-8 text-navy">Loading product...</div>;
  }

  if (error) {
    return (
      <div className="px-4 py-8">
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-red-700">{error}</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link to="/" className="text-sm text-peacock-600 hover:underline">Back to products</Link>
        <p className="mt-4 text-sm text-gray-500">Product not found.</p>
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link to="/" className="text-sm text-peacock-600 hover:underline">Back to products</Link>

      <div className="mt-6 rounded-xl bg-white p-6 shadow">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold text-navy">{product.name}</h1>
          <button
            onClick={() => toggleWishlist(product.id)}
            className="text-2xl leading-none"
            title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            {inWishlist ? '♥' : '♡'}
          </button>
        </div>

        {product.description ? <p className="mt-4 text-gray-700">{product.description}</p> : null}

        <div className="mt-4">
          {product.salePrice != null ? (
            <p className="text-2xl font-bold text-navy">
              ₹{product.salePrice}{' '}
              <span className="text-base font-normal text-gray-400 line-through">₹{product.price}</span>
            </p>
          ) : (
            <p className="text-2xl font-bold text-navy">₹{product.price}</p>
          )}
        </div>

        {variants.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-medium text-gray-700">Select variant</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {variants.map((v) => {
                const label = [v.size, v.colour].filter(Boolean).join(' / ') || v.sku;
                const outOfStock = v.stockQuantity === 0;
                return (
                  <button
                    key={v.id}
                    onClick={() => !outOfStock && setSelectedVariantId(v.id)}
                    disabled={outOfStock}
                    className={[
                      'rounded-lg border px-3 py-1.5 text-sm',
                      selectedVariantId === v.id
                        ? 'border-peacock-500 bg-peacock-50 text-peacock-700 font-semibold'
                        : 'border-gray-300 text-gray-700',
                      outOfStock ? 'opacity-40 cursor-not-allowed line-through' : 'hover:border-peacock-400',
                    ].join(' ')}
                  >
                    {label}
                    {outOfStock ? ' (out of stock)' : ''}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {selectedVariant && (
          <p className="mt-2 text-xs text-gray-500">Stock: {selectedVariant.stockQuantity}</p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => quantity > 1 && setQuantity((q) => q - 1)}
              className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-sm disabled:opacity-40"
              disabled={quantity <= 1}
            >
              −
            </button>
            <span className="w-8 text-center text-sm">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-sm"
            >
              +
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!selectedVariantId || selectedVariant?.stockQuantity === 0}
            className="rounded-lg bg-peacock-600 px-5 py-2 text-sm font-semibold text-white hover:bg-peacock-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add to cart
          </button>

          <Link to="/cart" className="text-sm text-peacock-600 hover:underline">
            View cart
          </Link>
        </div>

        {cartMessage && (
          <p className="mt-3 text-sm font-medium text-peacock-700">{cartMessage}</p>
        )}
      </div>
    </div>
  );
}
