/**
 * Features 2 & 3 — Todo List Management, Todo List Item Management
 * Specs: features/feature-2-todo-list-management.md, features/feature-3-todo-list-item-management.md
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Dashboard from "../src/views/Dashboard.vue";
import listServices from "../src/services/listServices.js";
import todoServices from "../src/services/todoServices.js";
import { mountWithPlugins } from "./testUtils.js";

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

const workList = { id: 1, name: "Work", userId: 1 };
const personalList = { id: 2, name: "Personal", userId: 1 };
const groceriesList = { id: 3, name: "Groceries", userId: 1 };

const workTodos = [
  {
    id: 10,
    listId: 1,
    title: "Email client",
    completed: false,
    userId: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: 11,
    listId: 1,
    title: "Write report",
    completed: false,
    userId: 1,
    createdAt: "2026-01-02T00:00:00.000Z",
  },
];

const personalTodos = [
  {
    id: 20,
    listId: 2,
    title: "Call mom",
    completed: false,
    userId: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

const milkTodo = {
  id: 30,
  listId: 3,
  title: "Buy milk",
  completed: false,
  userId: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
};

async function mountDashboard() {
  const { wrapper } = await mountWithPlugins(Dashboard, {
    attachTo: document.body,
  });
  await flushPromises();
  return wrapper;
}

function pageText() {
  return document.body.textContent ?? "";
}

async function clickBodyButton(text) {
  const button = [...document.body.querySelectorAll("button")].find(
    (btn) => btn.textContent?.trim() === text
  );

  expect(button).toBeDefined();
  button.click();
  await flushPromises();
}

async function clickLastBodyButton(text) {
  const buttons = [...document.body.querySelectorAll("button")].filter(
    (btn) => btn.textContent?.trim() === text
  );

  expect(buttons.length).toBeGreaterThan(0);
  buttons[buttons.length - 1].click();
  await flushPromises();
}

async function clickBodyAriaLabel(label) {
  const button = document.body.querySelector(`[aria-label="${label}"]`);
  expect(button).not.toBeNull();
  button.click();
  await flushPromises();
}

function getTodoTitleField(wrapper) {
  const fields = wrapper
    .findAllComponents({ name: "VTextField" })
    .filter((field) => field.props("label") === "Todo title");

  return fields[fields.length - 1];
}

function getDueDateField(wrapper, label = "Due date") {
  const fields = wrapper
    .findAllComponents({ name: "VTextField" })
    .filter((field) => field.props("label") === label);

  return fields[fields.length - 1];
}

async function clickButton(wrapper, text) {
  const localButton = wrapper.findAll("button").find((button) => button.text() === text);

  if (localButton) {
    await localButton.trigger("click");
    return;
  }

  const globalButton = [...document.body.querySelectorAll("button")].find(
    (button) => button.textContent?.trim() === text
  );

  expect(globalButton).toBeDefined();
  globalButton.click();
}

async function openItemsDialog(wrapper, listName) {
  await wrapper.get(`[aria-label="View items for ${listName}"]`).trigger("click");
  await flushPromises();
}

describe("Feature 2 — Dashboard lists view", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    todoServices.getTodos.mockResolvedValue({ data: [] });
  });

  describe("US-2.2 — View my lists", () => {
    it("User has no lists", async () => {
      listServices.getLists.mockResolvedValue({ data: [] });

      const wrapper = await mountDashboard();

      expect(wrapper.text()).toContain("No lists yet. Create your first list.");
      expect(wrapper.text()).not.toContain("Select a list");
    });

    it("Dashboard loads with existing lists", async () => {
      listServices.getLists.mockResolvedValue({ data: [workList, personalList] });

      const wrapper = await mountDashboard();

      expect(wrapper.text()).toContain("Work");
      expect(wrapper.text()).toContain("Personal");
      expect(wrapper.text()).not.toContain("Select a list");
      expect(wrapper.findAll('[aria-label="Edit list"]')).toHaveLength(2);
      expect(wrapper.findAll('[aria-label="Delete list"]')).toHaveLength(2);
    });
  });

  describe("US-2.3 — Manage list rows", () => {
    it("List rows show edit and delete actions", async () => {
      listServices.getLists.mockResolvedValue({ data: [groceriesList] });

      const wrapper = await mountDashboard();

      expect(wrapper.text()).toContain("Groceries");
      expect(wrapper.find('[aria-label="Edit list"]').exists()).toBe(true);
      expect(wrapper.find('[aria-label="Delete list"]').exists()).toBe(true);
    });
  });

  describe("US-2.1 — Create todo lists", () => {
    it("User creates a new list", async () => {
      listServices.getLists.mockResolvedValue({ data: [] });
      listServices.createList.mockResolvedValue({
        data: groceriesList,
      });

      const wrapper = await mountDashboard();

      await clickButton(wrapper, "+ New List");
      await flushPromises();

      const fields = wrapper.findAllComponents({ name: "VTextField" });
      await fields[0].setValue("Groceries");
      await clickButton(wrapper, "Create");
      await flushPromises();

      expect(listServices.createList).toHaveBeenCalledWith("Groceries");
      expect(wrapper.text()).toContain("Groceries");
    });

    it("User creates a list with an empty name", async () => {
      listServices.getLists.mockResolvedValue({ data: [] });

      const wrapper = await mountDashboard();

      await clickButton(wrapper, "+ New List");
      await flushPromises();

      const createForm = wrapper.findAllComponents({ name: "VForm" })[0];
      await clickButton(wrapper, "Create");
      await flushPromises();

      const validation = await createForm.vm.validate();

      expect(validation.valid).toBe(false);
      expect(document.body.textContent).toContain("List name is required.");
      expect(listServices.createList).not.toHaveBeenCalled();
    });
  });

  describe("US-2.4 — Rename and delete lists", () => {
    it("User renames a list", async () => {
      listServices.getLists.mockResolvedValue({ data: [groceriesList] });
      listServices.updateList.mockResolvedValue({
        data: { id: 3, name: "Shopping", userId: 1 },
      });

      const wrapper = await mountDashboard();

      await wrapper.get('[aria-label="Edit list"]').trigger("click");
      await flushPromises();

      const renameField = wrapper
        .findAllComponents({ name: "VTextField" })
        .find((field) => field.props("modelValue") === "Groceries");
      await renameField.setValue("Shopping");
      await clickButton(wrapper, "Save");
      await flushPromises();

      expect(listServices.updateList).toHaveBeenCalledWith(3, "Shopping");
      expect(wrapper.text()).toContain("Shopping");
      expect(wrapper.text()).not.toContain("Groceries");
    });

    it("User deletes a list", async () => {
      listServices.getLists.mockResolvedValue({ data: [groceriesList, personalList] });
      listServices.deleteList.mockResolvedValue({});

      const wrapper = await mountDashboard();
      const deleteButtons = wrapper.findAll('[aria-label="Delete list"]');

      await deleteButtons[0].trigger("click");
      await flushPromises();
      await clickButton(wrapper, "Delete");
      await flushPromises();

      expect(listServices.deleteList).toHaveBeenCalledWith(3);
      expect(wrapper.text()).not.toContain("Groceries");
      expect(wrapper.text()).toContain("Personal");
    });
  });
});

describe("Feature 3 — Dashboard items dialogs", () => {
  const mountedWrappers = [];

  beforeEach(() => {
    vi.clearAllMocks();
    listServices.getLists.mockResolvedValue({ data: [workList, personalList, groceriesList] });
    todoServices.getTodos.mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    mountedWrappers.splice(0).forEach((wrapper) => wrapper.unmount());
    document.body.innerHTML = "";
  });

  async function mountFeature3Dashboard() {
    const wrapper = await mountDashboard();
    mountedWrappers.push(wrapper);
    return wrapper;
  }

  describe("US-3.1 — Add tasks to a list", () => {
    it("User adds a todo to a list via dialog", async () => {
      todoServices.createTodo.mockResolvedValue({ data: milkTodo });

      const wrapper = await mountFeature3Dashboard();
      await openItemsDialog(wrapper, "Groceries");
      await clickBodyButton("+ Add Item");

      const titleField = wrapper
        .findAllComponents({ name: "VTextField" })
        .find((field) => field.props("label") === "Todo title");
      await titleField.setValue("Buy milk");
      await clickBodyButton("Add");

      expect(todoServices.getTodos).toHaveBeenCalledWith(3);
      expect(todoServices.createTodo).toHaveBeenCalledWith(3, "Buy milk");
      expect(pageText()).toContain("Buy milk");
    });

    it("User adds a todo with an empty title", async () => {
      const wrapper = await mountFeature3Dashboard();
      await openItemsDialog(wrapper, "Groceries");
      await clickBodyButton("+ Add Item");
      await clickBodyButton("Add");

      expect(pageText()).toContain("Todo title is required.");
      expect(todoServices.createTodo).not.toHaveBeenCalled();
    });

    it("Add item is only available inside the items dialog", async () => {
      const wrapper = await mountFeature3Dashboard();

      expect(wrapper.text()).not.toContain("+ Add Item");
      expect(todoServices.getTodos).not.toHaveBeenCalled();
    });
  });

  describe("US-3.2 — View tasks in a list", () => {
    it("List items dialog shows empty state", async () => {
      const wrapper = await mountFeature3Dashboard();
      await openItemsDialog(wrapper, "Personal");

      expect(todoServices.getTodos).toHaveBeenCalledWith(2);
      expect(pageText()).toContain("No todos in this list yet.");
    });

    it("User opens items for different lists", async () => {
      todoServices.getTodos.mockImplementation((listId) => {
        if (listId === 1) {
          return Promise.resolve({ data: workTodos });
        }
        if (listId === 2) {
          return Promise.resolve({ data: personalTodos });
        }
        return Promise.resolve({ data: [] });
      });

      const wrapper = await mountFeature3Dashboard();

      await openItemsDialog(wrapper, "Personal");
      expect(pageText()).toContain("Call mom");
      expect(pageText()).not.toContain("Email client");

      await clickBodyButton("Close");

      await openItemsDialog(wrapper, "Work");
      expect(pageText()).toContain("Email client");
      expect(pageText()).toContain("Write report");
      expect(pageText()).not.toContain("Call mom");
    });
  });

  describe("US-3.3 — Complete tasks", () => {
    it("User marks a todo as complete", async () => {
      todoServices.getTodos.mockResolvedValue({ data: [milkTodo] });
      todoServices.updateTodo.mockResolvedValue({
        data: { ...milkTodo, completed: true },
      });

      const wrapper = await mountFeature3Dashboard();
      await openItemsDialog(wrapper, "Groceries");

      const checkbox = wrapper.findComponent({ name: "VCheckbox" });
      await checkbox.vm.$emit("update:modelValue", true);
      await flushPromises();

      expect(todoServices.updateTodo).toHaveBeenCalledWith(30, { completed: true });
      expect(wrapper.findComponent({ name: "VCheckbox" }).props("modelValue")).toBe(true);
    });

    it("User marks a completed todo as incomplete", async () => {
      const completedMilk = { ...milkTodo, completed: true };
      todoServices.getTodos.mockResolvedValue({ data: [completedMilk] });
      todoServices.updateTodo.mockResolvedValue({
        data: { ...milkTodo, completed: false },
      });

      const wrapper = await mountFeature3Dashboard();
      await openItemsDialog(wrapper, "Groceries");

      const checkbox = wrapper.findComponent({ name: "VCheckbox" });
      await checkbox.vm.$emit("update:modelValue", false);
      await flushPromises();

      expect(todoServices.updateTodo).toHaveBeenCalledWith(30, { completed: false });
      expect(wrapper.findComponent({ name: "VCheckbox" }).props("modelValue")).toBe(false);
    });
  });

  describe("US-3.4 — Edit and remove tasks", () => {
    it("User edits a todo title", async () => {
      todoServices.getTodos.mockResolvedValue({ data: [milkTodo] });
      todoServices.updateTodo.mockResolvedValue({
        data: { ...milkTodo, title: "Buy oat milk" },
      });

      const wrapper = await mountFeature3Dashboard();
      await openItemsDialog(wrapper, "Groceries");

      await clickBodyAriaLabel("Edit todo");

      const editField = getTodoTitleField(wrapper);
      await editField.setValue("Buy oat milk");
      await clickLastBodyButton("Save");

      expect(todoServices.updateTodo).toHaveBeenCalledWith(30, {
        title: "Buy oat milk",
        dueDate: null,
      });
      expect(pageText()).toContain("Buy oat milk");
    });

    it("User deletes a todo", async () => {
      todoServices.getTodos.mockResolvedValue({ data: [milkTodo] });
      todoServices.deleteTodo.mockResolvedValue({});

      const wrapper = await mountFeature3Dashboard();
      await openItemsDialog(wrapper, "Groceries");

      await clickBodyAriaLabel("Delete todo");
      await clickLastBodyButton("Delete");

      expect(todoServices.deleteTodo).toHaveBeenCalledWith(30);
      expect(pageText()).not.toContain("Buy milk");
    });
  });
});

describe("Feature 5 — Dashboard due dates", () => {
  const mountedWrappers = [];

  beforeEach(() => {
    vi.clearAllMocks();
    listServices.getLists.mockResolvedValue({ data: [groceriesList] });
    todoServices.getTodos.mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    mountedWrappers.splice(0).forEach((wrapper) => wrapper.unmount());
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  async function mountFeature5Dashboard() {
    const wrapper = await mountDashboard();
    mountedWrappers.push(wrapper);
    return wrapper;
  }

  describe("US-5.1 — Set a due date when creating a todo", () => {
    it("User adds a todo with a due date", async () => {
      todoServices.createTodo.mockResolvedValue({
        data: { ...milkTodo, dueDate: "2026-07-15" },
      });

      const wrapper = await mountFeature5Dashboard();
      await openItemsDialog(wrapper, "Groceries");
      await clickBodyButton("+ Add Item");

      await getTodoTitleField(wrapper).setValue("Buy milk");
      await getDueDateField(wrapper).setValue("2026-07-15");
      await clickBodyButton("Add");

      expect(todoServices.createTodo).toHaveBeenCalledWith(3, "Buy milk", "2026-07-15");
      expect(pageText()).toContain("Due");
    });
  });

  describe("US-5.3 — Edit or clear a due date", () => {
    it("User sets a due date when editing a todo", async () => {
      todoServices.getTodos.mockResolvedValue({ data: [milkTodo] });
      todoServices.updateTodo.mockResolvedValue({
        data: { ...milkTodo, dueDate: "2026-07-20" },
      });

      const wrapper = await mountFeature5Dashboard();
      await openItemsDialog(wrapper, "Groceries");
      await clickBodyAriaLabel("Edit todo");

      await getDueDateField(wrapper).setValue("2026-07-20");
      await clickLastBodyButton("Save");

      expect(todoServices.updateTodo).toHaveBeenCalledWith(30, {
        title: "Buy milk",
        dueDate: "2026-07-20",
      });
      expect(pageText()).toContain("Due");
    });

    it("User clears a due date when editing a todo", async () => {
      todoServices.getTodos.mockResolvedValue({
        data: [{ ...milkTodo, dueDate: "2026-07-20" }],
      });
      todoServices.updateTodo.mockResolvedValue({
        data: { ...milkTodo, dueDate: null },
      });

      const wrapper = await mountFeature5Dashboard();
      await openItemsDialog(wrapper, "Groceries");
      await clickBodyAriaLabel("Edit todo");

      await getDueDateField(wrapper).setValue("");
      await clickLastBodyButton("Save");

      expect(todoServices.updateTodo).toHaveBeenCalledWith(30, {
        title: "Buy milk",
        dueDate: null,
      });
    });
  });

  describe("US-5.4 — Spot overdue todos", () => {
    it("Incomplete todo past due date is styled as overdue", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-07-10T12:00:00"));

      todoServices.getTodos.mockResolvedValue({
        data: [{ ...milkTodo, dueDate: "2026-07-09" }],
      });

      const wrapper = await mountFeature5Dashboard();
      await openItemsDialog(wrapper, "Groceries");

      expect(document.body.querySelector(".text-error")).not.toBeNull();
    });

    it("Completed todo past due date is not styled as overdue", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-07-10T12:00:00"));

      todoServices.getTodos.mockResolvedValue({
        data: [{ ...milkTodo, dueDate: "2026-07-09", completed: true }],
      });

      const wrapper = await mountFeature5Dashboard();
      await openItemsDialog(wrapper, "Groceries");

      expect(document.body.querySelector(".text-error")).toBeNull();
    });
  });
});
