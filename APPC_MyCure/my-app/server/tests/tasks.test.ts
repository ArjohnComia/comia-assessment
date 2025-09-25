import { describe, it, expect } from "bun:test";
import { TaskSchema } from "../middleware";

/* =============================
UNIT TESTS FOR TASK
============================= */
describe("Task Validation", () => {
  it("should accept valid task without due date", () => {
    const result = TaskSchema.safeParse({
      title: "Test Task",
      description: "Testing validation",
      status: "pending",
      priority: "medium",
      created_at: new Date(),
      updated_at: new Date(),
    });

    expect(result.success).toBe(true);
  });

  it("should accept valid task with due date", () => {
    const result = TaskSchema.safeParse({
      title: "Test Task",
      description: "Testing validation",
      status: "pending",
      priority: "medium",
      created_at: new Date(),
      updated_at: new Date(),
      due_date: new Date(2025 - 9 - 23),
    });

    expect(result.success).toBe(true);
  });

  it("should reject task with invalid status", () => {
    const result = TaskSchema.safeParse({
      title: "Invalid Task",
      description: "Testing",
      status: "not_a_status",
      priority: "medium",
      created_at: new Date(),
      updated_at: new Date(),
    });

    expect(result.success).toBe(false);
  });

  it("should reject task with invalid priority", () => {
    const result = TaskSchema.safeParse({
      title: "Invalid Task",
      description: "Testing",
      status: "pending",
      priority: "not_a_priority",
      created_at: new Date(),
      updated_at: new Date(),
    });

    expect(result.success).toBe(false);
  });

  it("should reject task with invalid title", () => {
    const result = TaskSchema.safeParse({
      title: "",
      description: "Testing",
      status: "pending",
      priority: "not_a_priority",
      created_at: new Date(),
      updated_at: new Date(),
    });

    expect(result.success).toBe(false);
  });

  it("should reject task with invalid description", () => {
    const result = TaskSchema.safeParse({
      title: "Invalid Task",
      description: "",
      status: "pending",
      priority: "not_a_priority",
      created_at: new Date(),
      updated_at: new Date(),
    });

    expect(result.success).toBe(false);
  });
});
