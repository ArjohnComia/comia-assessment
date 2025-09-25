-- =========================
-- Books Table
-- =========================
CREATE TABLE Books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(20) NOT NULL UNIQUE,
    publication_year INT NOT NULL,
    available_copies INT NOT NULL CHECK (available_copies >= 0),
    total_copies INT NOT NULL CHECK (total_copies >= 0),
    CONSTRAINT chk_available_copies CHECK (available_copies <= total_copies)
);

-- Optional indexes for faster search
CREATE INDEX idx_books_title ON Books(title);
CREATE INDEX idx_books_author ON Books(author);

-- =========================
-- Users Table
-- =========================
CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    membership_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Optional index for email lookups
CREATE INDEX idx_users_email ON Users(email);
CREATE INDEX idx_users_is_active ON Users(is_active);

-- =========================
-- Borrowings Table
-- =========================
CREATE TABLE Borrowings (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    borrowed_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    returned_date DATE,
    fine_amount NUMERIC(10,2) DEFAULT 0.00 CHECK (fine_amount >= 0),
    CONSTRAINT fk_borrowings_user FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    CONSTRAINT fk_borrowings_book FOREIGN KEY (book_id) REFERENCES Books(id) ON DELETE CASCADE,
    CONSTRAINT chk_due_date CHECK (due_date >= borrowed_date),
    CONSTRAINT chk_returned_date CHECK (returned_date IS NULL OR returned_date >= borrowed_date)
);

-- Optional indexes for faster queries
CREATE INDEX idx_borrowings_user_id ON Borrowings(user_id);
CREATE INDEX idx_borrowings_book_id ON Borrowings(book_id);
CREATE INDEX idx_borrowings_due_date ON Borrowings(due_date);
CREATE INDEX idx_borrowings_user_id_returned_date ON Borrowings(user_id, returned_date);
CREATE INDEX idx_borrowings_borrowed_date_book_id ON Borrowings(borrowed_date, book_id);
CREATE INDEX idx_borrowings_returned_date_due_date ON Borrowings(returned_date, due_date);
CREATE INDEX idx_borrowings_returned_date_fine_amount ON Borrowings(returned_date, fine_amount);

-- =========================
-- Books (10 sample entries)
-- =========================
INSERT INTO Books (title, author, isbn, publication_year, available_copies, total_copies) VALUES
('The Great Gatsby', 'F. Scott Fitzgerald', '9780743273565', 1925, 3, 5),
('1984', 'George Orwell', '9780451524935', 1949, 1, 4),
('To Kill a Mockingbird', 'Harper Lee', '9780061120084', 1960, 2, 3),
('Moby-Dick', 'Herman Melville', '9781503280786', 1851, 5, 5),
('Pride and Prejudice', 'Jane Austen', '9781503290563', 1813, 4, 6),
('The Hobbit', 'J.R.R. Tolkien', '9780547928227', 1937, 2, 4),
('War and Peace', 'Leo Tolstoy', '9780199232765', 1869, 1, 2),
('The Catcher in the Rye', 'J.D. Salinger', '9780316769488', 1951, 0, 3),
('Brave New World', 'Aldous Huxley', '9780060850524', 1932, 2, 2),
('The Lord of the Rings', 'J.R.R. Tolkien', '9780618640157', 1954, 5, 7);

-- =========================
-- Users (5 sample entries)
-- =========================
INSERT INTO Users (name, email, phone, membership_date, is_active) VALUES
('Alice Johnson', 'alice@example.com', '123-456-7890', '2023-01-10', TRUE),
('Bob Smith', 'bob@example.com', '555-123-4567', '2023-02-15', TRUE),
('Charlie Brown', 'charlie@example.com', '999-888-7777', '2022-11-20', TRUE),
('Diana Prince', 'diana@example.com', '111-222-3333', '2023-03-05', FALSE),
('Evan Wright', 'evan@example.com', '444-555-6666', '2023-05-12', TRUE);

-- =========================
-- Borrowings (mix of returned, overdue, on time)
-- =========================
INSERT INTO Borrowings (user_id, book_id, borrowed_date, due_date, returned_date, fine_amount) VALUES
-- Alice borrowed Gatsby, overdue
(1, 1, '2025-09-01', '2025-09-15', NULL, 0.00),
-- Alice returned 1984 late, fine
(1, 2, '2025-05-01', '205-05-20', '2025-06-01', 5.00),
-- Bob borrowed Mockingbird, still within due date
(2, 3, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '10 days', NULL, 0.00),
-- Bob returned Moby-Dick on time
(2, 4, '2025-03-01', '2025-03-20', '2025-03-18', 0.00),
-- Charlie borrowed Hobbit, overdue
(3, 6, '2025-08-01', '2025-08-15', NULL, 0.00),
-- Charlie returned Pride and Prejudice late, fine
(3, 5, '2025-04-01', '2025-04-20', '2025-05-05', 2.50),
-- Diana (inactive) borrowed War and Peace, returned
(4, 7, '2025-01-01', '2025-01-20', '2025-01-25', 0.00),
-- Evan borrowed Catcher, still overdue
(5, 8, '2025-07-10', '2025-07-25', NULL, 0.00),
-- Evan borrowed Brave New World, returned late with fine
(5, 9, '2025-06-01', '2025-06-15', '2025-07-01', 3.00),
-- Evan borrowed LOTR, still active
(5, 10, CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '20 days', NULL, 0.00);