import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { pagesConfig } from "./pages.config";
import PageNotFound from "./lib/PageNotFound";

const { Pages, Layout, mainPage } = pagesConfig;

const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : () => null;

const LayoutWrapper = ({ children, currentPageName }) =>
    Layout ? (
        <Layout currentPageName={currentPageName}>
            {children}
        </Layout>
    ) : (
        <>{children}</>
    );

const getPageName = (pathname) => {
    const p = pathname.replace(/^\//, '');
    if (p === '') return mainPageKey;
    if (Pages[p]) return p;
    return 'NotFound';
};

const pageVariants = {
    initial: { opacity: 0, scale: 0.97, y: 15 },
    in: { opacity: 1, scale: 1, y: 0 },
    out: { opacity: 0, scale: 0.99, y: -5 }
};

const pageTransition = {
    type: "tween",
    ease: "easeOut",
    duration: 0.1
};

const AnimatedPage = ({ children }) => (
    <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="w-full h-full"
    >
        {children}
    </motion.div>
);

function AppContent() {
    const location = useLocation();
    const currentPageName = getPageName(location.pathname);

    return (
        <LayoutWrapper currentPageName={currentPageName}>
            <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                    <Route path="/" element={<AnimatedPage><MainPage /></AnimatedPage>} />
                    {Object.entries(Pages).map(([path, Page]) => (
                        <Route key={path} path={`/${path}`} element={<AnimatedPage><Page /></AnimatedPage>} />
                    ))}
                    <Route path="*" element={<AnimatedPage><PageNotFound /></AnimatedPage>} />
                </Routes>
            </AnimatePresence>
        </LayoutWrapper>
    );
}

function App() {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AppContent />
            <Toaster />
        </Router>
    );
}

export default App;