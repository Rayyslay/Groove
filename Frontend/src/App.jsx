import { Routes, Route } from "react-router-dom";
import Register from "./pages/authorization/Register";
import Login from "./pages/authorization/Login";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import ScrollToTopButton from "./components/ScrollToTopButton";

function App() {
  return (
    <div className="app-layout">
      <Navbar />
      <div className="page-wrapper">
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/Home" element={<Home />} />
        </Routes>
      </div>
      <ScrollToTopButton />
    </div>
  );
}

export default App;