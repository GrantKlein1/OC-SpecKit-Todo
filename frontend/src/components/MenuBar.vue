<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute } from "vue-router";
import Utils from "../config/utils.js";
import authServices from "../services/authServices.js";

const hiddenRouteNames = new Set(["login", "register"]);
const route = useRoute();
const user = ref(Utils.getStore("user"));

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

const handleSignOut = async () => {
  await authServices.logoutUser();
};
</script>

<template>
  <v-app-bar v-if="visible" color="surface" elevation="1">
    <v-spacer />
    <span class="text-body-1 mr-4">{{ displayName }}</span>
    <v-btn
      color="primary"
      variant="text"
      class="oc-cta"
      @click="handleSignOut"
    >
      Sign out
    </v-btn>
  </v-app-bar>
</template>
