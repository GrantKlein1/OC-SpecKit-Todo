<script setup>
import { ref, watch } from "vue";
import todoServices from "../services/todoServices.js";
import {
  formatDueDate,
  isTodoOverdue,
  optionalDueDateRules,
  toDateInputValue,
} from "../config/validation.js";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  list: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue"]);

const todos = ref([]);
const loading = ref(false);
const errorMessage = ref("");

const addDialog = ref(false);
const addForm = ref(null);
const newTodoTitle = ref("");
const newTodoDueDate = ref("");
const addLoading = ref(false);

const editDialog = ref(false);
const editForm = ref(null);
const editingTodo = ref(null);
const editTitle = ref("");
const editDueDate = ref("");
const editLoading = ref(false);

const deleteDialog = ref(false);
const deletingTodo = ref(null);
const deleteLoading = ref(false);

const titleRules = [(value) => !!value?.trim() || "Todo title is required."];

const sortTodos = (items) =>
  [...items].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    return new Date(a.createdAt) - new Date(b.createdAt);
  });

const loadTodos = async () => {
  if (!props.list?.id) {
    return;
  }

  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await todoServices.getTodos(props.list.id);
    todos.value = sortTodos(response.data);
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Failed to load todos.";
    todos.value = [];
  } finally {
    loading.value = false;
  }
};

watch(
  () => [props.modelValue, props.list?.id],
  ([isOpen]) => {
    if (isOpen && props.list?.id) {
      todos.value = [];
      loadTodos();
    }
  },
  { immediate: true }
);

const closeDialog = () => {
  emit("update:modelValue", false);
};

const openAddDialog = () => {
  newTodoTitle.value = "";
  newTodoDueDate.value = "";
  errorMessage.value = "";
  addDialog.value = true;
};

const createTodo = async () => {
  const { valid } = await addForm.value.validate();

  if (!valid) {
    return;
  }

  addLoading.value = true;
  errorMessage.value = "";

  try {
    const payload = {
      title: newTodoTitle.value.trim(),
    };

    if (newTodoDueDate.value) {
      payload.dueDate = newTodoDueDate.value;
    }

    const response = await todoServices.createTodo(props.list.id, payload);
    todos.value = sortTodos([...todos.value, response.data]);
    addDialog.value = false;
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Failed to create todo.";
  } finally {
    addLoading.value = false;
  }
};

const openEditDialog = (todo) => {
  editingTodo.value = todo;
  editTitle.value = todo.title;
  editDueDate.value = toDateInputValue(todo.dueDate);
  errorMessage.value = "";
  editDialog.value = true;
};

const saveTodo = async () => {
  const { valid } = await editForm.value.validate();

  if (!valid) {
    return;
  }

  editLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await todoServices.updateTodo(editingTodo.value.id, {
      title: editTitle.value.trim(),
      dueDate: editDueDate.value || null,
    });
    todos.value = sortTodos(
      todos.value.map((item) => (item.id === response.data.id ? response.data : item))
    );
    editDialog.value = false;
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Failed to update todo.";
  } finally {
    editLoading.value = false;
  }
};

const toggleComplete = async (todo, completed) => {
  errorMessage.value = "";

  try {
    const response = await todoServices.updateTodo(todo.id, { completed });
    todos.value = sortTodos(
      todos.value.map((item) => (item.id === response.data.id ? response.data : item))
    );
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Failed to update todo.";
  }
};

const openDeleteDialog = (todo) => {
  deletingTodo.value = todo;
  errorMessage.value = "";
  deleteDialog.value = true;
};

const confirmDelete = async () => {
  deleteLoading.value = true;
  errorMessage.value = "";

  try {
    await todoServices.deleteTodo(deletingTodo.value.id);
    todos.value = todos.value.filter((item) => item.id !== deletingTodo.value.id);
    deleteDialog.value = false;
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Failed to delete todo.";
  } finally {
    deleteLoading.value = false;
  }
};
</script>

