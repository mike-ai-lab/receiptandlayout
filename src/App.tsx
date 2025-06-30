import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import ReceiptGeneratorPage from './pages/ReceiptGeneratorPage';
import TentsLayoutPage from './pages/TentsLayoutPage';
import TentBookingsTablePage from './pages/TentBookingsTablePage';
import ReceiptsTablePage from './pages/ReceiptsTablePage';
import { ReceiptIcon } from './components/icons/ReceiptIcon';
import { LayersIcon } from './components/icons/LayersIcon';
import { FileTextIcon } from './components/icons/FileTextIcon';

// Extend window interface for appLogout
declare global {
  interface Window {
    appLogout?: () => void;
  }
}

const Navigation: React.FC = () => {
  const location = useLocation();
  
  const handleLogout = () => {
    setTimeout(() => {
      if (window.appLogout) {
        window.appLogout();
      } else {
        console.error("Logout function (window.appLogout) not found. Using fallback.");
        try {
          localStorage.removeItem("RECEIPT_ADMIN_SESSION_TOKEN");
        } catch(e) { 
          console.error("Error removing item from localStorage during fallback logout:", e);
        }
        window.location.reload();
      }
    }, 0);
  };

  const navItems = [
    { path: '/', label: 'Receipt Generator', icon: ReceiptIcon },
    { path: '/receipts-database', label: 'Receipts Database', icon: FileTextIcon },
    { path: '/tents-layout', label: 'Tents Layout', icon: LayersIcon },
    { path: '/tents-bookings', label: 'Tent Bookings', icon: FileTextIcon },
  ];

  return (
    <nav className="bg-white shadow-lg border-b border-slate-200 no-print">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <img 
                src="https://hbslewdkkgwsaohjyzak.supabase.co/storage/v1/object/public/tkr//logo.png" 
                alt="TKR Logo" 
                className="h-8 w-8 object-contain"
              />
              <span className="font-bold text-xl text-slate-800">TKR Admin</span>
            </div>
            
            <div className="hidden lg:flex space-x-1">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                    location.pathname === path
                      ? 'bg-primary text-white'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors text-sm"
            title="Logout"
          >
            LOGOUT
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden pb-4">
          <div className="grid grid-cols-2 gap-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center space-y-1 px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                  location.pathname === path
                    ? 'bg-primary text-white'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-center">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <div id="receipt-app-container" className="min-h-screen bg-base-200 relative">
        <Navigation />
        
        <Routes>
          <Route path="/" element={<ReceiptGeneratorPage />} />
          <Route path="/receipts-database" element={<ReceiptsTablePage />} />
          <Route path="/tents-layout" element={<TentsLayoutPage />} />
          <Route path="/tents-bookings" element={<TentBookingsTablePage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;