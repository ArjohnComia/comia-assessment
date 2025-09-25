import { Pool } from "pg";

export const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD),
  database: "library",
  max: 10, // max concurrent connections
});

// Helper to query
export async function query(sql: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const res = await client.query(sql, params);
    return res;
  } finally {
    client.release();
  }
}

/* =============================
DB FUNCTIONS
============================= */
// Borrow a book
export async function borrowBook(
  userId: string,
  bookId: string,
  dueDate: string
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lock the book row
    const bookRes = await client.query(
      "SELECT available_copies FROM Books WHERE id=$1 FOR UPDATE",
      [bookId]
    );

    if (bookRes.rows.length === 0) throw new Error("Book not found");
    if (bookRes.rows[0].available_copies <= 0)
      throw new Error("No copies available");

    const insertRes = await client.query(
      `INSERT INTO Borrowings (user_id, book_id, borrowed_date, due_date)
       VALUES ($1, $2, NOW(), $3)
       RETURNING id`,
      [userId, bookId, dueDate]
    );

    const borrowingId = insertRes.rows[0].id;

    // Decrement available copies
    await client.query(
      "UPDATE Books SET available_copies = available_copies - 1 WHERE id=$1",
      [bookId]
    );

    await client.query("COMMIT");
    return { success: true, borrowingId: borrowingId };
  } catch (err: any) {
    await client.query("ROLLBACK");
    return { success: false, message: err.message };
  } finally {
    client.release();
  }
}

// Return a book
export async function returnBook(borrowingId: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const borrowRes = await client.query(
      "SELECT book_id, returned_date FROM Borrowings WHERE id=$1 FOR UPDATE",
      [borrowingId]
    );

    if (borrowRes.rows.length === 0) throw new Error("Borrowing not found");
    if (borrowRes.rows[0].returned_date !== null)
      throw new Error("Book already returned");

    // Update borrowing as returned
    await client.query(
      "UPDATE Borrowings SET returned_date=NOW() WHERE id=$1",
      [borrowingId]
    );

    // Increment book available copies
    await client.query(
      "UPDATE Books SET available_copies = available_copies + 1 WHERE id=$1",
      [borrowRes.rows[0].book_id]
    );

    await client.query("COMMIT");
    return { success: true };
  } catch (err: any) {
    await client.query("ROLLBACK");
    return { success: false, message: err.message };
  } finally {
    client.release();
  }
}

// Get overdue books
export async function getOverdueBooks() {
  const res = await query(
    `
    SELECT 
      br.id AS borrowing_id,
      u.id AS user_id,
      u.name AS user_name,
      u.email AS user_email,
      bk.id AS book_id,
      bk.title AS book_title,
      br.borrowed_date,
      br.due_date
    FROM Borrowings br
    JOIN Users u ON br.user_id = u.id
    JOIN Books bk ON br.book_id = bk.id
    WHERE br.returned_date IS NULL
      AND br.due_date < CURRENT_DATE
    ORDER BY br.due_date ASC;
    `
  );
  return res.rows;
}

// Get popular books
export async function getPopularBooks(limit = 5) {
  const res = await query(
    `
    SELECT 
      bk.id AS book_id,
      bk.title AS book_title,
      bk.author AS book_author,
      COUNT(br.id) AS borrow_count
    FROM Borrowings br
    JOIN Books bk ON br.book_id = bk.id
    WHERE br.borrowed_date >= (CURRENT_DATE - INTERVAL '6 months')
    GROUP BY bk.id, bk.title, bk.author
    ORDER BY borrow_count DESC
    LIMIT $1;
    `,
    [limit]
  );
  return res.rows;
}

// User statistics
export async function getUserStatistics() {
  const res = await query(
    `
    SELECT 
      u.id AS user_id,
      u.name AS user_name,
      u.email AS user_email,
      COUNT(br.id) AS total_borrowed,
      SUM(CASE WHEN br.returned_date IS NULL THEN 1 ELSE 0 END) AS outstanding_books
    FROM Users u
    LEFT JOIN Borrowings br ON br.user_id = u.id
    WHERE u.is_active = TRUE
    GROUP BY u.id, u.name, u.email
    ORDER BY u.name;
    `
  );
  return res.rows;
}

// Revenue report
export async function getRevenueReport() {
  const res = await query(
    `
    SELECT 
      EXTRACT(MONTH FROM br.returned_date) AS month,
      EXTRACT(YEAR FROM br.returned_date) AS year,
      SUM(br.fine_amount) AS total_fines
    FROM Borrowings br
    WHERE br.returned_date IS NOT NULL
      AND EXTRACT(YEAR FROM br.returned_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    GROUP BY EXTRACT(YEAR FROM br.returned_date), EXTRACT(MONTH FROM br.returned_date)
    ORDER BY month;
    `
  );
  return res.rows;
}
