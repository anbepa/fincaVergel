import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Home from './pages/Home';
import AboutUs from './pages/AboutUs';
import Contact from './pages/Contact';
import TheFarm from './pages/TheFarm';
import OurProcess from './pages/OurProcess';
import GetToKnowUs from './pages/GetToKnowUs';
import PerfectCoffee from './pages/PerfectCoffee';
import GreenEnergy from './pages/GreenEnergy';
import OurStaff from './pages/OurStaff';
import Login from './pages/Admin/Login';
import Dashboard from './pages/Admin/Dashboard';
import EditPage from './pages/Admin/EditPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing IS the scrollable homepage — includes Navbar */}
        <Route path="/" element={<Layout><Landing /></Layout>} />
        <Route path="/home" element={<Layout><Home /></Layout>} />
        <Route path="/aboutus" element={<Layout><AboutUs /></Layout>} />
        <Route path="/contact" element={<Layout><Contact /></Layout>} />

        {/* Public Pages managed by Admin */}
        <Route path="/thefarm"       element={<Layout><TheFarm /></Layout>} />
        <Route path="/ourprocess"    element={<Layout><OurProcess /></Layout>} />
        <Route path="/gettoknowus"   element={<Layout><GetToKnowUs /></Layout>} />
        <Route path="/perfectcoffee" element={<Layout><PerfectCoffee /></Layout>} />
        <Route path="/greenenergy"   element={<Layout><GreenEnergy /></Layout>} />
        <Route path="/our-staff"     element={<Layout><OurStaff /></Layout>} />

        {/* Admin Routes */}
        <Route path="/admin"              element={<Layout><Login /></Layout>} />
        <Route path="/admin/dashboard"    element={<Layout><Dashboard /></Layout>} />
        <Route path="/admin/edit/:slug"   element={<Layout><EditPage /></Layout>} />
      </Routes>
    </Router>
  );
}

const Layout = ({ children }) => (
  <div className="layout">
    <Navbar />
    <main>{children}</main>
    <Footer />
  </div>
);

export default App;
