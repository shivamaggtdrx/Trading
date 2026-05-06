import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  ArrowRightLeft, 
  ListOrdered, 
  LineChart, 
  UsersRound, 
  Settings, 
  Search,
  Bell,
  UserCircle,
  Activity,
  FileText,
  Gift,
  Crosshair,
  Target,
  Network as NetworkIcon,
  Megaphone,
  BarChart,
  Briefcase,
  Key,
  Layers,
  ShieldAlert,
  ScanFace,
  BadgeCheck,
  Clock,
  Calculator,
  PhoneCall,
  UserX,
  ArrowDownToLine,
  Mails,
  LifeBuoy,
  Image as ImageIcon,
  DollarSign,
  CopyCheck,
  HeartPulse,
  Map, 
  Shield, 
  CheckCircle2, 
  AlertTriangle,
  Star,
  BellRing,
  Clock4,
  Download,
  ToggleRight,
  Trophy,
  UserCog,
  ClipboardList,
  MonitorSmartphone,
  LogOut,
  TrendingDown,
  Monitor,
  PieChart,
  Send,
  Files,
  Landmark,
  Crown,
  Sliders,
  Lock,
  Gauge
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Department access keys:
// 'all'              → visible to every department
// 'admin'            → Admin Panel only
// 'finance'          → Finance Department only
// 'customer_service' → Customer Service only
// Array              → multiple departments

const navigation = [
  // ── Core ──
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, dept: 'all' },
  { name: 'Live Market', href: '/live-market', icon: Monitor, dept: 'all' },
  { name: 'Notification Center', href: '/notification-center', icon: BellRing, dept: 'all' },

  // ── Admin-Only: Risk & Trading ──
  { name: 'Dealing Desk', href: '/dealing-desk', icon: Layers, dept: 'admin' },
  { name: 'Risk Management', href: '/risk', icon: ShieldAlert, dept: 'admin' },
  { name: 'Margin Calls', href: '/margin-calls', icon: PhoneCall, dept: 'admin' },
  { name: 'Surveillance', href: '/surveillance', icon: Crosshair, dept: 'admin' },
  { name: 'Market Control', href: '/market-control', icon: Clock, dept: 'admin' },
  { name: 'Square-Off Panel', href: '/square-off', icon: AlertTriangle, dept: 'admin' },
  { name: 'Trader Analytics', href: '/trader-analytics', icon: LineChart, dept: 'admin' },
  { name: 'Exposure Heatmap', href: '/exposure-heatmap', icon: Map, dept: 'admin' },
  { name: 'Master Nodes', href: '/network', icon: NetworkIcon, dept: 'admin' },
  { name: 'Instruments', href: '/instruments', icon: Activity, dept: 'admin' },
  { name: 'Corp. Actions', href: '/corporate-actions', icon: Briefcase, dept: 'admin' },
  { name: 'Feature Flags', href: '/feature-flags', icon: ToggleRight, dept: 'admin' },
  { name: 'IP Whitelist', href: '/ip-whitelist', icon: Shield, dept: 'admin' },

  // ── Finance: P&L, Wallets, Settlements ──
  { name: 'Detailed P&L', href: '/pnl-statement', icon: DollarSign, dept: ['admin', 'finance'] },
  { name: 'Profit Attribution', href: '/profit-attribution', icon: PieChart, dept: ['admin', 'finance'] },
  { name: 'Account Ledger', href: '/ledger', icon: FileText, dept: ['admin', 'finance'] },
  { name: 'Wallets', href: '/wallets', icon: Wallet, dept: ['admin', 'finance'] },
  { name: 'Deposits', href: '/deposits', icon: ArrowDownToLine, dept: ['admin', 'finance'] },
  { name: 'Withdrawals', href: '/withdrawals', icon: BadgeCheck, dept: ['admin', 'finance'] },
  { name: 'EOD / Settlement', href: '/eod-settlement', icon: CheckCircle2, dept: ['admin', 'finance'] },
  { name: 'Brokerage Config', href: '/brokerage-calculator', icon: Calculator, dept: ['admin', 'finance'] },
  { name: 'Fee Config', href: '/fee-config', icon: DollarSign, dept: ['admin', 'finance'] },
  { name: 'Referrals', href: '/referrals', icon: Gift, dept: ['admin', 'finance'] },
  { name: 'Reports', href: '/reports', icon: BarChart, dept: ['admin', 'finance'] },
  { name: 'Data Export Center', href: '/data-export', icon: Download, dept: ['admin', 'finance'] },

  // ── Customer Service: Clients, KYC, Support ──
  { name: 'Users', href: '/users', icon: Users, dept: ['admin', 'customer_service'] },
  { name: 'Leads (CRM)', href: '/leads', icon: Target, dept: ['admin', 'customer_service'] },
  { name: 'Churn Tracker', href: '/churn-prediction', icon: TrendingDown, dept: ['admin', 'customer_service'] },
  { name: 'Support Tickets', href: '/tickets', icon: LifeBuoy, dept: ['admin', 'customer_service'] },
  { name: 'KYC Verification', href: '/kyc', icon: ScanFace, dept: ['admin', 'customer_service'] },
  { name: 'Document Vault', href: '/document-vault', icon: Files, dept: ['admin', 'customer_service'] },
  { name: 'Client Restrictions', href: '/client-restrictions', icon: UserX, dept: ['admin', 'customer_service'] },
  { name: 'Bulk Actions', href: '/bulk-actions', icon: CopyCheck, dept: ['admin', 'customer_service'] },
  { name: 'Client Feedback', href: '/client-feedback', icon: Star, dept: ['admin', 'customer_service'] },
  { name: 'Broadcast', href: '/broadcast', icon: Megaphone, dept: ['admin', 'customer_service'] },
  { name: 'Templates', href: '/templates', icon: Mails, dept: ['admin', 'customer_service'] },
  { name: 'Campaign Manager', href: '/campaign-manager', icon: Send, dept: ['admin', 'customer_service'] },
  { name: 'Banners', href: '/banners', icon: ImageIcon, dept: ['admin', 'customer_service'] },

  // ── Shared: Trading Data (read-only context for finance & support) ──
  { name: 'Trades', href: '/trades', icon: ArrowRightLeft, dept: ['admin', 'finance'] },
  { name: 'Orders', href: '/orders', icon: ListOrdered, dept: ['admin', 'finance'] },

  // ── Admin-Only: Revenue & Profit Controls ──
  { name: 'Profit Ceiling', href: '/profit-ceiling', icon: Lock, dept: 'admin' },
  { name: 'House Book', href: '/house-book', icon: Landmark, dept: 'admin' },
  { name: 'Smart Spreads', href: '/smart-spread', icon: Sliders, dept: 'admin' },
  { name: 'Client Tiers', href: '/client-tiers', icon: Crown, dept: 'admin' },
  { name: 'Revenue Leakage', href: '/revenue-leakage', icon: TrendingDown, dept: ['admin', 'finance'] },

  // ── Admin-Only: System & Engagement ──
  { name: 'Tournaments', href: '/tournaments', icon: Trophy, dept: 'admin' },
  { name: 'Cron Manager', href: '/cron-manager', icon: Clock4, dept: 'admin' },
  { name: 'API / Algos', href: '/api-keys', icon: Key, dept: 'admin' },
  { name: 'System Config', href: '/settings', icon: Settings, dept: 'admin' },
  { name: 'System Health', href: '/health', icon: HeartPulse, dept: 'admin' },
  { name: 'Audit Logs', href: '/logs', icon: FileText, dept: 'admin' },
  { name: 'Admin Users', href: '/admin-users', icon: UserCog, dept: 'admin' },
  { name: 'Admin Audit Trail', href: '/admin-audit', icon: ClipboardList, dept: 'admin' },
  { name: 'Sessions', href: '/sessions', icon: MonitorSmartphone, dept: 'admin' },
];

