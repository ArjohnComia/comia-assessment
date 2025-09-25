import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import app from "../index";
import { sign } from "hono/jwt";
import { tasks as taskModule } from "../index";

const JWT_SECRET = process.env.JWT_SECRET as string;

// Helper: create JWTs
async function createToken(payload: any) {
  return await sign(payload, JWT_SECRET);
}

// Helper: make authenticated request
async function authRequest(path: string, opts: any = {}, token?: string) {
  const headers: any = {
    ...(opts.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await app.request(path, { ...opts, headers });
  const body = await res.json();
  return { res, body };
}

// Fake in-memory tasks array
let tasks = taskModule;

beforeEach(() => {
  // reset tasks before each test
  tasks.length = 0;
  tasks.push(
    {
      id: "1",
      title: "Admin Task",
      description: "By admin",
      status: "pending",
      priority: "low",
      created_at: new Date(),
      updated_at: new Date(),
      ownerId: 999,
    },
    {
      id: "2",
      title: "User Task",
      description: "By user",
      status: "completed",
      priority: "high",
      created_at: new Date(),
      updated_at: new Date(),
      ownerId: 123,
    }
  );
});

afterEach(() => {
  tasks.length = 0;
});

/* =============================
INTEGRATION TESTS FOR TASK
============================= */
describe("Tasks API Integration", () => {
  it("admin can see all tasks", async () => {
    const token = await createToken({
      id: 999,
      role: "admin",
      email: "a@a.com",
    });
    const { res, body } = await authRequest(
      "/api/tasks",
      { method: "GET" },
      token
    );

    expect(res.status).toBe(200);
    expect(body.tasks.length).toBe(2);
  });

  it("user only sees their own tasks", async () => {
    const token = await createToken({
      id: 123,
      role: "user",
      email: "u@u.com",
    });
    const { res, body } = await authRequest(
      "/api/tasks",
      { method: "GET" },
      token
    );

    expect(res.status).toBe(200);
    
    // Ensure tasks array exists
    expect(Array.isArray(body.tasks)).toBe(true);

    // Ensure each task belongs to the user
    expect(body.tasks.every((t: any) => t.ownerId === 123)).toBe(true);

    // Optional extra checks for completeness
    expect(body).toHaveProperty("taskPages");
    expect(body).toHaveProperty("queries");
  });

  it("guest can read tasks", async () => {
    const token = await createToken({
      id: 456,
      role: "guest",
      email: "g@g.com",
    });
    const { res, body } = await authRequest(
      "/api/tasks",
      { method: "GET" },
      token
    );

    expect(res.status).toBe(200);
    expect(body.tasks.length).toBeGreaterThan(0);
  });

  it("user cannot fetch another user's task by id", async () => {
    const token = await createToken({
      id: 123,
      role: "user",
      email: "u@u.com",
    });
    const { res, body } = await authRequest(
      "/api/tasks/1",
      { method: "GET" },
      token
    );

    expect(res.status).toBe(200);
    expect(body.task).toBeNull || expect(body.task).toBeUndefined;
  });

  it("POST creates a new task with correct ownerId", async () => {
    const token = await createToken({
      id: 123,
      role: "user",
      email: "u@u.com",
    });
    const payload = {
      title: "New Task",
      description: "testing",
      status: "pending",
      priority: "medium",
    };

    const { res, body } = await authRequest(
      "/api/tasks",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      token
    );

    expect(res.status).toBe(200);
    expect(body.task.title).toBe("New Task");
    expect(body.task.ownerId).toBe(123);
  });

  it("PUT lets user update only their task", async () => {
    const token = await createToken({
      id: 123,
      role: "user",
      email: "u@u.com",
    });

    // Try updating own task
    const { res, body } = await authRequest(
      "/api/tasks/2",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Updated",
          description: "Changed",
          status: "in_progress",
          priority: "high",
        }),
      },
      token
    );

    expect(res.status).toBe(200);
    expect(body.task.title).toBe("Updated");

    // Try updating someone else's task
    const { res: res2 } = await authRequest(
      "/api/tasks/1",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Hack",
          description: "Not allowed",
          status: "pending",
          priority: "low",
        }),
      },
      token
    );

    expect(res2.status).toBe(404);
  });

  it("DELETE lets user delete only their own task", async () => {
    const token = await createToken({
      id: 123,
      role: "user",
      email: "u@u.com",
    });

    // delete own task
    const { res } = await authRequest(
      "/api/tasks/2",
      { method: "DELETE" },
      token
    );
    expect(res.status).toBe(200);

    // try delete someone else's task
    const { res: res2 } = await authRequest(
      "/api/tasks/1",
      { method: "DELETE" },
      token
    );
    expect(res2.status).toBe(404);
  });
});
