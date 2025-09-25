import { useState } from "react";
import axios from "axios";

function ReturnBook() {
  const [borrowingId, setBorrowingId] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const token = localStorage.getItem("token");

  const handleReturn = async () => {
    try {
      setMessage(null);
      await axios.post(
        "/api/library/return",
        { borrowingId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("Book returned successfully!");
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Failed to return book");
    }
  };

  return (
    <div className="my-6 border p-4 rounded bg-gray-50">
      <h3 className="text-lg font-bold mb-2">Return a Book</h3>
      <input
        type="text"
        placeholder="Borrowing ID"
        className="border p-2 mr-2 mb-2"
        value={borrowingId}
        onChange={(e) => setBorrowingId(e.target.value)}
      />
      <button
        onClick={handleReturn}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Return
      </button>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </div>
  );
}
export default ReturnBook;
