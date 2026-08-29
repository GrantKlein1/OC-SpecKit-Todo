/**
 * Feature 4 — User Profile Management
 * Spec: features/feature-4-user-profile-management.md
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { DOMWrapper, flushPromises } from "@vue/test-utils";
import { defineComponent } from "vue";
import MenuBar from "../src/components/MenuBar.vue";
import authServices from "../src/services/authServices.js";
import userServices from "../src/services/userServices.js";
import Utils from "../src/config/utils.js";
import { mountWithPlugins, createTestRouter } from "./testUtils.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    loginUser: vi.fn(),
    registerUser: vi.fn(),
    logoutUser: vi.fn(),
  },
}));

vi.mock("../src/services/userServices.js", () => ({
  default: {
    getUser: vi.fn(),
    updateUser: vi.fn(),
  },
}));

const sessionUser = {
  userId: 42,
  username: "jdoe",
  email: "jane@example.com",
  fName: "Jane",
  lName: "Doe",
  role: "worker",
  token: "test-token",
};

const profile = {
  id: 42,
  fName: "Jane",
  lName: "Doe",
  email: "jane@example.com",
  username: "jdoe",
  role: "worker",
  createdAt: "2026-07-02T12:00:00.000Z",
  updatedAt: "2026-07-02T12:00:00.000Z",
};

function normalizeText(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

function findButtonByText(wrapper, text) {
  const fromWrapper = wrapper.findAll("button").find((button) => button.text().includes(text));
  if (fromWrapper) {
    return fromWrapper;
  }

  const el = [...document.body.querySelectorAll("button")].find((button) =>
    normalizeText(button.textContent).includes(text)
  );

  return el ? new DOMWrapper(el) : undefined;
}

function findClickableByText(text) {
  const el = [...document.body.querySelectorAll("button, .v-list-item")].find((node) =>
    normalizeText(node.textContent).includes(text)
  );

  return el ? new DOMWrapper(el) : undefined;
}

const MenuBarHost = defineComponent({
  components: { MenuBar },
  template: "<v-app><MenuBar /></v-app>",
});

async function mountMenuBar(router) {
  const result = await mountWithPlugins(MenuBarHost, {
    router,
    attachTo: document.getElementById("app"),
  });
  await flushPromises();
  return result;
}

async function openProfileMenu(wrapper) {
  await wrapper.find('[aria-label="Open profile"]').trigger("click");
  await flushPromises();
}

async function openEditDialog(wrapper) {
  await openProfileMenu(wrapper);
  await findButtonByText(wrapper, "Edit Profile").trigger("click");
  await flushPromises();
}

async function getTextFields(wrapper) {
  return wrapper.findAllComponents({ name: "VTextField" });
}

describe("Feature 4 — User Profile Management", () => {
  let wrapper;
  let router;

  beforeEach(async () => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="app"></div>';
    Utils.setStore("user", sessionUser);
    userServices.getUser.mockResolvedValue({ data: profile });
    userServices.updateUser.mockResolvedValue({ data: profile });
    router = await createTestRouter("/");
  });

  afterEach(() => {
    wrapper?.unmount();
    document.body.innerHTML = "";
    localStorage.clear();
  });

  describe("US-4.1 — View profile from the menu bar", () => {
    it("User opens the profile dropdown from the menu bar", async () => {
      ({ wrapper } = await mountMenuBar(router));

      await openProfileMenu(wrapper);

      const text = normalizeText(document.body.textContent);
      expect(text).toContain("Jane Doe");
      expect(text).toContain("jdoe");
      expect(text).toContain("jane@example.com");
      expect(text).toContain("Edit Profile");
      expect(text).toContain("Log out");

      const profileItem = wrapper
        .findAllComponents({ name: "VListItem" })
        .find((item) => item.props("title") === "Jane Doe");
      expect(profileItem.props("lines")).toBe("two");
    });
  });

  describe("US-4.2 — Edit profile", () => {
    it("User opens the edit profile dialog", async () => {
      ({ wrapper } = await mountMenuBar(router));

      await openEditDialog(wrapper);

      const dialog = wrapper.findComponent({ name: "VDialog" });
      expect(dialog.props("modelValue")).toBe(true);
      expect(normalizeText(document.body.textContent)).toContain("Edit Profile");

      const fields = await getTextFields(wrapper);
      expect(fields[0].props("modelValue")).toBe("Jane");
      expect(fields[1].props("modelValue")).toBe("Doe");
      expect(fields[2].props("modelValue")).toBe("jane@example.com");
      expect(fields[3].props("modelValue")).toBe("jdoe");
    });

    it("User cancels the edit profile dialog", async () => {
      ({ wrapper } = await mountMenuBar(router));

      await openEditDialog(wrapper);

      const fields = await getTextFields(wrapper);
      await fields[0].vm.$emit("update:modelValue", "Changed");
      await flushPromises();

      await findButtonByText(wrapper, "Cancel").trigger("click");
      await flushPromises();

      const dialog = wrapper.findComponent({ name: "VDialog" });
      expect(dialog.props("modelValue")).toBe(false);
      expect(userServices.updateUser).not.toHaveBeenCalled();
      expect(Utils.getStore("user")).toEqual(sessionUser);
    });

    it("User saves profile changes", async () => {
      const updated = {
        id: 42,
        fName: "Janet",
        lName: "Smith",
        email: "janet@example.com",
        username: "jsmith",
        role: "worker",
      };
      userServices.updateUser.mockResolvedValue({ data: updated });

      ({ wrapper } = await mountMenuBar(router));
      await openEditDialog(wrapper);

      const fields = await getTextFields(wrapper);
      await fields[0].vm.$emit("update:modelValue", "Janet");
      await fields[1].vm.$emit("update:modelValue", "Smith");
      await fields[2].vm.$emit("update:modelValue", "janet@example.com");
      await fields[3].vm.$emit("update:modelValue", "jsmith");
      await flushPromises();

      await findButtonByText(wrapper, "Save").trigger("click");
      await flushPromises();

      expect(userServices.updateUser).toHaveBeenCalledWith(42, {
        fName: "Janet",
        lName: "Smith",
        email: "janet@example.com",
        username: "jsmith",
      });

      const dialog = wrapper.findComponent({ name: "VDialog" });
      expect(dialog.props("modelValue")).toBe(false);
      expect(Utils.getStore("user")).toMatchObject({
        userId: 42,
        fName: "Janet",
        lName: "Smith",
        email: "janet@example.com",
        username: "jsmith",
        token: "test-token",
      });

      await openProfileMenu(wrapper);
      const text = normalizeText(document.body.textContent);
      expect(text).toContain("Janet Smith");
      expect(text).toContain("jsmith");
      expect(text).toContain("janet@example.com");
    });

    it("User saves profile with invalid email format", async () => {
      ({ wrapper } = await mountMenuBar(router));
      await openEditDialog(wrapper);

      const fields = await getTextFields(wrapper);
      await fields[2].vm.$emit("update:modelValue", "notanemail");
      await flushPromises();

      await findButtonByText(wrapper, "Save").trigger("click");
      await flushPromises();
      const form = wrapper.findComponent({ name: "VForm" });
      const validation = await form.vm.validate();
      await flushPromises();

      expect(validation.valid).toBe(false);
      expect(document.body.textContent).toContain("Enter a valid email address.");
      expect(userServices.updateUser).not.toHaveBeenCalled();
    });

    it("User saves profile with mismatched passwords", async () => {
      ({ wrapper } = await mountMenuBar(router));
      await openEditDialog(wrapper);

      const fields = await getTextFields(wrapper);
      await fields[4].vm.$emit("update:modelValue", "password123");
      await fields[5].vm.$emit("update:modelValue", "differentpassword");
      await flushPromises();

      await findButtonByText(wrapper, "Save").trigger("click");
      await flushPromises();
      const form = wrapper.findComponent({ name: "VForm" });
      const validation = await form.vm.validate();
      await flushPromises();

      expect(validation.valid).toBe(false);
      expect(document.body.textContent).toContain("Passwords do not match.");
      expect(userServices.updateUser).not.toHaveBeenCalled();
    });

    it("User saves profile with a password that is too short", async () => {
      ({ wrapper } = await mountMenuBar(router));
      await openEditDialog(wrapper);

      const fields = await getTextFields(wrapper);
      await fields[4].vm.$emit("update:modelValue", "short");
      await fields[5].vm.$emit("update:modelValue", "short");
      await flushPromises();

      await findButtonByText(wrapper, "Save").trigger("click");
      await flushPromises();
      const form = wrapper.findComponent({ name: "VForm" });
      const validation = await form.vm.validate();
      await flushPromises();

      expect(validation.valid).toBe(false);
      expect(document.body.textContent).toContain("Password must be at least 8 characters.");
      expect(userServices.updateUser).not.toHaveBeenCalled();
    });

    it("Profile update API returns an error", async () => {
      userServices.updateUser.mockRejectedValue({
        response: { status: 400, data: { message: "Username is already taken." } },
      });

      ({ wrapper } = await mountMenuBar(router));
      await openEditDialog(wrapper);

      await findButtonByText(wrapper, "Save").trigger("click");
      await flushPromises();

      expect(document.body.textContent).toContain("Username is already taken.");
      const dialog = wrapper.findComponent({ name: "VDialog" });
      expect(dialog.props("modelValue")).toBe(true);
    });
  });

  describe("US-4.3 — Log out from profile", () => {
    it("User logs out from the profile dropdown", async () => {
      authServices.logoutUser.mockImplementation(async () => {
        Utils.removeItem("user");
        window.dispatchEvent(new CustomEvent("user-logged-out"));
        await router.push({ name: "login" });
      });

      ({ wrapper } = await mountMenuBar(router));
      await openProfileMenu(wrapper);

      await findClickableByText("Log out").trigger("click");
      await flushPromises();
      await authServices.logoutUser.mock.results[0]?.value;
      await flushPromises();

      expect(authServices.logoutUser).toHaveBeenCalled();
      expect(Utils.getStore("user")).toBeNull();
      expect(router.currentRoute.value.name).toBe("login");
    });
  });

  describe("US-4.4 — Single logout entry point", () => {
    it("Menu bar does not show Sign out", async () => {
      ({ wrapper } = await mountMenuBar(router));

      expect(normalizeText(wrapper.text())).not.toContain("Sign out");
      expect(normalizeText(document.body.textContent)).not.toContain("Sign out");
    });
  });
});
