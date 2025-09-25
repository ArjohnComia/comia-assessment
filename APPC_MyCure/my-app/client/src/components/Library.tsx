import { useState } from "react";
import axios from "axios";
import BorrowBook from "./BorrowBook";
import ReturnBook from "./ReturnBook";

type OverdueBook = {
  borrowing_id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  book_id: number;
  book_title: string;
  borrowed_date: string;
  due_date: string;
};

type PopularBook = {
  book_id: number;
  book_title: string;
  book_author: string;
  borrow_count: number;
};

type UserStat = {
  user_id: number;
  user_name: string;
  user_email: string;
  total_borrowed: number;
  outstanding_books: number;
};

type RevenueReport = {
  month: number;
  year: number;
  total_fines: number;
};

function Library() {
  const [overdueBooks, setOverdueBooks] = useState<OverdueBook[]>([]);
  const [popularBooks, setPopularBooks] = useState<PopularBook[]>([]);
  const [userStats, setUserStats] = useState<UserStat[]>([]);
  const [revenue, setRevenue] = useState<RevenueReport[]>([]);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem("token");

  const fetchOverdueBooks = async () => {
    try {
      setError(null);
      const res = await axios.get("/api/library/overdue-books", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOverdueBooks(res.data.data || []);
    } catch (err) {
      setError("Failed to fetch overdue books");
    }
  };

  const fetchPopularBooks = async () => {
    try {
      setError(null);
      const res = await axios.get("/api/library/popular-books?limit=5", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPopularBooks(res.data.data || []);
    } catch (err) {
      setError("Failed to fetch popular books");
    }
  };

  const fetchUserStats = async () => {
    try {
      setError(null);
      const res = await axios.get("/api/library/user-statistics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserStats(res.data.data || []);
    } catch (err) {
      setError("Failed to fetch user statistics");
    }
  };

  const fetchRevenue = async () => {
    try {
      setError(null);
      const res = await axios.get("/api/library/revenue", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRevenue(res.data.data || []);
    } catch (err) {
      setError("Failed to fetch revenue report");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Library Management</h2>

      <div className="flex gap-4 mb-6">
        <button className="btn btn-primary" onClick={fetchOverdueBooks}>
          Fetch Overdue Books
        </button>
        <button className="btn btn-primary" onClick={fetchPopularBooks}>
          Fetch Popular Books
        </button>
        <button className="btn btn-primary" onClick={fetchUserStats}>
          Fetch User Statistics
        </button>
        <button className="btn btn-primary" onClick={fetchRevenue}>
          Fetch Revenue Report
        </button>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      {/* Overdue Books */}
      {overdueBooks.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold">Overdue Books</h3>
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Book</th>
                <th>Borrowed Date</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {overdueBooks.map((b) => (
                <tr key={b.borrowing_id}>
                  <td>{b.user_name}</td>
                  <td>{b.user_email}</td>
                  <td>{b.book_title}</td>
                  <td>{new Date(b.borrowed_date).toDateString()}</td>
                  <td>{new Date(b.due_date).toDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Popular Books */}
      {popularBooks.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold">Popular Books</h3>
          <ul className="list-disc ml-6">
            {popularBooks.map((b) => (
              <li key={b.book_id}>
                {b.book_title} by {b.book_author} — borrowed {b.borrow_count}{" "}
                times
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* User Stats */}
      {userStats.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold">User Statistics</h3>
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Total Borrowed</th>
                <th>Outstanding Books</th>
              </tr>
            </thead>
            <tbody>
              {userStats.map((u) => (
                <tr key={u.user_id}>
                  <td>{u.user_name}</td>
                  <td>{u.user_email}</td>
                  <td>{u.total_borrowed}</td>
                  <td>{u.outstanding_books}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Revenue */}
      {revenue.length > 0 && (
        <div>
          <h3 className="font-bold">Revenue Report</h3>
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Month</th>
                <th>Year</th>
                <th>Total Fines</th>
              </tr>
            </thead>
            <tbody>
              {revenue.map((r, i) => (
                <tr key={i}>
                  <td>{r.month}</td>
                  <td>{r.year}</td>
                  <td>${r.total_fines}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <BorrowBook />
      <ReturnBook />
    </div>
  );
}

export default Library;
