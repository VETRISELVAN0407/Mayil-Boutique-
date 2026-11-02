import { useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/* Every new route opens at the top. Back/forward (POP) is left to the browser so it can restore the old position.
   Only the pathname is watched, so filters, sorting and other query/state changes never jump the page. */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    if (navigationType === 'POP') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, navigationType]);

  return null;
}
