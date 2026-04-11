<script setup lang="ts">
import AppButton from '@/components/AppButton.vue';
import PostList from '@/components/PostList/PostList.vue';
</script>

<template>
  <main class="flex min-h-screen flex-col items-center gap-8 p-8">
    <div class="flex flex-col items-center gap-4">
      <h1 class="text-2xl font-bold">Vue Full Template</h1>
      <p class="text-gray-500">Vite + Vue 3 + Storybook + Tailwind CSS</p>
      <div class="flex flex-wrap gap-2">
        <AppButton variant="primary">Primary</AppButton>
        <AppButton variant="secondary">Secondary</AppButton>
        <AppButton variant="outline">Outline</AppButton>
      </div>
    </div>

    <div class="w-full max-w-lg">
      <h2 class="mb-4 text-lg font-semibold">MSW Demo</h2>
      <PostList />
    </div>
  </main>
</template>
