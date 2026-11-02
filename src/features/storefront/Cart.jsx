import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

export default function Cart() {
  const { items, update, remove } = useCart();

  const subtotal = items.reduce((sum, item) => {
    const price = item.salePrice ?? item.price ?? 0;
    return sum + Number(price) * (item.quantity ?? 1);
  }, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold text-navy">Cart</h1>

      {items.length === 0 ? (
        <div className="mt-6">
          <p className="text-sm text-gray-500">Your cart is empty.</p>
          <Link to="/" className="mt-3 inline-block text-sm text-peacock-600 hover:underline">
            Browse products
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-4">
            {items.map((item) => {
              const variantId = item.variantId;
              const label = [item.variantSize, item.variantColour].filter(Boolean).join(' / ');
              const unitPrice = item.salePrice ?? item.price;

              return (
                <div
                  key={variantId}
                  className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex-1">
                    {item.productName ? (
                      <Link
                        to={`/products/${item.productSlug}`}
                        className="font-semibold text-navy hover:underline"
                      >
                        {item.productName}
                      </Link>
                    ) : (
                      <span className="text-sm text-gray-400">Variant #{variantId}</span>
                    )}
                    {label ? <p className="mt-0.5 text-sm text-gray-500">{label}</p> : null}
                    {unitPrice != null && (
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
                    {item.stockQuantity != null && item.stockQuantity === 0 && (
                      <p className="mt-1 text-xs text-red-500">Out of stock</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => item.quantity > 1 && update(variantId, item.quantity - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-sm disabled:opacity-40"
                        disabled={item.quantity <= 1}
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity ?? 1}</span>
                      <button
                        onClick={() => update(variantId, (item.quantity ?? 1) + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-sm"
                      >
                        +
                      </button>
                    </div>
                    {unitPrice != null && (
                      <span className="w-20 text-right text-sm font-semibold text-navy">
                        ₹{(Number(unitPrice) * (item.quantity ?? 1)).toFixed(2)}
                      </span>
                    )}
                    <button
                      onClick={() => remove(variantId)}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-end">
            <div className="rounded-xl bg-white p-4 shadow">
              <p className="text-lg font-semibold text-navy">
                Subtotal: ₹{subtotal.toFixed(2)}
              </p>
              <p className="mt-1 text-xs text-gray-500">{items.length} item{items.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
