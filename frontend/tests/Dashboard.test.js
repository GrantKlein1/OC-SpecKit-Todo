/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { DOMWrapper, flushPromises } from "@vue/test-utils";
import Dashboard from "../src/views/Dashboard.vue";
import listServices from "../src/services/listServices.js";
import router from "../src/router.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/listServices.js", () => ({
  default: {
    getLists: vi.fn(),
    createList: vi.fn(),
    updateList: vi.fn(),
    deleteList: vi.fn(),
  },
}));

const groceriesList = {
  id: 1,
  name: "Groceries",
  userId: 42,
  createdAt: "2026-07-02T12:00:00.000Z",
  updatedAt: "2026-07-02T12:00:00.000Z",
};

function findButtonByText(wrapper, text) {
  const fromWrapper = wrapper.findAll("button").find((button) => button.text().includes(text));
  if (fromWrapper) {
    return fromWrapper;
  }

  const el = [...document.body.querySelectorAll("button")].find((button) =>
    button.textContent.replace(/\s+/g, " ").includes(text)
  );

  return el ? new DOMWrapper(el) : undefined;
}

function findButtonsByLabel(wrapper, label) {
  return wrapper.findAll(`[aria-label="${label}"]`);
}

async function mountDashboard() {
  const result = await mountWithPlugins(Dashboard, {
    attachTo: document.getElementById("app"),
  });
  await flushPromises();
  return result;
}

describe("Feature 2 — Dashboard lists view", () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="app"></div>';
    listServices.getLists.mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    wrapper?.unmount();
    document.body.innerHTML = "";
  });

  describe("US-2.1 — Create todo lists", () => {
    it("User creates a new list", async () => {
      listServices.createList.mockResolvedValue({ data: groceriesList });

      ({ wrapper } = await mountDashboard());

      await findButtonByText(wrapper, "+ New List").trigger("click");
      await flushPromises();

      const nameField = wrapper.findAllComponents({ name: "VTextField" })[0];
      await nameField.vm.$emit("update:modelValue", "Groceries");
      await flushPromises();

      await findButtonByText(wrapper, "Create").trigger("click");
      await flushPromises();

      expect(listServices.createList).toHaveBeenCalledWith({ name: "Groceries" });
      expect(wrapper.text()).toContain("Groceries");

      const addDialog = wrapper.findAllComponents({ name: "VDialog" })[0];
      expect(addDialog.props("modelValue")).toBe(false);
    });

    it("User creates a list with an empty name", async () => {
      ({ wrapper } = await mountDashboard());

      await findButtonByText(wrapper, "+ New List").trigger("click");
      await flushPromises();

      const form = wrapper.findAllComponents({ name: "VForm" })[0];
      await findButtonByText(wrapper, "Create").trigger("click");
      await flushPromises();
      const validation = await form.vm.validate();
      await flushPromises();

      expect(validation.valid).toBe(false);
      expect(document.body.textContent).toContain("List name is required.");
      expect(listServices.createList).not.toHaveBeenCalled();
    });

    it("User creates a list with a name that is too long", async () => {
      listServices.createList.mockRejectedValue({
        response: { data: { message: "List name must be 100 characters or fewer." } },
      });

      ({ wrapper } = await mountDashboard());

      await findButtonByText(wrapper, "+ New List").trigger("click");
      await flushPromises();

      const nameField = wrapper.findAllComponents({ name: "VTextField" })[0];
      await nameField.vm.$emit("update:modelValue", "a".repeat(101));
      await flushPromises();

      await findButtonByText(wrapper, "Create").trigger("click");
      await flushPromises();

      expect(listServices.createList).toHaveBeenCalled();
      expect(wrapper.findComponent({ name: "VAlert" }).exists()).toBe(true);
      expect(document.body.textContent).toContain("List name must be 100 characters or fewer.");
    });
  });

  describe("US-2.2 — View my lists", () => {
    it("Dashboard loads with existing lists", async () => {
      listServices.getLists.mockResolvedValue({
        data: [
          { id: 1, name: "Work", userId: 42 },
          { id: 2, name: "Personal", userId: 42 },
        ],
      });

      ({ wrapper } = await mountDashboard());

      expect(wrapper.text()).toContain("Work");
      expect(wrapper.text()).toContain("Personal");

      const rows = wrapper.findAllComponents({ name: "VListItem" });
      expect(rows).toHaveLength(2);
      rows.forEach((row) => {
        expect(row.find('[aria-label="Edit list"]').exists()).toBe(true);
        expect(row.find('[aria-label="Delete list"]').exists()).toBe(true);
      });
    });

    it("User has no lists", async () => {
      ({ wrapper } = await mountDashboard());

      expect(wrapper.text()).toContain("No lists yet. Create your first list.");
    });
  });

  describe("US-2.3 — Manage list rows", () => {
    it("List rows show edit and delete actions", async () => {
      listServices.getLists.mockResolvedValue({ data: [groceriesList] });

      ({ wrapper } = await mountDashboard());

      const row = wrapper.findAllComponents({ name: "VListItem" })[0];
      expect(row.text()).toContain("Groceries");
      expect(row.find('[aria-label="Edit list"]').exists()).toBe(true);
      expect(row.find('[aria-label="Delete list"]').exists()).toBe(true);
    });
  });

  describe("US-2.4 — Rename and delete lists", () => {
    it("User renames a list", async () => {
      listServices.getLists.mockResolvedValue({ data: [groceriesList] });
      listServices.updateList.mockResolvedValue({
        data: { ...groceriesList, name: "Shopping" },
      });

      ({ wrapper } = await mountDashboard());

      await findButtonsByLabel(wrapper, "Edit list")[0].trigger("click");
      await flushPromises();

      const nameField = wrapper
        .findAllComponents({ name: "VTextField" })
        .find((field) => field.props("modelValue") === "Groceries");
      await nameField.vm.$emit("update:modelValue", "Shopping");
      await flushPromises();

      await findButtonByText(wrapper, "Save").trigger("click");
      await flushPromises();

      expect(listServices.updateList).toHaveBeenCalledWith(1, { name: "Shopping" });
      expect(wrapper.text()).toContain("Shopping");
      expect(wrapper.text()).not.toContain("Groceries");
    });

    it("User deletes a list", async () => {
      listServices.getLists.mockResolvedValue({ data: [groceriesList] });
      listServices.deleteList.mockResolvedValue({ data: groceriesList });

      ({ wrapper } = await mountDashboard());

      await findButtonsByLabel(wrapper, "Delete list")[0].trigger("click");
      await flushPromises();

      await findButtonByText(wrapper, "Delete").trigger("click");
      await flushPromises();

      expect(listServices.deleteList).toHaveBeenCalledWith(1);
      expect(wrapper.text()).not.toContain("Groceries");
    });
  });

  describe("US-2.5 — Private lists only", () => {
    it("Unauthenticated user accesses the dashboard", async () => {
      localStorage.clear();
      await router.push("/login");
      await router.isReady();
      await router.push("/");
      await router.isReady();

      expect(router.currentRoute.value.name).toBe("login");
    });
  });
});
