import { useEffect, useState } from "react";
import axios from "axios";

function OverdueBooks() {
  const [books, setBooks] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchOverdueBooks = async () => {
      try {
        const res = await axios.get("/library/overdue-books", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBooks(res.data.data || []);
      } catch (err) {
        setError("Failed to fetch overdue books");
      }
    };
    fetchOverdueBooks();
  }, []);

  return (
    <div className="my-6">
      <h3 className="font-bold text-lg mb-2">📕 Overdue Books</h3>
      {error && <p className="text-red-600">{error}</p>}
      {books.length > 0 ? (
        <table className="table-auto border-collapse w-full">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2">Borrowing ID</th>
              <th className="p-2">User</th>
              <th className="p-2">Book</th>
              <th className="p-2">Borrowed Date</th>
              <th className="p-2">Due Date</th>
            </tr>
          </thead>
          <tbody>
            {books.map((b, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-gray-100" : ""}>
                <td className="p-2">{b.borrowing_id}</td>
                <td className="p-2">{b.user_name} ({b.user_email})</td>
                <td className="p-2">{b.book_title}</td>
                <td className="p-2">{new Date(b.borrowed_date).toDateString()}</td>
                <td className="p-2 text-red-600">{new Date(b.due_date).toDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No overdue books 🎉</p>
      )}
    </div>
  );
}

export default OverdueBooks;