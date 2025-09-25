import {
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";
import Tasks from "./Tasks";
import Library from "./Library";

function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <nav className="flex gap-6 mb-6">
        <Link to="/dashboard/tasks" className="text-blue-600">
          Tasks
        </Link>
        <Link to="/dashboard/library" className="text-blue-600">
          Library
        </Link>
        <button
          onClick={handleLogout}
          className="bg-gray-700 text-white px-3 py-1 rounded"
        >
          Logout
        </button>
      </nav>

      <Routes>
        {/* <Route index element={<Tasks />} />   */}
        <Route path="tasks" element={<Tasks />} />
        <Route path="library" element={<Library />} />
      </Routes>
    </div>

    
  );
}

export default Dashboard;
