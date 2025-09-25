import { Hono } from "hono";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";
import * as db from "./database";
import { jwt } from "hono/jwt";
import * as bcrypt from "bcryptjs";
import { sign, verify } from "jsonwebtoken";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import {
  requireRole,
  validateInput,
  TaskSchema,
  UserProfileSchema,
  limiter,
  bodyLimit,
} from "./middleware";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";

const JWT_SECRET = process.env.JWT_SECRET!;

const app = new Hono();

// simple in-memory cache
const memoryCache = new Map<string, { value: any; expiresAt: number }>();
const TTL = 60 * 1000; // 60s

/* =============================
MIDDLEWARES
============================= */
app.use(logger());

app.use(secureHeaders());

// CORS Configuration
app.use(
  "*",
  cors({
    origin: (origin) => {
      const allowed = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://myfrontend.com",
      ];
      return allowed.includes(origin ?? "") ? origin : "";
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Request Size Limits
app.use("*", bodyLimit);

// Rate Limiting
app.use("*", limiter);

app.use("/api/auth/*", async (c, next) => {
  const path = c.req.path;

  // skip protection for login/register
  if (path === "/api/auth/register" || path === "/api/auth/login") {
    return next();
  }

  return jwt({ secret: JWT_SECRET })(c, next);
});

app.use("/api/tasks/*", jwt({ secret: JWT_SECRET }));
app.use("/api/library/*", jwt({ secret: JWT_SECRET }));

/* =============================
CENTRALIZED ERROR HANDLER
============================= */
app.onError((err: any, c) => {
  console.error("Error caught:", err);

  let status: ContentfulStatusCode = 500;
  let code = "INTERNAL_ERROR";
  let message = "An unexpected error occurred";
  let details = [];

  if (err.name === "ValidationError") {
    status = 400;
    code = "VALIDATION_ERROR";
    message = "Invalid input data";
    details = err.details || [];
  } else if (err.code === "23505") {
    // Example: Postgres unique violation
    status = 409;
    code = "DATABASE_ERROR";
    message = "Duplicate entry";
  } else if (err.status === 401) {
    status = 401;
    code = "UNAUTHORIZED";
    message = "No authorization included in request";
  }

  return c.json(
    {
      success: false,
      error: { code, message, details },
      timestamp: new Date().toISOString(),
    },
    status
  );
});

// Optional: handle unknown routes
app.notFound((c) =>
  c.json(
    {
      success: false,
      error: { code: "NOT_FOUND", message: "Route not found" },
      timestamp: new Date().toISOString(),
    },
    404
  )
);

/* =============================
DUMMY DATA DECLARATION
============================= */
type Task = {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  created_at: Date;
  updated_at: Date;
  due_date?: Date;
  ownerId: number;
};

export type UserProfile = {
  id: number;
  // name: string;
  email: string;
  password: string;
  role: "admin" | "user" | "guest";
};

export let tasks: Task[] = [];
export let users: UserProfile[] = [];

const statuses = ["pending", "in_progress", "completed"] as const;
const priorities = ["low", "medium", "high"] as const;

for (let index = 0; index < 30; index++) {
  const task: Task = {
    id: `${index + 1}`,
    title: `Task ${index + 1}`,
    description: `Test ${index + 1}`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    created_at: new Date(),
    updated_at: new Date(),
    ownerId: Math.floor(Math.random() * 3) + 1,
  };

  tasks.push(task);
}

const userTest1 = async () => {
  const password = await bcrypt.hash("password", 10);

  const userTest: UserProfile = {
    id: 1,
    // name: "Arc",
    email: "arc@admin",
    password: password,
    role: "admin",
  };
  users.push(userTest);
};

userTest1();

/* =============================
TASKS API
============================= */
app.get("/api/tasks", requireRole(["admin", "user", "guest"]), async (c) => {
  const {
    status,
    priority,
    sort,
    page = "1",
    limit = "10",
    search,
  } = await c.req.query();

  const payload = c.get("jwtPayload") as any; // contains { id, email, role }
  const role = payload.role;
  const userId = payload.id;

  const cacheKey = [
    "tasks",
    status || "none",
    priority || "none",
    sort || "none",
    page,
    limit,
    search || "none",
    role,
    userId || "none",
  ].join(":");

  // 1. Check cache
  const cached = memoryCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return c.json({ ...cached.value });
  }

  const limitNum = Number(limit);

  let filtered = [...tasks];

  if (role === "user") {
    filtered = filtered.filter((t) => t.ownerId === Number(userId));
  }

  if (status) {
    filtered = filtered.filter((t) => t.status === status);
  }
  if (priority) {
    filtered = filtered.filter((t) => t.priority === priority);
  }
  if (search) {
    filtered = filtered.filter(
      (t) =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (sort === "date_created") {
    filtered = filtered.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  } else if (sort === "due_date") {
    filtered = filtered.sort((a, b) => {
      if (!a.due_date && !b.due_date) return 0; // both missing
      if (!a.due_date) return 1; // a missing -> put last
      if (!b.due_date) return -1; // b missing -> put last
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  }

  const taskPages = Math.ceil(filtered.length / limitNum);

  const start = (Number(page) - 1) * limitNum;
  const end = start + limitNum;

  const paginated = filtered.slice(start, end);

  const response = {
    tasks: paginated,
    taskPages: taskPages,
    queries: [status, priority, sort, page, limit, search],
  };

  // 3. Save to cache with TTL
  memoryCache.set(cacheKey, {
    value: response,
    expiresAt: Date.now() + TTL,
  });

  return c.json(response, 200);
});

app.get(
  "/api/tasks/:id",
  requireRole(["admin", "user", "guest"]),
  async (c) => {
    const id: string = await c.req.param("id");
    const payload = c.get("jwtPayload") as any;
    const role = payload.role;
    const userId = payload.id;

    let specificTask = tasks.find((task) => task.id === id);
    if (role === "user") {
      specificTask = tasks.find((t) => t.ownerId === userId && t.id === id);
    }

    return c.json({ id: id, task: specificTask });
  }
);

app.post(
  "/api/tasks",
  requireRole(["admin", "user"]),
  validateInput(TaskSchema),
  async (c) => {
    const body: any = await c.req.json();
    const id: string = (tasks.length + 1).toString();
    const payload = c.get("jwtPayload") as any;
    const userId = payload.id;

    const newTask: Task = {
      id: id,
      title: body.title,
      description: body.description,
      status: body.status,
      priority: body.priority,
      created_at: new Date(),
      updated_at: new Date(),
      ownerId: userId,
      ...(body.due_date !== "" && { due_date: new Date(body.due_date) }),
    };

    tasks.push(newTask);

    memoryCache.clear();

    return c.json({ task: newTask }, 200);
  }
);

app.put(
  "/api/tasks/:id",
  requireRole(["admin", "user"]),
  validateInput(TaskSchema),
  async (c) => {
    const id: string = (await c.req.param("id")) as string;
    const body: any = await c.req.json();
    const payload = c.get("jwtPayload") as any;
    const role = payload.role;
    const userId = payload.id;
    let specificTask;
    if (role === "user") {
      specificTask = tasks.find((t) => t.ownerId === userId && t.id === id);
    } else if (role === "admin") {
      specificTask = tasks.find((t) => t.id === id);
    }

    if (!specificTask) {
      return c.json({ message: "Not found" }, 404);
    }

    tasks = tasks.map((t) =>
      t.id === id
        ? {
            ...t,
            title: body.title,
            description: body.description,
            status: body.status,
            priority: body.priority,
            updated_at: new Date(),
            ...(body.due_date !== ""
              ? { due_date: new Date(body.due_date) }
              : { due_date: undefined }),
          }
        : t
    );

    const updatedTask = tasks.find((t) => t.id === id);

    memoryCache.clear();

    return c.json({ task: updatedTask }, 200);
  }
);

app.delete("/api/tasks/:id", requireRole(["admin", "user"]), async (c) => {
  const id: string = await c.req.param("id");
  const payload = c.get("jwtPayload") as any;
  const role = payload.role;
  const userId = payload.id;

  if (role === "user") {
    const specificTask = tasks.find((t) => t.ownerId === userId && t.id === id);

    if (!specificTask) return c.json({ message: "task not found" }, 404);
  } else if (role === "admin") {
    const specificTask = tasks.find((t) => t.id === id);

    if (!specificTask) return c.json({ message: "task not found" }, 404);
  }

  const deleteTask = tasks.filter((task) => task.id === id);

  tasks = tasks.filter((task) => task.id !== id);

  memoryCache.clear();

  return c.json({ message: "success" }, 200);
});

/* =============================
LIBRARY DATABASE API
============================= */
app.post("/api/library/borrow", async (c) => {
  const { userId, bookId, dueDate } = await c.req.json();
  const result = await db.borrowBook(userId, bookId, dueDate);
  return result.success ? c.json(result, 200) : c.json(result, 400);
});

app.post("/api/library/return", async (c) => {
  const { borrowingId } = await c.req.json();
  const result = await db.returnBook(borrowingId);
  return result.success ? c.json(result, 200) : c.json(result, 400);
});

app.get(
  "/api/library/overdue-books",
  requireRole(["admin", "user", "guest"]),
  async (c) => {
    // const payload = c.get("jwtPayload") as any; // 👈 contains { id, email, role }
    // const role = payload.role;

    try {
      const result = await db.getOverdueBooks();
      return c.json({ success: true, data: result }, 200);
    } catch (err) {
      console.error(err);
      return c.json(
        { success: false, error: "Failed to fetch overdue books" },
        500
      );
    }
  }
);

app.get(
  "/api/library/popular-books",
  requireRole(["admin", "user", "guest"]),
  async (c) => {
    try {
      const limit = Number(c.req.query("limit") ?? 5);
      const result = await db.getPopularBooks(limit);
      return c.json({ success: true, data: result }, 200);
    } catch (err) {
      console.error(err);
      return c.json(
        { success: false, error: "Failed to fetch popular books" },
        500
      );
    }
  }
);

app.get(
  "/api/library/user-statistics",
  requireRole(["admin", "user", "guest"]),
  async (c) => {
    try {
      const result = await db.getUserStatistics();
      return c.json({ success: true, data: result }, 200);
    } catch (err) {
      console.error(err);
      return c.json(
        { success: false, error: "Failed to fetch user statistics" },
        500
      );
    }
  }
);

app.get(
  "/api/library/revenue",
  requireRole(["admin", "user", "guest"]),
  async (c) => {
    try {
      const result = await db.getRevenueReport();
      return c.json({ success: true, data: result }, 200);
    } catch (err) {
      console.error(err);
      return c.json(
        { success: false, error: "Failed to fetch revenue report" },
        500
      );
    }
  }
);

/* =============================
JWT AUTH API
============================= */
app.post("/api/auth/register", validateInput(UserProfileSchema), async (c) => {
  const { email, password } = await c.req.json<UserProfile>();
  const id: number = users.length + 1;

  // Check if user exists
  const exists = users.find((u: any) => u.email === email);
  if (exists) return c.json({ error: "User already exists" }, 400);

  const hashed = await bcrypt.hash(password, 10);
  const newUser: UserProfile = { id, email, password: hashed, role: "user" };
  users.push(newUser);

  return c.json({ message: "success" }, 200);
});

app.post("/api/auth/login", async (c) => {
  const { email, password } = await c.req.json();

  const user = users.find((u: any) => u.email === email);
  if (!user) return c.json({ error: "Invalid credentials" }, 401);

  const match = await bcrypt.compare(password, user.password);
  if (!match) return c.json({ error: "Invalid credentials" }, 401);

  const accessToken = sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    {
      expiresIn: "15m",
    }
  );
  const refreshToken = sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  return c.json({ token: accessToken, refreshToken: refreshToken }, 200);
});

app.post("/api/auth/refresh", async (c) => {
  const { refreshToken } = await c.req.json();
  if (!refreshToken) return c.json({ error: "Missing refresh token" }, 401);

  try {
    const payload = verify(refreshToken, JWT_SECRET);
    const accessToken = sign(
      {
        id: (payload as any).id,
        email: (payload as any).email,
        role: (payload as any).role,
      },
      JWT_SECRET,
      {
        expiresIn: "15m",
      }
    );
    return c.json({ accessToken });
  } catch (err) {
    return c.json({ error: "Invalid refresh token" }, 401);
  }
});

app.get("/api/auth/me", async (c) => {
  const payload = c.get("jwtPayload");
  const user = users.find((u: any) => u.email === (payload as any).email);
  if (!user) return c.json({ error: "User not found" }, 404);

  return c.json({ id: user.id, email: user.email, role: user.role });
});

// Static frontend
app.use("/*", serveStatic({ root: "./client/dist" }));

// Fallback to index.html for React Router
app.use("/*", serveStatic({ path: "./client/dist/index.html" }));

export default app;
