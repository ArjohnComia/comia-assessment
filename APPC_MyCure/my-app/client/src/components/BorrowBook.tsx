import { useState } from "react";
import axios from "axios";

function BorrowBook() {
  const [userId, setUserId] = useState("");
  const [bookId, setBookId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const token = localStorage.getItem("token");

  const handleBorrow = async () => {
    try {
      setMessage(null);
      const res = await axios.post(
        "/api/library/borrow",
        { userId, bookId, dueDate },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`Book borrowed successfully! Borrowing ID: ${res.data.borrowingId}`);
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Failed to borrow book");
    }
  };

  return (
    <div className="my-6 border p-4 rounded bg-gray-50">
      <h3 className="text-lg font-bold mb-2">Borrow a Book</h3>
      <input
        type="text"
        placeholder="User ID"
        className="border p-2 mr-2 mb-2"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
      />
      <input
        type="text"
        placeholder="Book ID"
        className="border p-2 mr-2 mb-2"
        value={bookId}
        onChange={(e) => setBookId(e.target.value)}
      />
      <input
        type="date"
        className="border p-2 mr-2 mb-2"
        value={dueDate}
        min={new Date().toISOString().split("T")[0]}
        onChange={(e) => setDueDate(e.target.value)}
      />
      <button
        onClick={handleBorrow}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Borrow
      </button>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </div>
  );
}

export default BorrowBook;
