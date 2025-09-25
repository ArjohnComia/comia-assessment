import { useEffect, useState } from "react";
import axios from "axios";

function UserStatistics() {
  const [users, setUsers] = useState<any[]>([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const res = await axios.get("/library/user-statistics", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUserStats();
  }, []);

  return (
    <div className="my-6">
      <h3 className="font-bold text-lg mb-2">👤 User Statistics</h3>
      {users.length > 0 ? (
        <table className="table-auto border-collapse w-full">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2">User</th>
              <th className="p-2">Email</th>
              <th className="p-2">Total Borrowed</th>
              <th className="p-2">Outstanding Books</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-gray-100" : ""}>
                <td className="p-2">{u.user_name}</td>
                <td className="p-2">{u.user_email}</td>
                <td className="p-2">{u.total_borrowed}</td>
                <td className="p-2">{u.outstanding_books}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No active users found.</p>
      )}
    </div>
  );
}

export default UserStatistics;

