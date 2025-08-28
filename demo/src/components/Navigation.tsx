import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  useEffect(() => {
    navigate("/coagent-chat");
  }, []);

  return (
    <header className="bg-blue-600 text-white py-4 fixed top-0 w-full shadow-md z-10 ">
      <div className="container mx-auto flex justify-between items-center px-8">
        <h1 className="text-2xl font-bold">Negotiation Demo</h1>
        <nav className="space-x-4">
          <Link className="hover:underline">Healthcheck</Link>
          <Link
            to="/coagent-chat"
            className={`hover:underline ${
              isActive("/coagent-chat") ? " text-white font-bold" : ""
            }`}
          >
            Coagent Chat
          </Link>
        </nav>
      </div>
    </header>
  );
}
