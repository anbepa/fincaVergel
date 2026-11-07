import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import Landing from './pages/Landing';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import useRouteSeo from './lib/useRouteSeo';
import GlobalEffects from './components/GlobalEffects';
import {
  ToastProvider,
  ContactFAB,
  DynamicThemeColor,
  BottomNav,
  SkeletonPage,
  usePrefetchRoutes,
  useHapticFeedback,
  usePauseOffscreen,
} from './components/MobileEnhancements';

/* Lazy-loaded pages for prefetch + code splitting */
const Home = lazy(() => import('./pages/Home'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const Contact = lazy(() => import('./pages/Contact'));
const TheFarm = lazy(() => import('./pages/TheFarm'));
const OurProcess = lazy(() => import('./pages/OurProcess'));
const GetToKnowUs = lazy(() => import('./pages/GetToKnowUs'));
const PerfectCoffee = lazy(() => import('./pages/PerfectCoffee'));
const GreenEnergy = lazy(() => import('./pages/GreenEnergy'));
const OurStaff = lazy(() => import('./pages/OurStaff'));
const Login = lazy(() => import('./pages/Admin/Login'));
const Dashboard = lazy(() => import('./pages/Admin/Dashboard'));
const EditPage = lazy(() => import('./pages/Admin/EditPage'));
const AdminLots = lazy(() => import('./pages/Admin/AdminLots'));
const AdminRequests = lazy(() => import('./pages/Admin/AdminRequests'));
const AdminHeroVideo = lazy(() => import('./pages/Admin/AdminHeroVideo'));
const AdminMap = lazy(() => import('./pages/Admin/AdminMap'));

/* In-app 404 for client-side navigation to an unknown route */
function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '90px 24px' }}>
      <h1 style={{ margin: '0 0 12px' }}>Página no encontrada</h1>
      <p style={{ margin: '0 0 28px' }}>La página que buscas no existe o se movió.</p>
      <Link to="/" style={{ background: '#111', color: '#fff', padding: '12px 26px', textDecoration: 'none', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '.8rem', fontWeight: 700 }}>Volver al inicio</Link>
    </div>
  );
}

/* Scroll to top on route change (unless navigating to a #section) */
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

/* Global hooks component */
function GlobalHooks() {
  useRouteSeo();
  usePrefetchRoutes();
  useHapticFeedback();
  usePauseOffscreen();
  return null;
}

function App() {
  return (
    <Router>
      <ToastProvider>
        <ScrollToTop />
        <GlobalEffects />
        <GlobalHooks />
        <DynamicThemeColor />
        <ContactFAB />
        <BottomNav />
        <Routes>
          <Route path="/" element={<Layout noPad><Landing /></Layout>} />
          <Route path="/home" element={<Layout><Suspense fallback={<SkeletonPage />}><Home /></Suspense></Layout>} />
          <Route path="/aboutus" element={<Layout><Suspense fallback={<SkeletonPage />}><AboutUs /></Suspense></Layout>} />
          <Route path="/contact" element={<Layout><Suspense fallback={<SkeletonPage />}><Contact /></Suspense></Layout>} />
          
          {/* Public Pages managed by Admin */}
          <Route path="/thefarm" element={<Layout><Suspense fallback={<SkeletonPage />}><TheFarm /></Suspense></Layout>} />
          <Route path="/ourprocess" element={<Layout><Suspense fallback={<SkeletonPage />}><OurProcess /></Suspense></Layout>} />
          <Route path="/gettoknowus" element={<Layout><Suspense fallback={<SkeletonPage />}><GetToKnowUs /></Suspense></Layout>} />
          <Route path="/perfectcoffee" element={<Layout><Suspense fallback={<SkeletonPage />}><PerfectCoffee /></Suspense></Layout>} />
          <Route path="/greenenergy" element={<Layout><Suspense fallback={<SkeletonPage />}><GreenEnergy /></Suspense></Layout>} />
          <Route path="/our-staff" element={<Layout><Suspense fallback={<SkeletonPage />}><OurStaff /></Suspense></Layout>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<Layout><Suspense fallback={<SkeletonPage />}><Login /></Suspense></Layout>} />
          <Route path="/admin/dashboard" element={<Layout><Suspense fallback={<SkeletonPage />}><Dashboard /></Suspense></Layout>} />
          <Route path="/admin/edit/:slug" element={<Layout><Suspense fallback={<SkeletonPage />}><EditPage /></Suspense></Layout>} />
          <Route path="/admin/lots" element={<Layout><Suspense fallback={<SkeletonPage />}><AdminLots /></Suspense></Layout>} />
          <Route path="/admin/requests" element={<Layout><Suspense fallback={<SkeletonPage />}><AdminRequests /></Suspense></Layout>} />
          <Route path="/admin/hero-video" element={<Layout><Suspense fallback={<SkeletonPage />}><AdminHeroVideo /></Suspense></Layout>} />
          <Route path="/admin/map" element={<Layout><Suspense fallback={<SkeletonPage />}><AdminMap /></Suspense></Layout>} />
          <Route path="*" element={<Layout><NotFound /></Layout>} />
        </Routes>
      </ToastProvider>
    </Router>
  );
}

// Simple Layout component to include Nav and Footer on inner pages
const Layout = ({ children, noPad }) => (
  <div className="layout">
    <a href="#main" className="skip-link">Saltar al contenido</a>
    <Navbar />
    <main id="main" style={noPad ? {} : { paddingTop: '70px' }}>{children}</main>
    <Footer />
  </div>
);

export default App;
