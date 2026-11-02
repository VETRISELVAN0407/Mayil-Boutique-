import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as categoryService from '../../services/categoryService';
import * as productService from '../../services/productService';
import { useWishlist } from '../../context/WishlistContext';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const { isInWishlist, toggle: toggleWishlist } = useWishlist();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {};
        if (categoryId) {
          params.categoryId = categoryId;
        }
        if (search.trim()) {
          params.search = search.trim();
        }
        const [productsResult, categoriesResult] = await Promise.allSettled([
          productService.getPublicProducts(params),
          categoryService.getPublicCategories(),
        ]);
        if (!cancelled) {
          if (productsResult.status === 'rejected') {
            const err = productsResult.reason;
            setError(err?.response?.data?.message || 'Failed to load products');
          } else {
            setProducts(productsResult.value ?? []);
          }
          if (categoriesResult.status === 'fulfilled') {
            setCategories(categoriesResult.value ?? []);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.message || 'Failed to load products');
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
  }, [search, categoryId]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
  };

  if (loading) {
    return <div className="text-navy">Loading products...</div>;
  }

  if (error) {
    return <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-red-700">{error}</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold text-navy">Shop</h1>
      <p className="mt-1 text-sm text-gray-600">Browse the collection</p>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="w-full sm:max-w-md">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-peacock-500 focus:outline-none"
          />
        </form>
        <select
          value={categoryId ?? ''}
          onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
          className="rounded-lg border border-gray-300 px-3 py-2 focus:border-peacock-500 focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {products.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">No products found.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div key={product.id} className="rounded-xl bg-white p-4 shadow">
              <div className="flex items-start justify-between">
                <Link to={`/products/${product.slug}`} className="flex-1">
                  <h2 className="font-semibold text-navy">{product.name}</h2>
                  {product.description ? <p className="mt-1 text-sm text-gray-500 line-clamp-2">{product.description}</p> : null}
                  <p className="mt-2 text-sm font-semibold text-navy">
                    {product.salePrice != null ? (
                      <span>
                        ₹{product.salePrice}{' '}
                        <span className="text-gray-400 line-through">₹{product.price}</span>
                      </span>
                    ) : (
                      <span>₹{product.price}</span>
                    )}
                  </p>
                </Link>
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="ml-2 text-xl leading-none"
                  title={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  {isInWishlist(product.id) ? '♥' : '♡'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
