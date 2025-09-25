import { useEffect, useState } from "react";
import axios from "axios";

function PopularBooks() {
  const [books, setBooks] = useState<any[]>([]);
  const [limit, setLimit] = useState(5);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchPopularBooks = async () => {
      try {
        const res = await axios.get("/library/popular-books", {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit },
        });
        setBooks(res.data.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPopularBooks();
  }, []);

  return (
    <div className="my-6">
      <h3 className="font-bold text-lg mb-2">📚 Popular Books (last 6 months)</h3>
      <label className="mr-2">Limit:</label>
      <input
        type="number"
        value={limit}
        min={1}
        max={20}
        onChange={(e) => setLimit(Number(e.target.value))}
        className="border p-1 w-16 mb-3"
      />
      {books.length > 0 ? (
        <ul className="list-disc pl-5">
          {books.map((b, i) => (
            <li key={i}>
              <strong>{b.book_title}</strong> by {b.book_author} —{" "}
              {b.borrow_count} borrows
            </li>
          ))}
        </ul>
      ) : (
        <p>No popular books found.</p>
      )}
    </div>
  );
}

export default PopularBooks;