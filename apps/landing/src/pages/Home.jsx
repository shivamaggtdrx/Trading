import SEO from '../components/SEO';
import React from 'react';
import Hero from '../components/Hero';
import WhyUs from '../components/WhyUs';
import Markets from '../components/Markets';
import TradingTypes from '../components/TradingTypes';
import Features from '../components/Features';
import Referral from '../components/Referral';
import NewsBlogs from '../components/NewsBlogs';
import FAQ from '../components/FAQ';
import CTA from '../components/CTA';

export default function Home() {
  return (
    <>
      <SEO title="Trade Smarter" description="Experience lightning-fast execution and real-time market data across global assets." url="/" />
    <main>
      <Hero />
      <WhyUs />
      <Markets />
      <TradingTypes />
      <Features />
      <Referral />
      <NewsBlogs />
      <FAQ />
      <CTA />
    </main>
  
    </>
  );
}
