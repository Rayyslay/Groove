import { Routes, Route } from "react-router-dom";
import Register from "./pages/authorization/Register";
import Login from "./pages/authorization/Login";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import SetupProfile from "./pages/authorization/SetupProfile";
import ScrollToTopButton from "./components/ScrollToTopButton";

function App() {
  return (
    <>
      {/* Global Gradient Background */}
      <div className="gradient-bg" />

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
    </>
  );
}

export default App;