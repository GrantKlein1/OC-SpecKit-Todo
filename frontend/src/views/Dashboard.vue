<script setup>
import { onMounted, ref } from "vue";
import listServices from "../services/listServices.js";
import ListItemsDialog from "../components/ListItemsDialog.vue";

const lists = ref([]);
const loading = ref(false);
const errorMessage = ref("");

const addDialog = ref(false);
const addForm = ref(null);
const newListName = ref("");
const addLoading = ref(false);

const editDialog = ref(false);
const editForm = ref(null);
const editingList = ref(null);
const editName = ref("");
const editLoading = ref(false);

const deleteDialog = ref(false);
const deletingList = ref(null);
const deleteLoading = ref(false);

const itemsDialog = ref(false);
const itemsList = ref(null);

const nameRules = [(value) => !!value?.trim() || "List name is required."];

const sortLists = (items) =>
  [...items].sort((a, b) => a.name.localeCompare(b.name));

const loadLists = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await listServices.getLists();
    lists.value = sortLists(response.data);
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Failed to load lists.";
  } finally {
    loading.value = false;
  }
};

onMounted(loadLists);

const openAddDialog = () => {
  newListName.value = "";
  errorMessage.value = "";
  addDialog.value = true;
};

const createList = async () => {
  const { valid } = await addForm.value.validate();

  if (!valid) {
    return;
  }

  addLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await listServices.createList({ name: newListName.value.trim() });
    lists.value = sortLists([...lists.value, response.data]);
    addDialog.value = false;
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Failed to create list.";
  } finally {
    addLoading.value = false;
  }
};

const openEditDialog = (list) => {
  editingList.value = list;
  editName.value = list.name;
  errorMessage.value = "";
  editDialog.value = true;
};

const saveList = async () => {
  const { valid } = await editForm.value.validate();

  if (!valid) {
    return;
  }

  editLoading.value = true;
  errorMessage.value = "";

  try {
    const response = await listServices.updateList(editingList.value.id, {
      name: editName.value.trim(),
    });
    lists.value = sortLists(
      lists.value.map((item) => (item.id === response.data.id ? response.data : item))
    );
    editDialog.value = false;
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Failed to update list.";
  } finally {
    editLoading.value = false;
  }
};

const openItemsDialog = (list) => {
  itemsList.value = list;
  errorMessage.value = "";
  itemsDialog.value = true;
};

const openDeleteDialog = (list) => {
  deletingList.value = list;
  errorMessage.value = "";
  deleteDialog.value = true;
};

const confirmDelete = async () => {
  deleteLoading.value = true;
  errorMessage.value = "";

  try {
    await listServices.deleteList(deletingList.value.id);
    lists.value = lists.value.filter((item) => item.id !== deletingList.value.id);
    deleteDialog.value = false;
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Failed to delete list.";
  } finally {
    deleteLoading.value = false;
  }
};
</script>

<template>
  <v-container class="py-8">
    <v-card elevation="2">
      <v-card-item>
        <v-card-title class="text-h5">My Lists</v-card-title>
        <template #append>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            @click="openAddDialog"
          >
            + New List
          </v-btn>
        </template>
      </v-card-item>

      <v-progress-linear v-if="loading" indeterminate color="primary" />

      <v-card-text>
        <v-alert v-if="errorMessage && !addDialog && !editDialog" type="error" class="mb-4">
          {{ errorMessage }}
        </v-alert>

        <p v-if="!loading && lists.length === 0" class="text-body-1">
          No lists yet. Create your first list.
        </p>

        <v-list v-else-if="lists.length > 0">
          <v-list-item v-for="list in lists" :key="list.id">
            <v-list-item-title>{{ list.name }}</v-list-item-title>
            <template #append>
              <v-btn
                icon
                size="small"
                :aria-label="`View items for ${list.name}`"
                variant="text"
                @click="openItemsDialog(list)"
              >
                <v-icon>mdi-format-list-checks</v-icon>
              </v-btn>
              <v-btn
                icon
                size="small"
                aria-label="Edit list"
                variant="text"
                @click="openEditDialog(list)"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn
                icon
                size="small"
                aria-label="Delete list"
                variant="text"
                @click="openDeleteDialog(list)"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <ListItemsDialog v-if="itemsDialog" v-model="itemsDialog" :list="itemsList" />

    <v-dialog v-model="addDialog" max-width="480">
      <v-card>
        <v-card-title>New List</v-card-title>
        <v-card-text>
          <v-form ref="addForm" @submit.prevent="createList">
            <v-text-field
              v-model="newListName"
              label="List name"
              density="comfortable"
              :rules="nameRules"
            />
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
            @click="createList"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editDialog" max-width="480">
      <v-card>
        <v-card-title>Rename List</v-card-title>
        <v-card-text>
          <v-form ref="editForm" @submit.prevent="saveList">
            <v-text-field
              v-model="editName"
              label="List name"
              density="comfortable"
              :rules="nameRules"
            />
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
            @click="saveList"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="480">
      <v-card>
        <v-card-title>Delete List</v-card-title>
        <v-card-text>
          Delete {{ deletingList?.name }}?
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
  </v-container>
</template>
