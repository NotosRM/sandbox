<script setup lang="ts">
import AppButton from '@/components/AppButton.vue';
</script>

<template>
  <main class="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
    <h1 class="text-2xl font-bold">Vue Full Template</h1>
    <p class="text-gray-500">Vite + Vue 3 + Storybook + Tailwind CSS</p>
    <div class="flex flex-wrap gap-2">
      <AppButton variant="primary">Primary</AppButton>
      <AppButton variant="secondary">Secondary</AppButton>
      <AppButton variant="outline">Outline</AppButton>
    </div>
  </main>
</template>
