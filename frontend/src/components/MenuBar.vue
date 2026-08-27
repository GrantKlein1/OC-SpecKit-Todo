<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute } from "vue-router";
import Utils from "../config/utils.js";
import authServices from "../services/authServices.js";
import userServices from "../services/userServices.js";
import { emailRules } from "../config/validation.js";

const hiddenRouteNames = new Set(["login", "register"]);
const route = useRoute();
const user = ref(Utils.getStore("user"));
const profileMenuOpen = ref(false);
const editDialogOpen = ref(false);
const form = ref(null);
const fName = ref("");
const lName = ref("");
const email = ref("");
const username = ref("");
const password = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const errorMessage = ref("");

const refreshUser = () => {
  user.value = Utils.getStore("user");
};

onMounted(() => {
  window.addEventListener("user-logged-in", refreshUser);
  window.addEventListener("user-logged-out", refreshUser);
});

onUnmounted(() => {
  window.removeEventListener("user-logged-in", refreshUser);
  window.removeEventListener("user-logged-out", refreshUser);
});

const visible = computed(() => Boolean(user.value) && !hiddenRouteNames.has(route.name));

const displayName = computed(() => {
  if (!user.value) {
    return "";
  }

  return [user.value.fName, user.value.lName].filter(Boolean).join(" ");
});

const fNameRules = [(value) => !!value?.trim() || "First name is required."];
const lNameRules = [(value) => !!value?.trim() || "Last name is required."];
const usernameRules = [(value) => !!value?.trim() || "Username is required."];
const passwordRules = [
  (value) => !value || value.length >= 8 || "Password must be at least 8 characters.",
];
const confirmPasswordRules = [
  (value) => value === password.value || "Passwords do not match.",
];

const prefillFromProfile = (profile) => {
  fName.value = profile?.fName || "";
  lName.value = profile?.lName || "";
  email.value = profile?.email || "";
  username.value = profile?.username || "";
  password.value = "";
  confirmPassword.value = "";
};

const openEditDialog = async () => {
  profileMenuOpen.value = false;
  errorMessage.value = "";
  prefillFromProfile(user.value);
  editDialogOpen.value = true;

  const userId = user.value?.userId;
  if (!userId) {
    return;
  }

  try {
    const response = await userServices.getUser(userId);
    prefillFromProfile(response.data);
  } catch {
    // Keep session values when the profile fetch fails.
  }
};

const closeEditDialog = () => {
  editDialogOpen.value = false;
  errorMessage.value = "";
};

const handleSave = async () => {
  errorMessage.value = "";
  const { valid } = await form.value.validate();

  if (!valid) {
    return;
  }

  loading.value = true;

  try {
    const payload = {
      fName: fName.value.trim(),
      lName: lName.value.trim(),
      email: email.value.trim(),
      username: username.value.trim(),
    };

    if (password.value) {
      payload.password = password.value;
    }

    const response = await userServices.updateUser(user.value.userId, payload);
    const current = Utils.getStore("user") || {};
    Utils.setStore("user", {
      ...current,
      fName: response.data.fName,
      lName: response.data.lName,
      email: response.data.email,
      username: response.data.username,
      role: response.data.role ?? current.role,
    });
    window.dispatchEvent(new CustomEvent("user-logged-in"));
    editDialogOpen.value = false;
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Failed to update profile.";
  } finally {
    loading.value = false;
  }
};

const handleLogOut = async () => {
  profileMenuOpen.value = false;
  await authServices.logoutUser();
};
</script>

<template>
  <v-app-bar v-if="visible" color="surface" elevation="1">
    <v-spacer />
    <v-menu v-model="profileMenuOpen" location="bottom end">
      <template #activator="{ props: menuProps }">
        <v-btn
          icon="mdi-account-circle"
          variant="text"
          color="primary"
          aria-label="Open profile"
          v-bind="menuProps"
        />
      </template>

      <v-card min-width="280" rounded="lg">
        <v-list>
          <v-list-item :title="displayName">
            <template #subtitle>
              <div>{{ user.username }}</div>
              <div>{{ user.email }}</div>
            </template>
          </v-list-item>
        </v-list>

        <v-card-actions>
          <v-btn
            color="primary"
            variant="elevated"
            class="oc-cta"
            @click="openEditDialog"
          >
            Edit Profile
          </v-btn>
        </v-card-actions>

        <v-list>
          <v-list-item title="Log out" @click="handleLogOut" />
        </v-list>
      </v-card>
    </v-menu>
  </v-app-bar>

  <v-dialog v-model="editDialogOpen" max-width="560">
    <v-card rounded="lg">
      <v-card-title>Edit Profile</v-card-title>

      <v-card-text>
        <v-form ref="form" @submit.prevent="handleSave">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="fName"
                label="First name"
                density="comfortable"
                autocomplete="given-name"
                :rules="fNameRules"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="lName"
                label="Last name"
                density="comfortable"
                autocomplete="family-name"
                :rules="lNameRules"
              />
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="email"
                label="Email"
                type="email"
                density="comfortable"
                autocomplete="email"
                :rules="emailRules"
              />
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="username"
                label="Username"
                density="comfortable"
                autocomplete="username"
                :rules="usernameRules"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="password"
                label="New password"
                type="password"
                density="comfortable"
                autocomplete="new-password"
                :rules="passwordRules"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="confirmPassword"
                label="Confirm password"
                type="password"
                density="comfortable"
                autocomplete="new-password"
                :rules="confirmPasswordRules"
              />
            </v-col>
          </v-row>

          <v-alert
            v-if="errorMessage"
            type="error"
            density="compact"
            class="mb-4"
          >
            {{ errorMessage }}
          </v-alert>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn color="secondary" variant="text" @click="closeEditDialog">
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          class="oc-cta"
          :loading="loading"
          @click="handleSave"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