<template>
  <v-dialog :model-value="modelValue" max-width="640" @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-item>
        <v-card-title class="text-h6">{{ list?.name }} — Items</v-card-title>
        <template #append>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            @click="openAddDialog"
          >
            + Add Item
          </v-btn>
        </template>
      </v-card-item>

      <v-progress-linear v-if="loading" indeterminate color="primary" />

      <v-card-text>
        <v-alert v-if="errorMessage && !addDialog && !editDialog" type="error" class="mb-4">
          {{ errorMessage }}
        </v-alert>

        <p v-if="!loading && todos.length === 0" class="text-body-1">
          No todos in this list yet.
        </p>

        <v-list v-else-if="todos.length > 0">
          <v-list-item v-for="todo in todos" :key="todo.id">
            <template #prepend>
              <v-checkbox
                :model-value="todo.completed"
                hide-details
                density="compact"
                :aria-label="`Toggle ${todo.title}`"
                @update:model-value="toggleComplete(todo, $event)"
              />
            </template>
            <v-list-item-title
              :class="{ 'text-decoration-line-through text-medium-emphasis': todo.completed }"
            >
              {{ todo.title }}
            </v-list-item-title>
            <v-list-item-subtitle v-if="todo.dueDate">
              <span
                class="todo-due-date"
                :class="{ 'text-error': isTodoOverdue(todo) }"
              >
                {{ formatDueDate(todo.dueDate) }}
              </span>
            </v-list-item-subtitle>
            <template #append>
              <v-btn
                icon
                size="small"
                aria-label="Edit item"
                variant="text"
                @click="openEditDialog(todo)"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn
                icon
                size="small"
                aria-label="Delete item"
                variant="text"
                @click="openDeleteDialog(todo)"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn color="secondary" variant="text" @click="closeDialog">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="addDialog" max-width="480">
    <v-card>
      <v-card-title>Add Item</v-card-title>
      <v-card-text>
        <v-form ref="addForm" @submit.prevent="createTodo">
          <v-row>
            <v-col cols="7">
              <v-text-field
                v-model="newTodoTitle"
                label="Todo title"
                density="comfortable"
                :rules="titleRules"
              />
            </v-col>
            <v-col cols="5">
              <v-text-field
                v-model="newTodoDueDate"
                type="date"
                label="Due date"
                density="comfortable"
                :rules="optionalDueDateRules"
              />
            </v-col>
          </v-row>
          <v-alert v-if="errorMessage" type="error" class="mt-2">
            {{ errorMessage }}
          </v-alert>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="secondary" variant="text" @click="addDialog = false">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          class="oc-cta"
          :loading="addLoading"
          @click="createTodo"
        >
          Add
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="editDialog" max-width="480">
    <v-card>
      <v-card-title>Edit Item</v-card-title>
      <v-card-text>
        <v-form ref="editForm" @submit.prevent="saveTodo">
          <v-row>
            <v-col cols="7">
              <v-text-field
                v-model="editTitle"
                label="Todo title"
                density="comfortable"
                :rules="titleRules"
              />
            </v-col>
            <v-col cols="5">
              <v-text-field
                v-model="editDueDate"
                type="date"
                label="Due date"
                density="comfortable"
                :rules="optionalDueDateRules"
              />
            </v-col>
          </v-row>
          <v-alert v-if="errorMessage" type="error" class="mt-2">
            {{ errorMessage }}
          </v-alert>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="secondary" variant="text" @click="editDialog = false">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          class="oc-cta"
          :loading="editLoading"
          @click="saveTodo"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="deleteDialog" max-width="480">
    <v-card>
      <v-card-title>Delete Item</v-card-title>
      <v-card-text>
        Delete {{ deletingTodo?.title }}?
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="secondary" variant="text" @click="deleteDialog = false">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          class="oc-cta"
          :loading="deleteLoading"
          @click="confirmDelete"
        >
          Delete
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
