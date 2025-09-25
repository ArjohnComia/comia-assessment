<!-- # Library Management System

This is a full-stack library management system with a Bun backend and a React/Vite frontend. It supports borrowing and returning books, user and admin roles, and various reporting features.

--- -->

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd <repo-folder>
```

### 2. Install Dependencies

#### Root (Backend)

```bash
bun install
```

#### Client (Frontend)

```bash
cd client
bun install
```

### 3. Setup PostgreSQL Database

1. Download and install [PostgreSQL](https://www.postgresql.org/download/).
2. Create a new database called `library` .
3. Open your database (e.g., via `psql` or pgAdmin) and run the SQL commands located in `server/db.sql` to create tables and seed data.

### 4. Configure Environment

* Make sure your `.env` file contains the correct PostgreSQL connection info (host, port, user, password, database).
* Ensure the backend URL in `client/vite.config.ts` matches your backend port.

### 5. Start the Application

Go back to the root folder:

```bash
cd ..
bun run dev
```

* The backend and frontend should now be running.

---

## Running Tests

To run **unit and integration tests**:

```bash
bun test
```

---
## Admin Credentials
> Email: arc@admin
> 
> Password: password

---

## Notes

* Make sure PostgreSQL is running and accessible on the port specified in `.env`.
* You can modify initial users, books, and borrowings by editing the SQL file in `server/db.sql`.
* Frontend forms are located in the `client` folder.
* Inspect the page if the token authorization is expired. Features will not work without authorization

---

## Folder Structure

```
root/
├─ server/        # Backend code, database scripts (db.sql)
├─ client/        # React/Vite frontend
├─ .env           # Environment variables
├─ package.json   # Bun scripts and dependencies
```


---

## Section 6 - Performance & Optimization

### Caching Strategy

#### Endpoints Benefitting from Caching

* **GET /api/tasks**: Highly beneficial as multiple users may view similar task lists. Caching common filters and paginated results reduces repeated expensive queries, freeing server resources for write operations.
* **GET /api/tasks/\:id**: Less frequent queries but can still benefit from caching. If a user reloads or revisits a task, the cached data serves it instantly.

#### Caching Approach

* **Development**: In-memory caching for fast access; data lost on server restart. Simple but not scalable.
* **Production**: Redis caching for centralized, scalable, persistent cache across multiple servers. Slight communication delay but ensures consistency.

#### Cache Invalidation

* **Time-based (TTL)**: Automatically remove cached data after a set period (e.g., 60 seconds).
* **Write-through invalidation**: Clear cache actively when underlying data is modified.

### Database Optimization

#### Potential Performance Bottlenecks

* Large joins across **Users**, **Books**, and **Borrowings** tables can slow queries.
* Aggregation functions like `COUNT` or `SUM` on large datasets are computationally expensive.
* Repeated searches scanning entire tables can degrade performance.

#### Suggested Database Indexes

* **Borrowings**

  * `INDEX (user_id)` → speeds up joins with Users
  * `INDEX (book_id)` → speeds up joins with Books
  * `INDEX (due_date, returned_date)` → speeds up overdue queries
  * `INDEX (borrowed_date)` → improves popular books queries
* **Users**

  * `INDEX (email)` → speeds up authentication
  * `INDEX (is_active)` → improves user statistics queries

#### Query Optimizations

* Replace aggregate functions with indexed columns for faster scans.
* Use multi-column indexes that fully satisfy queries.
* Precompute heavy aggregations using materialized views.

#### N+1 Query Problem & Solutions

* Use **JOINs** to fetch related tables in a single query.
* **Batch loading**: Collect all required IDs and retrieve related data using a single `IN` query.

---

## Section 7 - Security Considerations

### SQL Injection

* **Definition**: Attackers inject malicious SQL to manipulate the database.
* **Prevention**: Use prepared statements, parameterized queries, and input validation.

### Cross-Site Scripting (XSS)

* **Definition**: Attackers inject malicious scripts into web pages viewed by others.
* **Impact**: Can steal user data, hijack sessions, or perform actions on behalf of users.
* **Prevention**: Validate and sanitize input, escape dangerous characters like `<` and `>`.

### Cross-Site Request Forgery (CSRF)

* **Definition**: Tricks authenticated users into submitting unwanted requests.
* **Prevention**:

  * Use **anti-CSRF tokens** for each user session.
  * Set **SameSite cookie attribute** to `Strict` or `Lax` to control cross-site cookie sending.

### Rate Limiting & DDoS Protection

* **Rate Limiting**: Controls request frequency per user/IP to prevent abuse.
* **DDoS Protection**: Defends against distributed attacks by filtering excessive traffic from multiple sources.
* Rate limiting alone can be bypassed in DDoS attacks; modern solutions combine rate limiting with other traffic filtering mechanisms.

### Password Security Best Practices

* Use **complex passwords**: mix uppercase, lowercase, numbers, and special characters; longer passwords are stronger.
* Enable **MFA/2FA** to add an extra verification layer beyond passwords.
* These practices protect sensitive information and prevent unauthorized access even if passwords are compromised.

---

## Section 8 - System Design & Architecture

### Microservices Architecture

![Alt Text](./images/microservices.png "E-commerce Platform System Design & Architecture")

### Scalability Planning

### Scalability Strategy for 10,000 Concurrent Users

* **Load Balancing & Horizontal Scaling:** Use a **Load Balancer** (e.g., Nginx) to distribute incoming traffic across **multiple backend instances**. This **horizontal scaling** prevents any single server from becoming overwhelmed.
* **Concurrency:** Leverage **Asynchronous I/O** (native to Bun/Hono) to ensure requests are handled efficiently without blocking threads.
* **Database Management:** Implement **Connection Pooling** to avoid the performance overhead of constantly opening and closing database connections.

### Database Scaling Strategies (Indexing & Replication)

* **Read/Write Separation:** Use **Read Replicas** for high-volume `GET` requests, dedicating the **primary database** to write operations (`POST`, `PUT`, `DELETE`).
* **Indexing:** Add crucial **Indexes** (including composite indexes) on frequently filtered fields to drastically speed up query execution.
* **Data Partitioning:** Apply **Sharding** or partitioning to break up extremely large datasets into smaller, more manageable pieces across multiple databases.

### Load Balancing Considerations (Stateless Design)

* **Stateless Backend:** Design the API to be **stateless**. Session data (like authentication) should be stored externally, typically using **JWTs** or a distributed cache like **Redis**, enabling any server instance to handle any subsequent request.
* **Resilience:** The Load Balancer must use **Health Checks** to automatically detect and isolate unhealthy backend instances, rerouting traffic instantly.

### Monitoring & Logging (APM & Metrics)

* **Key Metrics:** Focus on tracking **Requests Per Second (RPS)**, **Latency** (especially p95/p99), and **Error Rates**.
* **Logging & Alerts:** Use **Structured Logging** (JSON format) for easy data aggregation and set up proactive **Alerts** for any spikes in latency or errors.

---

## Database Timeout Incident Response

### Investigation
- Check application & database logs for errors and slow queries.
- Identify patterns: affected endpoints, users, payloads, or times.
- Inspect DB connections and long-running queries.
- Review recent deployments for heavy queries or transactions.

### Immediate Actions
- Temporarily increase DB connection pool.
- Cancel long-running queries.
- Enable caching for heavy read endpoints.
- Return graceful errors instead of crashing.

### Preventive Measures
- Optimize queries: add indexes, avoid `SELECT *`, use pagination.
- Proper connection pooling and retries/backoff.
- Use caching (Redis or in-memory).
- Scale DB horizontally if needed (replicas, partitioning).
- Load test before deployments.

### Monitoring & Alerts
- **App metrics:** Requests per second, response times, 5xx error rate.
- **DB metrics:** active connections, query times, slow queries, deadlocks.
- **Alerts:** high 5xx errors, high DB usage, slow queries.