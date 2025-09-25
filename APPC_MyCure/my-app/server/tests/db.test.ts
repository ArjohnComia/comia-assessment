import { describe, it, expect, beforeEach, vi } from "bun:test";
import * as db from "../database";

// Mock the entire module (the query function inside database.ts)
vi.mock("../database", () => ({
  query: vi.fn(),
}));

const queryMock = db.query as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  queryMock.mockReset(); // reset the mock before each test
});

/* =============================
UNIT TESTS FOR DB QUERIES
============================= */
describe("Database query functions", () => {
  describe("getOverdueBooks", () => {
    it("should return overdue borrowings", async () => {
      const fakeRows = [
        {
          borrowing_id: 1,
          user_id: 10,
          user_name: "Alice",
          user_email: "alice@example.com",
          book_id: 5,
          book_title: "The Hobbit",
          borrowed_date: "2024-01-01",
          due_date: "2024-01-10",
        },
      ];
      queryMock.mockResolvedValueOnce({ rows: fakeRows });

      const result = await db.getOverdueBooks();

      expect(queryMock).toHaveBeenCalled();
      expect(result).toEqual(fakeRows);
    });

    it("should throw an error if query fails", async () => {
      queryMock.mockRejectedValueOnce(new Error("DB connection lost"));

      await expect(db.getOverdueBooks()).rejects.toThrow("DB connection lost");
      expect(queryMock).toHaveBeenCalled();
    });
  });

  describe("getPopularBooks", () => {
    it("should return popular books", async () => {
      const fakeRows = [
        {
          book_id: 1,
          book_title: "1984",
          book_author: "Orwell",
          borrow_count: "12",
        },
      ];
      queryMock.mockResolvedValueOnce({ rows: fakeRows });

      const result = await db.getPopularBooks(3);

      expect(queryMock).toHaveBeenCalledWith(
        expect.stringContaining("LIMIT $1;"),
        [3]
      );
      expect(result).toEqual(fakeRows);
    });

    it("should throw an error if query fails", async () => {
      queryMock.mockRejectedValueOnce(new Error("Timeout"));

      await expect(db.getPopularBooks()).rejects.toThrow("Timeout");
    });
  });

  describe("getUserStatistics", () => {
    it("should return user statistics", async () => {
      const fakeRows = [
        {
          user_id: 1,
          user_name: "Bob",
          user_email: "bob@example.com",
          total_borrowed: "3",
          outstanding_books: "1",
        },
      ];
      queryMock.mockResolvedValueOnce({ rows: fakeRows });

      const result = await db.getUserStatistics();

      expect(result).toEqual(fakeRows);
    });

    it("should throw if query fails", async () => {
      queryMock.mockRejectedValueOnce(new Error("Invalid SQL"));

      await expect(db.getUserStatistics()).rejects.toThrow("Invalid SQL");
    });
  });

  describe("getRevenueReport", () => {
    it("should return revenue report", async () => {
      const fakeRows = [
        { month: "1", year: "2025", total_fines: "200.00" },
        { month: "2", year: "2025", total_fines: "150.00" },
      ];
      queryMock.mockResolvedValueOnce({ rows: fakeRows });

      const result = await db.getRevenueReport();

      expect(result).toEqual(fakeRows);
    });

    it("should throw if query fails", async () => {
      queryMock.mockRejectedValueOnce(new Error("Query error"));

      await expect(db.getRevenueReport()).rejects.toThrow("Query error");
    });
  });
});
