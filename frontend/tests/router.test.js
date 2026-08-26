/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */

import { describe, it, expect, beforeEach } from "vitest";
import router from "../src/router.js";
import Utils from "../src/config/utils.js";

describe("Feature 1 — Router guards", () => {
  beforeEach(async () => {
    localStorage.clear();
    await router.push("/login");
    await router.isReady();
  });

  describe("US-1.5 — Block unauthenticated access", () => {
    it("Unauthenticated user accesses a protected route", async () => {
      await router.push("/");
      await router.isReady();

      expect(router.currentRoute.value.name).toBe("login");
    });
  });

  describe("US-1.3 — Stay signed in across page loads", () => {
    it("Signed-in user visits login page", async () => {
      Utils.setStore("user", {
        userId: 1,
        token: "test-token",
        fName: "Jane",
        username: "jdoe",
      });

      await router.push("/register");
      await router.isReady();

      expect(router.currentRoute.value.name).toBe("home");
    });
  });
});
