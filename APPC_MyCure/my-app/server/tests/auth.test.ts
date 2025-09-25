import { describe, it, expect, beforeAll } from "bun:test";
import * as bcrypt from "bcryptjs";

/* =============================
UNIT TESTS FOR AUTHENTICATION
============================= */
describe("Authentication", () => {
  const password = "mypassword123";
  const testUser = {
    email: "test@example.com",
    password: "password123",
  };

  const users = [testUser]

  beforeAll( async () => {
    const hash = await bcrypt.hash(testUser.password, 10);
    testUser.password = hash;
  });
  
  it("should validate correct email", async () => {
    const user = users.find((u: any) => u.email === testUser.email);
    
    expect(user).not.toBeUndefined();
  });

  it("should validate incorrect email", async () => {
    const incorrectEmail = "te@example.com"
    const user = users.find((u: any) => u.email === incorrectEmail);
    
    expect(user).toBeUndefined();
  });

  it("should validate correct password", async () => {
    const hash = await bcrypt.hash(password, 10);
    const valid = await bcrypt.compare(password, hash);
    expect(valid).toBe(true);
  });

  it("should reject incorrect password", async () => {
    const hash = await bcrypt.hash(password, 10);
    const valid = await bcrypt.compare("wrongpassword", hash);
    expect(valid).toBe(false);
  });
});