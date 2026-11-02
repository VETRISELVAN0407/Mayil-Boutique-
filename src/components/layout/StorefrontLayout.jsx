import { Outlet, useLocation } from 'react-router-dom';
import AnnouncementBar from './AnnouncementBar';
import Header from './Header';
import Footer from './Footer';

export default function StorefrontLayout() {
  // The home page has its own hero with the header laid over it, so it skips the announcement bar.
  const isHome = useLocation().pathname === '/';
  return (
    <div className="flex min-h-screen flex-col">
      {!isHome && <AnnouncementBar />}
      <Header />
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
