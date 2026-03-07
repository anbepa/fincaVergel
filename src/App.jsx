import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Landing from './pages/Landing';
import Home from './pages/Home';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
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

/* Global hooks component */
function GlobalHooks() {
  usePrefetchRoutes();
  useHapticFeedback();
  usePauseOffscreen();
  return null;
}

function App() {
  return (
    <Router>
      <ToastProvider>
        <GlobalEffects />
        <GlobalHooks />
        <DynamicThemeColor />
        <ContactFAB />
        <BottomNav />
        <Routes>
          <Route path="/" element={<Layout noPad><Landing /></Layout>} />
          <Route path="/home" element={<Layout><Home /></Layout>} />
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
        </Routes>
      </ToastProvider>
    </Router>
  );
}

// Simple Layout component to include Nav and Footer on inner pages
const Layout = ({ children, noPad }) => (
  <div className="layout">
    <Navbar />
    <main style={noPad ? {} : { paddingTop: '70px' }}>{children}</main>
    <Footer />
  </div>
);

export default App;
