import { Routes, Route } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";

import Register from "./pages/authorization/Register";
import Login from "./pages/authorization/Login";
import SetupProfile from "./pages/authorization/SetupProfile";

import Navbar from "./components/Navbar";
import Footer from "./components/footer/Footer";
import ScrollToTopButton from "./components/ScrollToTopButton";
import ProtectedRoute from "./components/ProtectedRoute";

import FAQ from "./components/footer/pages/FAQ";
import CommunityGuidelines from "./components/footer/pages/CommunityGuidelines";
import PrivacyPolicy from "./components/footer/pages/PrivacyPolicy";
import TermsOfService from "./components/footer/pages/TermsOfService";
import Contact from "./components/footer/pages/Contact";

import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

import FeedLayout from "./pages/FeedLayout";
import Feed from "./pages/feed/Feed";
import Explore from "./pages/feed/Explore";
import Profile from "./pages/feed/Profile";
import Settings from "./pages/feed/Settings";
import CreatePost from "./pages/feed/CreatePost";
import Search from "./pages/feed/Search";

import ToastContainer from "./components/Toast/ToastContainer";

function App() {
  return (
    <ToastProvider>
      <div className="gradient-bg" />

      {/* Global Toast Renderer */}
      <ToastContainer />

      <div className="app-layout">
        <Navbar />

        <div className="page-wrapper">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/setup-profile" element={<SetupProfile />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/guidelines" element={<CommunityGuidelines />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/contact" element={<Contact />} />

            {/* Feed pages with sidebar — protected */}
            <Route element={<ProtectedRoute><FeedLayout /></ProtectedRoute>}>
              <Route path="/feed" element={<Feed />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/search" element={<Search />} />
              <Route path="/create-post" element={<CreatePost />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:id" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>

        <ScrollToTopButton />
        <Footer />
      </div>
    </ToastProvider>
  );
}

export default App;