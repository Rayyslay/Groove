import { Routes, Route } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";

import Register from "./pages/authorization/Register";
import Login from "./pages/authorization/Login";
import SetupProfile from "./pages/authorization/SetupProfile";

import Navbar from "./components/Navbar";
import ScrollToTopButton from "./components/ScrollToTopButton";

import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>

        <ScrollToTopButton />
      </div>
    </ToastProvider>
  );
}

export default App;