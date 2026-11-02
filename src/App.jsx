import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { ToastProvider } from './context/ToastContext';

/* Admin */
import AdminLayout from './layouts/AdminLayout';
import AdminLogin from './features/auth/AdminLogin';
import AdminDashboard from './features/admin/Dashboard';
import AdminCategories from './features/admin/Categories';
import AdminProducts from './features/admin/Products';
import AdminOrders from './features/admin/Orders';
import AdminCustomers from './features/admin/Customers';
import AdminStockUpdate from './features/admin/StockUpdate';
import AdminCoupons from './features/admin/Coupons';
import AdminSales from './features/admin/Sales';
import AdminAccount from './features/admin/Account';
import AdminPackingSlip from './features/admin/PackingSlip';
import AdminTryOnStats from './features/admin/TryOnStats';

/* Storefront layout */
import StorefrontLayout from './components/layout/StorefrontLayout';
import ScrollToTop from './components/layout/ScrollToTop';

/* Storefront pages */
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import CategoryPage from './pages/CategoryPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import LoginPage from './pages/LoginPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import InvoicePage from './pages/InvoicePage';
import AccountPage from './pages/AccountPage';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';
import PolicyPage from './pages/PolicyPage';
import NotFoundPage from './pages/NotFoundPage';
import VirtualTryOnPage from './pages/virtual-try-on/VirtualTryOnPage';
import TryOnUploadPage from './pages/virtual-try-on/TryOnUploadPage';
import TryOnResultPage from './pages/virtual-try-on/TryOnResultPage';

function App() {
  return (
    <AuthProvider>
        <WishlistProvider>
          <CartProvider>
              <ToastProvider>
                <ScrollToTop />
                <Routes>
                  {/* Admin routes (unchanged) */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route element={<AdminLayout />}>
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/categories" element={<AdminCategories />} />
                    <Route path="/admin/products" element={<AdminProducts />} />
                    <Route path="/admin/orders" element={<AdminOrders />} />
                    <Route path="/admin/orders/:orderRef/slip" element={<AdminPackingSlip />} />
                    <Route path="/admin/customers" element={<AdminCustomers />} />
                    <Route path="/admin/stock-update" element={<AdminStockUpdate />} />
                    <Route path="/admin/coupons" element={<AdminCoupons />} />
                    <Route path="/admin/sales" element={<AdminSales />} />
                    <Route path="/admin/try-on" element={<AdminTryOnStats />} />
                    <Route path="/admin/account" element={<AdminAccount />} />
                  </Route>

                  {/* Storefront routes */}
                  <Route element={<StorefrontLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/products/:slug" element={<ProductDetailPage />} />
                    <Route path="/category/:slug" element={<CategoryPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/wishlist" element={<WishlistPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
                    <Route path="/invoice/:orderId" element={<InvoicePage />} />
                    <Route path="/account" element={<AccountPage />} />
                    <Route path="/account/orders" element={<AccountPage />} />
                    <Route path="/virtual-try-on" element={<VirtualTryOnPage />} />
                    <Route path="/virtual-try-on/result/:jobId" element={<TryOnResultPage />} />
                    <Route path="/virtual-try-on/:productId" element={<TryOnUploadPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/policy/:type" element={<PolicyPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Route>
                </Routes>
              </ToastProvider>
          </CartProvider>
        </WishlistProvider>
    </AuthProvider>
  );
}

export default App;
