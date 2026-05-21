const fs = require('fs');
const path = require('path');

const pagesDir = 'src/pages';
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

const pageSEO = {
  'Home.jsx': { title: 'Trade Smarter', desc: 'Experience lightning-fast execution and real-time market data across global assets.', url: '/' },
  'AffiliatePage.jsx': { title: 'Affiliate Program', desc: 'Join the Trade Smarter Affiliate Program and earn high commissions by referring new traders.', url: '/affiliate' },
  'CalculatorPage.jsx': { title: 'Trading Calculator', desc: 'Calculate your potential profits, margins, and pip values with our advanced trading calculator.', url: '/calculator' },
  'CareersPage.jsx': { title: 'Careers', desc: 'Join the team building the future of high-performance trading platforms.', url: '/careers' },
  'ContactPage.jsx': { title: 'Contact Us', desc: 'Get in touch with our 24/7 support team for any trading or account inquiries.', url: '/contact' },
  'FaqPage.jsx': { title: 'FAQ & Help Center', desc: 'Find answers to common questions about trading, deposits, withdrawals, and account security.', url: '/faq' },
  'LegalPage.jsx': { title: 'Legal & Compliance', desc: 'Review our terms of service, privacy policy, and compliance documentation.', url: '/legal' },
  'MarketPage.jsx': { title: 'Global Markets', desc: 'Trade Forex, Crypto, Stocks, and Commodities on a single high-performance platform.', url: '/markets' },
  'NewsPage.jsx': { title: 'Market News & Analysis', desc: 'Stay updated with the latest market news, economic events, and expert trading analysis.', url: '/news' },
  'PricingPage.jsx': { title: 'Pricing & Fees', desc: 'Transparent pricing with zero hidden fees. Compare our competitive spreads and commissions.', url: '/pricing' },
  'ReferralPage.jsx': { title: 'Referral Program', desc: 'Invite friends to Trade Smarter and earn rewards for every successful referral.', url: '/referral' },
  'Register.jsx': { title: 'Open an Account', desc: 'Create your trading account in minutes and start trading global markets instantly.', url: '/register' },
  'TradingPage.jsx': { title: 'Trading Platform', desc: 'Access advanced charting, deep liquidity, and professional trading tools.', url: '/trading' },
  'WhyUsPage.jsx': { title: 'Why Choose Us', desc: 'Discover why professional traders choose our platform for execution speed and reliability.', url: '/why-us' }
};

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  if (content.includes('import SEO')) {
    console.log(`Skipping ${file} - already has SEO`);
    continue;
  }
  
  // Add import statement
  const importMatch = content.match(/import .* from '.*';\n/g);
  if (importMatch) {
    const lastImport = importMatch[importMatch.length - 1];
    content = content.replace(lastImport, `${lastImport}import SEO from '../components/SEO';\n`);
  } else {
    content = `import SEO from '../components/SEO';\n` + content;
  }
  
  const seoData = pageSEO[file] || { title: file.replace('.jsx', ''), desc: '', url: '' };
  const seoTag = `<SEO title="${seoData.title}" description="${seoData.desc}" url="${seoData.url}" />`;
  
  // We want to replace `return (` with `return (\n    <>\n      ${seoTag}`
  // And replace the last `);` with `    </>\n  );`
  
  // Find the first `return (`
  const returnIndex = content.indexOf('return (');
  if (returnIndex !== -1) {
    content = content.slice(0, returnIndex + 8) + `\n    <>\n      ${seoTag}` + content.slice(returnIndex + 8);
    
    // Find the last `);` before `export default` or at the end
    const lastParenIndex = content.lastIndexOf(');');
    if (lastParenIndex !== -1) {
      content = content.slice(0, lastParenIndex) + `\n    </>\n  ` + content.slice(lastParenIndex);
    }
  }

  fs.writeFileSync(filePath, content);
  console.log('Added SEO to ' + file);
}