// Department branding config
const DEPT_CONFIG = {
  admin: {
    label: 'Admin',
    accentFrom: 'from-blue-500',
    accentTo: 'to-blue-700',
    activeBg: 'bg-blue-50',
    activeText: 'text-blue-700',
    dotColor: 'bg-blue-600',
  },
  finance: {
    label: 'Finance',
    accentFrom: 'from-emerald-500',
    accentTo: 'to-emerald-700',
    activeBg: 'bg-emerald-50',
    activeText: 'text-emerald-700',
    dotColor: 'bg-emerald-600',
  },
  customer_service: {
    label: 'Support',
    accentFrom: 'from-purple-500',
    accentTo: 'to-purple-700',
    activeBg: 'bg-purple-50',
    activeText: 'text-purple-700',
    dotColor: 'bg-purple-600',
  },
};

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const dept = user?.department || 'admin';
  const deptCfg = DEPT_CONFIG[dept] || DEPT_CONFIG.admin;

  // Filter navigation items by department
  const filteredNav = navigation.filter((item) => {
    if (item.dept === 'all') return true;
    if (Array.isArray(item.dept)) return item.dept.includes(dept);
    return item.dept === dept;
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 z-10">
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <span className="text-lg font-bold text-gray-900 tracking-tight">
            Trade<span className={deptCfg.activeText}>X</span>
          </span>
          <span className={`text-xs font-bold px-2 py-1 rounded-full bg-gradient-to-r ${deptCfg.accentFrom} ${deptCfg.accentTo} text-white`}>
            {deptCfg.label}
          </span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? `${deptCfg.activeBg} ${deptCfg.activeText}`
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        'mr-3 flex-shrink-0 h-5 w-5 transition-colors',
                        isActive ? deptCfg.activeText : 'text-gray-400 group-hover:text-gray-500'
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col pl-64 min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-10 flex-shrink-0">
          <div className="h-full px-8 flex items-center justify-between">
            {/* Search */}
            <div className="flex-1 min-w-0 max-w-md">
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="search"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search across admin..."
                />
              </div>
            </div>

            {/* Profile & Notifications */}
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              <div className="relative">
                <button className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none relative group">
                  <span className="sr-only">View notifications</span>
                  <Bell className="h-5 w-5" aria-hidden="true" />
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
                  
                  {/* Notification Dropdown (Hover) */}
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 border border-gray-200 hidden group-hover:block z-50">
                    <div className="px-4 py-2 border-b border-gray-100 font-medium text-gray-900">Risk Alerts</div>
                    <div className="px-4 py-3 hover:bg-gray-50 border-b border-gray-50">
                      <p className="text-sm font-medium text-red-600">Unusual Activity Detected</p>
                      <p className="text-xs text-gray-500 mt-1">User TDX-82491 initiated 5 large withdrawals in 10 mins.</p>
                    </div>
                    <div className="px-4 py-3 hover:bg-gray-50 border-b border-gray-50">
                      <p className="text-sm font-medium text-orange-600">Margin Warning</p>
                      <p className="text-xs text-gray-500 mt-1">15 users approaching 80% margin threshold.</p>
                    </div>
                  </div>
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{user?.name || 'Admin'}</div>
                  <div className="text-xs text-gray-500">{user?.role || 'Unknown'}</div>
                </div>
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${deptCfg.accentFrom} ${deptCfg.accentTo} flex items-center justify-center text-white text-xs font-bold`}>
                  {user?.avatar || 'A'}
                </div>
                <button onClick={handleLogout} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Logout">
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-8 py-8 h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
