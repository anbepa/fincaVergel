import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Navigate to a landing-page section without a full page reload.
 * On "/" it smooth-scrolls; elsewhere it routes to "/#id" and the
 * landing page scrolls on arrival. `id === 'top'` scrolls to the top.
 */
export default function useSectionNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return useCallback((id) => {
    if (pathname === '/') {
      if (id === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    navigate(id === 'top' ? '/' : `/#${id}`);
  }, [pathname, navigate]);
}
