/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Cart from './pages/cart';
import HelpSupport from './pages/HelpSupport';
import History from './pages/History';
import Home from './pages/Home';
import Notifications from './pages/Notifications';
import Offers from './pages/Offers';
import OrderHistory from './pages/OrderHistory';
import PaymentMethods from './pages/PaymentMethods';
import Profile from './pages/Profile';
import Scanner from './pages/Scanner';
import WalletPage from './pages/WalletPage';
import __Layout from './Layout.jsx';

export const PAGES = {
    "Cart": Cart,
    "HelpSupport": HelpSupport,
    "History": History,
    "Home": Home,
    "Notifications": Notifications,
    "Offers": Offers,
    "OrderHistory": OrderHistory,
    "PaymentMethods": PaymentMethods,
    "Profile": Profile,
    "Scanner": Scanner,
    "WalletPage": WalletPage,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};