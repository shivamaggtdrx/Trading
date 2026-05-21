import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import MarketPage from './pages/MarketPage';
import TradingPage from './pages/TradingPage';
import LegalPage from './pages/LegalPage';
import Register from './pages/Register';
import ContactPage from './pages/ContactPage';
import AffiliatePage from './pages/AffiliatePage';
import WhyUsPage from './pages/WhyUsPage';
import NewsPage from './pages/NewsPage';
import ReferralPage from './pages/ReferralPage';
import CareersPage from './pages/CareersPage';
import FaqPage from './pages/FaqPage';
import FloatingChat from './components/FloatingChat';
import CalculatorPage from './pages/CalculatorPage';
import PricingPage from './pages/PricingPage';

function App() {
  return (
    <HelmetProvider>
      <Router>
      <div className="min-h-screen bg-fintech-gray font-sans selection:bg-primary selection:text-white">
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="*" element={
            <>
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/markets/:marketId" element={<MarketPage />} />
                <Route path="/trading/:tradingId" element={<TradingPage />} />
                <Route path="/legal/:pageId" element={<LegalPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/affiliate" element={<AffiliatePage />} />
                <Route path="/why-us" element={<WhyUsPage />} />
                <Route path="/news" element={<NewsPage />} />
                <Route path="/referral" element={<ReferralPage />} />
                <Route path="/careers" element={<CareersPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/faq" element={<FaqPage />} />
                <Route path="/calculator" element={<CalculatorPage />} />
              </Routes>
              <Footer />
              <FloatingChat />
            </>
          } />
        </Routes>
      </div>
      </Router>
    </HelmetProvider>
  );
}

export default App;
