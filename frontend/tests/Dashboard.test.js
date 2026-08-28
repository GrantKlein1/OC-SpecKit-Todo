/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 *
 * Feature 3 — Todo List Item Management
 * Spec: features/feature-3-todo-list-item-management.md
 *
 * Feature 5 — Todo Due Date
 * Spec: features/feature-5-todo-due-date.md
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { DOMWrapper, flushPromises } from "@vue/test-utils";
import Dashboard from "../src/views/Dashboard.vue";
import listServices from "../src/services/listServices.js";
import todoServices from "../src/services/todoServices.js";
import router from "../src/router.js";
import { mountWithPlugins } from "./testUtils.js";
import { formatDueDate } from "../src/config/validation.js";

vi.mock("../src/services/listServices.js", () => ({
  default: {
    getLists: vi.fn(),
    createList: vi.fn(),
    updateList: vi.fn(),
    deleteList: vi.fn(),
  },
}));

vi.mock("../src/services/todoServices.js", () => ({
  default: {
    getTodos: vi.fn(),
    createTodo: vi.fn(),
    updateTodo: vi.fn(),
    deleteTodo: vi.fn(),
  },
}));

const groceriesList = {
  id: 1,
  name: "Groceries",
  userId: 42,
  createdAt: "2026-07-02T12:00:00.000Z",
  updatedAt: "2026-07-02T12:00:00.000Z",
};

