import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./FeedLayout.css";

export default function FeedLayout() {
  return (
    <div className="feed-layout">
      <Sidebar />
      <main className="feed-main">
        <Outlet />
      </main>
    </div>
  );
}
