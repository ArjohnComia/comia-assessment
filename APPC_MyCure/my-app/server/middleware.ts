// import { jwt } from "hono/jwt";
import { Context, Next } from "hono";
import { z } from "zod";
import { ZodSchema } from "zod";
import { rateLimiter } from "hono-rate-limiter";
import { MiddlewareHandler } from "hono";

/* =============================
MIDDLEWARE FOR REQUIRING ROLE
============================= */
export function requireRole(roles: string[]) {
  return async (c: Context, next: Next) => {
    const payload = c.get("jwtPayload") as any;
    if (!payload || !roles.includes(payload.role)) {
      return c.json({ error: "Forbidden: insufficient role" }, 403);
    }

    await next();
  };
}

/* =============================
MIDDLEWARE FOR RATE LIMITING
============================= */
const baseLimiter = rateLimiter({
  windowMs: 10 * 60 * 1000, // 1 minute
  limit: 100,
  keyGenerator: (c) =>
    c.req.header("x-forwarded-for") ||
    c.req.header("cf-connecting-ip") ||
    "anon",
});

export const limiter: MiddlewareHandler = async (c, next) => {
  const res = await baseLimiter(c, next);

  if (res && res.status === 429) {
    return c.json({ error: "Too many requests. Please slow down." }, 429);
  }

  return res;
};

/* =============================
MIDDLEWARE FOR REQUEST SIZE LIMITS
============================= */
const MAX_SIZE = 1 * 1024 * 1024; // 1 MB

export const bodyLimit: MiddlewareHandler = async (c, next) => {
  const contentLength = c.req.header("content-length");

  if (contentLength && parseInt(contentLength, 10) > MAX_SIZE) {
    return c.json({ error: "Payload too large" }, 413);
  }

  return next();
};

/* =============================
TASK SCHEMA
============================= */
export const TaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().min(1, "Description is required"),
  status: z.enum(["pending", "in_progress", "completed"]),
  priority: z.enum(["low", "medium", "high"]),
  due_date: z.coerce.date().optional(),
});

/* =============================
USER PROFILE SCHEMA
============================= */
export const UserProfileSchema = z.object({
  email: z.string().trim().email("Invalid email format"),
  password: z
    .string()
    .trim()
    .min(8, "Password must be at least 8 characters long"), // common rule
});

/* =============================
MIDDLEWARE FOR INPUT SANITIZATION
============================= */
export type TaskInput = z.infer<typeof TaskSchema>;
export type UserProfileInput = z.infer<typeof UserProfileSchema>;

export function validateInput(schema: ZodSchema) {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      c.set("validatedBody", schema.parse(body));
      await next();
    } catch (err: any) {
      err.name = "ValidationError";
      err.details = err.issues?.map((e: any) => ({
        field: e.path.join("."),
        message: e.message,
      }));
      throw err;
    }
  };
}
