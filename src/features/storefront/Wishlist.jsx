import { Link } from 'react-router-dom';
import { useWishlist } from '../../context/WishlistContext';

export default function Wishlist() {
  const { items, remove } = useWishlist();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold text-navy">Wishlist</h1>

      {items.length === 0 ? (
        <div className="mt-6">
          <p className="text-sm text-gray-500">Your wishlist is empty.</p>
          <Link to="/" className="mt-3 inline-block text-sm text-peacock-600 hover:underline">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center justify-between rounded-xl bg-white p-4 shadow"
            >
              <div>
                {item.productName ? (
                  <Link
                    to={`/products/${item.productSlug}`}
                    className="font-semibold text-navy hover:underline"
                  >
                    {item.productName}
                  </Link>
                ) : (
                  <span className="text-sm text-gray-400">Product #{item.productId}</span>
                )}
                {item.price != null && (
                  <p className="mt-1 text-sm text-gray-600">
                    {item.salePrice != null ? (
                      <>
                        <span className="font-semibold text-navy">₹{item.salePrice}</span>{' '}
                        <span className="line-through text-gray-400">₹{item.price}</span>
                      </>
                    ) : (
                      <span>₹{item.price}</span>
                    )}
                  </p>
                )}
              </div>
              <button
                onClick={() => remove(item.productId)}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
