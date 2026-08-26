/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Register from "../src/views/Register.vue";
import authServices from "../src/services/authServices.js";
import { mountWithPlugins, createTestRouter } from "./testUtils.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    loginUser: vi.fn(),
    registerUser: vi.fn(),
    logoutUser: vi.fn(),
  },
}));

async function getForm(wrapper) {
  return wrapper.findComponent({ name: "VForm" });
}

async function getTextFields(wrapper) {
  return wrapper.findAllComponents({ name: "VTextField" });
}

async function fillValidRegisterForm(wrapper, overrides = {}) {
  const values = {
    fName: "Jane",
    lName: "Doe",
    email: "jane@example.com",
    username: "jdoe",
    password: "password123",
    confirmPassword: "password123",
    ...overrides,
  };

  const fields = await getTextFields(wrapper);
  await fields[0].setValue(values.fName);
  await fields[1].setValue(values.lName);
  await fields[2].setValue(values.email);
  await fields[3].setValue(values.username);
  await fields[4].setValue(values.password);
  await fields[5].setValue(values.confirmPassword);
}

async function submitRegisterForm(wrapper) {
  await wrapper.find('button[type="submit"]').trigger("click");
  await flushPromises();
}

describe("Feature 1 — Register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("US-1.1 — Registration", () => {
    it("User submits registration with invalid email format", async () => {
      const { wrapper } = await mountWithPlugins(Register, {
        router: await createTestRouter("/register"),
      });
      const form = await getForm(wrapper);

      await fillValidRegisterForm(wrapper, { email: "notanemail" });
      await submitRegisterForm(wrapper);
      const validation = await form.vm.validate();

      expect(validation.valid).toBe(false);
      expect(authServices.registerUser).not.toHaveBeenCalled();
    });

    it("User submits registration with missing email", async () => {
      const { wrapper } = await mountWithPlugins(Register, {
        router: await createTestRouter("/register"),
      });
      const form = await getForm(wrapper);

      await fillValidRegisterForm(wrapper, { email: "" });
      await submitRegisterForm(wrapper);
      const validation = await form.vm.validate();

      expect(validation.valid).toBe(false);
      expect(authServices.registerUser).not.toHaveBeenCalled();
    });

    it("User submits registration with missing username", async () => {
      const { wrapper } = await mountWithPlugins(Register, {
        router: await createTestRouter("/register"),
      });
      const form = await getForm(wrapper);

      await fillValidRegisterForm(wrapper, { username: "" });
      await submitRegisterForm(wrapper);
      const validation = await form.vm.validate();

      expect(validation.valid).toBe(false);
      expect(authServices.registerUser).not.toHaveBeenCalled();
    });

    it("User submits registration with password too short", async () => {
      const { wrapper } = await mountWithPlugins(Register, {
        router: await createTestRouter("/register"),
      });
      const form = await getForm(wrapper);

      await fillValidRegisterForm(wrapper, {
        password: "short",
        confirmPassword: "short",
      });
      await submitRegisterForm(wrapper);
      const validation = await form.vm.validate();

      expect(validation.valid).toBe(false);
      expect(authServices.registerUser).not.toHaveBeenCalled();
    });

    it("User submits registration with mismatched passwords", async () => {
      const { wrapper } = await mountWithPlugins(Register, {
        router: await createTestRouter("/register"),
      });
      const form = await getForm(wrapper);

      await fillValidRegisterForm(wrapper, { confirmPassword: "differentpassword" });
      await submitRegisterForm(wrapper);
      const validation = await form.vm.validate();

      expect(validation.valid).toBe(false);
      expect(authServices.registerUser).not.toHaveBeenCalled();
    });
  });
});