const buyMilkTodo = {
  id: 10,
  listId: 1,
  title: "Buy milk",
  completed: false,
  userId: 42,
  createdAt: "2026-07-02T12:05:00.000Z",
  updatedAt: "2026-07-02T12:05:00.000Z",
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

function findButtonByExactText(text, { last = false } = {}) {
  const matches = [...document.body.querySelectorAll("button")].filter(
    (button) => normalizeText(button.textContent) === text
  );

  const el = last ? matches[matches.length - 1] : matches[0];
  return el ? new DOMWrapper(el) : undefined;
}

function findButtonsByLabel(wrapper, label) {
  const fromWrapper = wrapper.findAll(`[aria-label="${label}"]`);
  if (fromWrapper.length > 0) {
    return fromWrapper;
  }

  return [...document.body.querySelectorAll(`[aria-label="${label}"]`)].map(
    (el) => new DOMWrapper(el)
  );
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
    todoServices.getTodos.mockResolvedValue({ data: [] });
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

async function openItemsDialog(wrapper, listName) {
  await wrapper.find(`[aria-label="View items for ${listName}"]`).trigger("click");
  await flushPromises();
}

describe("Feature 3 — Dashboard list items", () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="app"></div>';
    listServices.getLists.mockResolvedValue({ data: [] });
    todoServices.getTodos.mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    wrapper?.unmount();
    document.body.innerHTML = "";
  });

  describe("US-3.1 — Add tasks to a list", () => {
    it("User adds a todo to a list via dialog", async () => {
      listServices.getLists.mockResolvedValue({ data: [groceriesList] });
      todoServices.getTodos.mockResolvedValue({ data: [] });
      todoServices.createTodo.mockResolvedValue({ data: buyMilkTodo });

      ({ wrapper } = await mountDashboard());
      await openItemsDialog(wrapper, "Groceries");

      await findButtonByText(wrapper, "+ Add Item").trigger("click");
      await flushPromises();

      const titleField = wrapper
        .findAllComponents({ name: "VTextField" })
        .find((field) => field.props("label") === "Todo title");
      await titleField.vm.$emit("update:modelValue", "Buy milk");
      await flushPromises();

      await findButtonByExactText("Add").trigger("click");
      await flushPromises();

      expect(todoServices.createTodo).toHaveBeenCalledWith(1, { title: "Buy milk" });
      expect(document.body.textContent).toContain("Buy milk");
    });

    it("User adds a todo with an empty title", async () => {
      listServices.getLists.mockResolvedValue({ data: [groceriesList] });

      ({ wrapper } = await mountDashboard());
      await openItemsDialog(wrapper, "Groceries");

      await findButtonByText(wrapper, "+ Add Item").trigger("click");
      await flushPromises();

      await findButtonByExactText("Add").trigger("click");
      await flushPromises();

      expect(document.body.textContent).toContain("Todo title is required.");
      expect(todoServices.createTodo).not.toHaveBeenCalled();
    });

    it("Add item is only available inside the items dialog", async () => {
      listServices.getLists.mockResolvedValue({ data: [groceriesList] });

      ({ wrapper } = await mountDashboard());

      expect(findButtonByText(wrapper, "+ Add Item")).toBeUndefined();

      await openItemsDialog(wrapper, "Groceries");

      expect(findButtonByText(wrapper, "+ Add Item")).toBeDefined();
    });
  });

  describe("US-3.2 — View tasks in a list", () => {
    it("List items dialog shows empty state", async () => {
      const personalList = { ...groceriesList, id: 2, name: "Personal" };
      listServices.getLists.mockResolvedValue({ data: [personalList] });
      todoServices.getTodos.mockResolvedValue({ data: [] });

      ({ wrapper } = await mountDashboard());
      await openItemsDialog(wrapper, "Personal");

      expect(document.body.textContent).toContain("No todos in this list yet.");
    });

    it("User opens items for different lists", async () => {
      const workList = { id: 1, name: "Work", userId: 42 };
      const personalList = { id: 2, name: "Personal", userId: 42 };
      const emailClient = { ...buyMilkTodo, id: 11, listId: 1, title: "Email client" };
      const writeReport = { ...buyMilkTodo, id: 12, listId: 1, title: "Write report" };
      const callMom = { ...buyMilkTodo, id: 13, listId: 2, title: "Call mom" };

      listServices.getLists.mockResolvedValue({ data: [workList, personalList] });
      todoServices.getTodos.mockImplementation((listId) => {
        if (listId === 1) {
          return Promise.resolve({ data: [emailClient, writeReport] });
        }

        if (listId === 2) {
          return Promise.resolve({ data: [callMom] });
        }

        return Promise.resolve({ data: [] });
      });

      ({ wrapper } = await mountDashboard());
      await openItemsDialog(wrapper, "Personal");

      expect(document.body.textContent).toContain("Call mom");
      expect(document.body.textContent).not.toContain("Email client");
      expect(document.body.textContent).not.toContain("Write report");

      await findButtonByExactText("Close").trigger("click");
      await flushPromises();

      await openItemsDialog(wrapper, "Work");

      expect(document.body.textContent).toContain("Email client");
      expect(document.body.textContent).toContain("Write report");
      expect(document.body.textContent).not.toContain("Call mom");
    });
  });

  describe("US-3.3 — Complete tasks", () => {
    it("User marks a todo as complete", async () => {
      listServices.getLists.mockResolvedValue({ data: [groceriesList] });
      todoServices.getTodos.mockResolvedValue({ data: [buyMilkTodo] });
      todoServices.updateTodo.mockResolvedValue({
        data: { ...buyMilkTodo, completed: true },
      });

      ({ wrapper } = await mountDashboard());
      await openItemsDialog(wrapper, "Groceries");

      const checkbox = wrapper.findAllComponents({ name: "VCheckbox" })[0];
      await checkbox.vm.$emit("update:modelValue", true);
      await flushPromises();

      expect(todoServices.updateTodo).toHaveBeenCalledWith(10, { completed: true });
      expect(document.body.innerHTML).toContain("text-decoration-line-through");
    });

    it("User marks a completed todo as incomplete", async () => {
      const completedTodo = { ...buyMilkTodo, completed: true };
      listServices.getLists.mockResolvedValue({ data: [groceriesList] });
      todoServices.getTodos.mockResolvedValue({ data: [completedTodo] });
      todoServices.updateTodo.mockResolvedValue({
        data: { ...buyMilkTodo, completed: false },
      });

      ({ wrapper } = await mountDashboard());
      await openItemsDialog(wrapper, "Groceries");

      const checkbox = wrapper.findAllComponents({ name: "VCheckbox" })[0];
      await checkbox.vm.$emit("update:modelValue", false);
      await flushPromises();

      expect(todoServices.updateTodo).toHaveBeenCalledWith(10, { completed: false });
      expect(document.body.innerHTML).not.toContain("text-decoration-line-through");
    });
  });

  describe("US-3.4 — Edit and remove tasks", () => {
    it("User edits a todo title", async () => {
      listServices.getLists.mockResolvedValue({ data: [groceriesList] });
      todoServices.getTodos.mockResolvedValue({ data: [buyMilkTodo] });
      todoServices.updateTodo.mockResolvedValue({
        data: { ...buyMilkTodo, title: "Buy oat milk" },
      });

      ({ wrapper } = await mountDashboard());
      await openItemsDialog(wrapper, "Groceries");

      await findButtonsByLabel(wrapper, "Edit item")[0].trigger("click");
      await flushPromises();

      const titleField = wrapper
        .findAllComponents({ name: "VTextField" })
        .find((field) => field.props("modelValue") === "Buy milk");
      await titleField.vm.$emit("update:modelValue", "Buy oat milk");
      await flushPromises();

      await findButtonByText(wrapper, "Save").trigger("click");
      await flushPromises();

      expect(todoServices.updateTodo).toHaveBeenCalledWith(10, {
        title: "Buy oat milk",
        dueDate: null,
      });
      expect(document.body.textContent).toContain("Buy oat milk");
    });

    it("User deletes a todo", async () => {
      listServices.getLists.mockResolvedValue({ data: [groceriesList] });
      todoServices.getTodos.mockResolvedValue({ data: [buyMilkTodo] });
      todoServices.deleteTodo.mockResolvedValue({ data: buyMilkTodo });

      ({ wrapper } = await mountDashboard());
      await openItemsDialog(wrapper, "Groceries");

      await findButtonsByLabel(wrapper, "Delete item")[0].trigger("click");
      await flushPromises();

      await findButtonByExactText("Delete", { last: true }).trigger("click");
      await flushPromises();

      expect(todoServices.deleteTodo).toHaveBeenCalledWith(10);
      expect(document.body.textContent).toContain("No todos in this list yet.");
    });
  });
});

