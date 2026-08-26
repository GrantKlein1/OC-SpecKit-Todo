/**
 * Feature 4 — User Profile Management
 * Spec: features/feature-4-user-profile-management.md
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { h, nextTick } from "vue";
import { VApp } from "vuetify/components";
import MenuBar from "../src/components/MenuBar.vue";
import Utils from "../src/config/utils.js";
import authServices from "../src/services/authServices.js";
import userServices from "../src/services/userServices.js";
import { vuetify, createTestRouter } from "./testUtils.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    loginUser: vi.fn(),
    registerUser: vi.fn(),
    logoutUser: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../src/services/userServices.js", () => ({
  default: {
    getUser: vi.fn(),
    updateUser: vi.fn(),
  },
}));

const storedUser = {
  userId: 1,
  fName: "Jane",
  lName: "Doe",
  username: "jdoe",
  email: "jane@example.com",
  token: "test-token",
};

async function mountMenuBar() {
  const router = await createTestRouter("/");

  const wrapper = mount(
    {
      components: { VApp, MenuBar },
      render: () => h(VApp, null, { default: () => h(MenuBar) }),
    },
    {
      global: {
        plugins: [vuetify, router],
      },
    }
  );

  return wrapper;
}

function getMenuBar(wrapper) {
  return wrapper.findComponent(MenuBar);
}

function getEditDialogInputs() {
  return [...document.body.querySelectorAll(".v-dialog input")];
}

function setNativeInputValue(input, value) {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

async function openProfileMenu(wrapper) {
  await wrapper.get('[aria-label="Open profile menu"]').trigger("click");
  await flushPromises();
}

function findBodyButton(text) {
  return [...document.body.querySelectorAll("button")].find(
    (button) => button.textContent?.trim() === text
  );
}

function findBodyListItem(text) {
  return [...document.body.querySelectorAll(".v-list-item-title")].find(
    (item) => item.textContent?.trim() === text
  );
}

function clickLastBodyButton(text) {
  const buttons = [...document.body.querySelectorAll("button")].filter(
    (button) => button.textContent?.trim() === text
  );

  expect(buttons.length).toBeGreaterThan(0);
  buttons[buttons.length - 1].click();
}

async function openEditDialog(wrapper) {
  await openProfileMenu(wrapper);
  findBodyButton("Edit Profile").click();
  await flushPromises();
  await nextTick();
}

describe("Feature 4 — MenuBar profile", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    userServices.getUser.mockResolvedValue({
      data: {
        id: 1,
        fName: "Jane",
        lName: "Doe",
        username: "jdoe",
        email: "jane@example.com",
        role: "worker",
      },
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("US-4.1 — View profile from the menu bar", () => {
    it("User opens the profile dropdown from the menu bar", async () => {
      Utils.setStore("user", storedUser);

      const wrapper = await mountMenuBar();
      await openProfileMenu(wrapper);

      expect(document.body.textContent).toContain("Jane Doe");
      expect(document.body.textContent).toContain("jdoe");
      expect(document.body.textContent).toContain("jane@example.com");
      expect(document.body.textContent).toContain("Edit Profile");
      expect(document.body.textContent).toContain("Log out");
    });
  });

  describe("US-4.4 — Single logout entry point", () => {
    it("Menu bar does not show Sign out", async () => {
      Utils.setStore("user", storedUser);

      const wrapper = await mountMenuBar();

      expect(wrapper.text()).not.toContain("Sign out");
    });
  });

  describe("US-4.3 — Log out from profile", () => {
    it("User logs out from the profile dropdown", async () => {
      Utils.setStore("user", storedUser);

      const wrapper = await mountMenuBar();
      await openProfileMenu(wrapper);

      findBodyListItem("Log out").click();
      await flushPromises();

      expect(authServices.logoutUser).toHaveBeenCalled();
    });
  });
});

describe("Feature 4 — MenuBar edit profile dialog", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    Utils.setStore("user", storedUser);
    userServices.getUser.mockResolvedValue({
      data: {
        id: 1,
        fName: "Jane",
        lName: "Doe",
        username: "jdoe",
        email: "jane@example.com",
        role: "worker",
      },
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("US-4.2 — Edit profile", () => {
    it("User opens the edit profile dialog", async () => {
      const wrapper = await mountMenuBar();
      await openProfileMenu(wrapper);

      findBodyButton("Edit Profile").click();
      await flushPromises();

      expect(userServices.getUser).toHaveBeenCalledWith(1);
      expect(document.body.textContent).toContain("Edit Profile");
      expect(document.body.textContent).toContain("First name");
      expect(document.body.textContent).toContain("Username");
    });

    it("User cancels the edit profile dialog", async () => {
      const wrapper = await mountMenuBar();
      await openEditDialog(wrapper);

      const menuBar = getMenuBar(wrapper);
      menuBar.vm.fName = "Changed";
      menuBar.vm.closeEditDialog();
      await flushPromises();

      expect(userServices.updateUser).not.toHaveBeenCalled();
      expect(Utils.getStore("user").fName).toBe("Jane");
    });

    it("User saves profile changes", async () => {
      userServices.updateUser.mockResolvedValue({
        data: {
          id: 1,
          fName: "Janet",
          lName: "Smith",
          username: "jdoe",
          email: "jane@example.com",
          role: "worker",
        },
      });

      const wrapper = await mountMenuBar();
      await openEditDialog(wrapper);

      const inputs = getEditDialogInputs();
      setNativeInputValue(inputs[0], "Janet");
      setNativeInputValue(inputs[1], "Smith");
      await nextTick();
      clickLastBodyButton("Save");
      await flushPromises();

      expect(userServices.updateUser).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          fName: "Janet",
          lName: "Smith",
        })
      );
      expect(Utils.getStore("user")).toMatchObject({
        fName: "Janet",
        lName: "Smith",
      });

      await openProfileMenu(wrapper);

      expect(document.body.textContent).toContain("Janet Smith");
      expect(document.body.textContent).toContain("jdoe");
      expect(document.body.textContent).toContain("jane@example.com");
    });

    it("User saves profile with invalid email format", async () => {
      const wrapper = await mountMenuBar();
      await openEditDialog(wrapper);

      const inputs = getEditDialogInputs();
      setNativeInputValue(inputs[2], "notanemail");
      await nextTick();
      clickLastBodyButton("Save");
      await flushPromises();

      expect(userServices.updateUser).not.toHaveBeenCalled();
      expect(document.body.textContent).toContain("Enter a valid email address.");
    });

    it("User saves profile with mismatched passwords", async () => {
      const wrapper = await mountMenuBar();
      await openEditDialog(wrapper);

      const inputs = getEditDialogInputs();
      setNativeInputValue(inputs[4], "password123");
      setNativeInputValue(inputs[5], "differentpassword");
      await nextTick();
      clickLastBodyButton("Save");
      await flushPromises();

      expect(userServices.updateUser).not.toHaveBeenCalled();
      expect(document.body.textContent).toContain("Passwords do not match.");
    });

    it("User saves profile with a password that is too short", async () => {
      const wrapper = await mountMenuBar();
      await openEditDialog(wrapper);

      const inputs = getEditDialogInputs();
      setNativeInputValue(inputs[4], "short");
      setNativeInputValue(inputs[5], "short");
      await nextTick();
      clickLastBodyButton("Save");
      await flushPromises();

      expect(document.body.textContent).toContain("Password must be at least 8 characters.");
      expect(userServices.updateUser).not.toHaveBeenCalled();
    });

    it("Profile update API returns an error", async () => {
      userServices.updateUser.mockRejectedValue({
        response: { data: { message: "Password must be at least 8 characters." } },
      });

      const wrapper = await mountMenuBar();
      await openEditDialog(wrapper);

      clickLastBodyButton("Save");
      await flushPromises();

      expect(userServices.updateUser).toHaveBeenCalled();
      expect(document.body.textContent).toContain("Password must be at least 8 characters.");
    });
  });
});
