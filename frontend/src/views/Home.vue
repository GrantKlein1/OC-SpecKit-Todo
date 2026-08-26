<script setup>
import { computed } from "vue";
import Utils from "../config/utils.js";
import authServices from "../services/authServices.js";

const firstName = computed(() => Utils.getStore("user")?.fName ?? "");

const handleSignOut = async () => {
  await authServices.logoutUser();
};
</script>

<template>
  <v-container class="py-10">
    <h1 class="text-h4 mb-2">Welcome, {{ firstName }}</h1>
    <p class="text-body-1 mb-4">You are signed in.</p>
    <v-btn
      color="primary"
      variant="elevated"
      class="oc-cta"
      @click="handleSignOut"
    >
      Sign out
    </v-btn>
  </v-container>
</template>
