import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import app from "../index"; // adjust path
import * as bcrypt from "bcryptjs";
import { sign } from "jsonwebtoken";
import { UserProfile as userModule } from "../index";

const JWT_SECRET = process.env.JWT_SECRET as string;

// In-memory users 
let users : userModule[] = [];

// Helper: authenticated request
async function authRequest(path: string, opts: any = {}, token?: string) {
  const headers: any = {
    ...(opts.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await app.request(path, { ...opts, headers });
  const body = await res.json();
  return { res, body };
}

beforeEach(() => {
  // Reset users
  users.length = 0;
});

/* =============================
INTEGRATION TESTS FOR AUTHENTICATION
============================= */
describe("Auth API Integration", () => {
  describe("POST /api/auth/register", () => {

    it("registers a new user", async () => {
      const payload = {
        email: "alice@example.com",
        password: "secret123",
        role: "user",
      };

      const { res, body } = await authRequest("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(200);
      expect(body).toEqual({ message: "success" });
    });

    it("rejects duplicate email", async () => {
      users.push({
        id: 1,
        email: "alice@example.com",
        password: "hasheddd",
        role: "user",
      });

      const payload = {
        name: "Bob",
        email: "alice@example.com",
        password: "password",
        role: "user",
      };

      const { res, body } = await authRequest("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(400);
      expect(body.error).toBe("User already exists");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      const hashed = await bcrypt.hash("secret123", 10);
      users.push({
        id: 1,
        email: "alice@example.com",
        password: hashed,
        role: "user",
      });
    });

    it("logs in successfully with correct credentials", async () => {
      const payload = { email: "alice@example.com", password: "secret123" };
      const { res, body } = await authRequest("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(200);
      expect(body.token).toBeDefined();
      expect(body.refreshToken).toBeDefined();
    });

    it("rejects invalid password", async () => {
      const payload = { email: "alice@example.com", password: "wrong" };
      const { res, body } = await authRequest("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(401);
      expect(body.error).toBe("Invalid credentials");
    });

    it("rejects unknown email", async () => {
      const payload = { email: "bob@example.com", password: "secret123" };
      const { res, body } = await authRequest("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(401);
      expect(body.error).toBe("Invalid credentials");
    });
  });

  describe("POST /api/auth/refresh", async () => {
    const accessToken = await sign(
      { id: 1, email: "a@a.com", role: "user" },
      JWT_SECRET,
      { expiresIn: "15m" }
    );
    it("returns new access token with valid refresh token", async () => {
      const refreshToken = await sign(
        { id: 1, email: "a@a.com", role: "user" },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      const { res, body } = await authRequest("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify({ refreshToken }),
      }, accessToken);

      expect(res.status).toBe(200);
      expect(body.accessToken).toBeDefined();
    });

    it("rejects missing refresh token", async () => {
      const { res, body } = await authRequest("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify({}),
      }, accessToken);

      expect(res.status).toBe(401);
      expect(body.error).toBe("Missing refresh token");
    });

    it("rejects invalid refresh token", async () => {
      const { res, body } = await authRequest("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify({ refreshToken: "bad.token.here" }),
      }, accessToken);

      expect(res.status).toBe(401);
      expect(body.error).toBe("Invalid refresh token");
    });
  });

  describe("GET /api/auth/me", () => {
    it("returns user profile when authorized", async () => {
      const token = await sign(
        { id: 1, email: "alice@example.com", role: "user" },
        JWT_SECRET,
        { expiresIn: "15m" }
      );

      users.push({
        id: 1,
        email: "alice@example.com",
        password: "hashed",
        role: "user",
      });

      const { res, body } = await authRequest(
        "/api/auth/me",
        { method: "GET" },
        token
      );

      expect(res.status).toBe(200);
      expect(body.email).toBe("alice@example.com");
    });

    it("rejects unauthorized requests", async () => {
      const { res, body } = await authRequest("/api/auth/me", {
        method: "GET",
      });

      expect(res.status).toBe(401);
      expect(body.error).toBeDefined();
    });
  });
});