function localDateYmd(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function yesterdayYmd() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return localDateYmd(date);
}

function findDueDateFields(wrapper) {
  return wrapper
    .findAllComponents({ name: "VTextField" })
    .filter((field) => field.props("label") === "Due date");
}

function findDueDateField(wrapper, modelValue) {
  const fields = findDueDateFields(wrapper);
  if (modelValue !== undefined) {
    const match = fields.find((field) => field.props("modelValue") === modelValue);
    if (match) {
      return match;
    }
  }

  return fields[fields.length - 1];
}

describe("Feature 5 — Dashboard todo due dates", () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="app"></div>';
    listServices.getLists.mockResolvedValue({ data: [] });
    todoServices.getTodos.mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    wrapper?.unmount();
    document.body.innerHTML = "";
  });

  describe("US-5.1 — Set a due date when creating a todo", () => {
    it("User adds a todo with a due date", async () => {
      const createdTodo = { ...buyMilkTodo, dueDate: "2026-07-15" };
      listServices.getLists.mockResolvedValue({ data: [groceriesList] });
      todoServices.getTodos.mockResolvedValue({ data: [] });
      todoServices.createTodo.mockResolvedValue({ data: createdTodo });

      ({ wrapper } = await mountDashboard());
      await openItemsDialog(wrapper, "Groceries");

      await findButtonByText(wrapper, "+ Add Item").trigger("click");
      await flushPromises();

      const titleField = wrapper
        .findAllComponents({ name: "VTextField" })
        .find((field) => field.props("label") === "Todo title");
      await titleField.vm.$emit("update:modelValue", "Buy milk");
      await findDueDateFields(wrapper)[0].vm.$emit("update:modelValue", "2026-07-15");
      await flushPromises();

      await findButtonByExactText("Add").trigger("click");
      await flushPromises();

      expect(todoServices.createTodo).toHaveBeenCalledWith(1, {
        title: "Buy milk",
        dueDate: "2026-07-15",
      });
      expect(document.body.textContent).toContain("Buy milk");
      expect(document.body.textContent).toContain(formatDueDate("2026-07-15"));
    });
  });

  describe("US-5.3 — Edit or clear a due date", () => {
    it("User sets a due date when editing a todo", async () => {
      const updatedTodo = { ...buyMilkTodo, dueDate: "2026-07-20" };
      listServices.getLists.mockResolvedValue({ data: [groceriesList] });
      todoServices.getTodos.mockResolvedValue({ data: [buyMilkTodo] });
      todoServices.updateTodo.mockResolvedValue({ data: updatedTodo });

      ({ wrapper } = await mountDashboard());
      await openItemsDialog(wrapper, "Groceries");

      await findButtonsByLabel(wrapper, "Edit item")[0].trigger("click");
      await flushPromises();

      await findDueDateField(wrapper).vm.$emit("update:modelValue", "2026-07-20");
      await flushPromises();

      await findButtonByText(wrapper, "Save").trigger("click");
      await flushPromises();

      expect(todoServices.updateTodo).toHaveBeenCalledWith(10, {
        title: "Buy milk",
        dueDate: "2026-07-20",
      });
      expect(document.body.textContent).toContain(formatDueDate("2026-07-20"));
    });

    it("User clears a due date when editing a todo", async () => {
      const datedTodo = { ...buyMilkTodo, dueDate: "2026-07-20" };
      listServices.getLists.mockResolvedValue({ data: [groceriesList] });
      todoServices.getTodos.mockResolvedValue({ data: [datedTodo] });
      todoServices.updateTodo.mockResolvedValue({
        data: { ...buyMilkTodo, dueDate: null },
      });

      ({ wrapper } = await mountDashboard());
      await openItemsDialog(wrapper, "Groceries");

      expect(document.body.textContent).toContain(formatDueDate("2026-07-20"));

      await findButtonsByLabel(wrapper, "Edit item")[0].trigger("click");
      await flushPromises();

      await findDueDateField(wrapper, "2026-07-20").vm.$emit("update:modelValue", "");
      await flushPromises();

      await findButtonByText(wrapper, "Save").trigger("click");
      await flushPromises();

      expect(todoServices.updateTodo).toHaveBeenCalledWith(10, {
        title: "Buy milk",
        dueDate: null,
      });
      expect(document.body.textContent).not.toContain(formatDueDate("2026-07-20"));
    });
  });

  describe("US-5.4 — Spot overdue todos", () => {
    it("Incomplete todo past due date is styled as overdue", async () => {
      const overdueTodo = {
        ...buyMilkTodo,
        dueDate: yesterdayYmd(),
        completed: false,
      };
      listServices.getLists.mockResolvedValue({ data: [groceriesList] });
      todoServices.getTodos.mockResolvedValue({ data: [overdueTodo] });

      ({ wrapper } = await mountDashboard());
      await openItemsDialog(wrapper, "Groceries");

      const dueDateEl = document.body.querySelector(".todo-due-date");
      expect(dueDateEl).not.toBeNull();
      expect(dueDateEl.textContent).toContain(formatDueDate(overdueTodo.dueDate));
      expect(dueDateEl.className).toContain("text-error");
    });

    it("Completed todo past due date is not styled as overdue", async () => {
      const completedPastDue = {
        ...buyMilkTodo,
        dueDate: yesterdayYmd(),
        completed: true,
      };
      listServices.getLists.mockResolvedValue({ data: [groceriesList] });
      todoServices.getTodos.mockResolvedValue({ data: [completedPastDue] });

      ({ wrapper } = await mountDashboard());
      await openItemsDialog(wrapper, "Groceries");

      const dueDateEl = document.body.querySelector(".todo-due-date");
      expect(dueDateEl).not.toBeNull();
      expect(dueDateEl.textContent).toContain(formatDueDate(completedPastDue.dueDate));
      expect(dueDateEl.className).not.toContain("text-error");
    });
  });
});

