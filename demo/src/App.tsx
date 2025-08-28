import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navigation } from "./components";
import { DashboardPage } from "./pages";
import CoagentChatPage from "./pages/CoagentChat/CoagentChat";

function App() {
  return (
    <Router>
      <div className="min-h-screen w-screen overflow-hidden bg-white">
        <Navigation />
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/coagent-chat" element={<CoagentChatPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
