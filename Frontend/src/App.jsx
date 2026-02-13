import { Routes, Route } from "react-router-dom";
import Register from "./pages/authorization/Register";
import Login from "./pages/authorization/Login";
import Navbar from "./components/Navbar";

function App() {
  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </>
  );
}

export default App;