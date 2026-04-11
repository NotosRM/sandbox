<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
import type { Post } from '@/mocks/handlers';

type Status = 'idle' | 'loading' | 'success' | 'error';

const posts = ref<Post[]>([]);
const status = ref<Status>('idle');
const errorMessage = ref('');

async function fetchPosts() {
  status.value = 'loading';
  posts.value = [];
  errorMessage.value = '';

  try {
    const response = await axios.get<Post[]>('/api/posts');
    posts.value = response.data;
    status.value = 'success';
  } catch (err) {
    const message = axios.isAxiosError(err)
      ? ((err.response?.data as { message: string })?.message ?? err.message)
      : 'Unknown error';
    errorMessage.value = message;
    status.value = 'error';
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <button
      class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      :disabled="status === 'loading'"
      @click="fetchPosts"
    >
      {{ status === 'loading' ? 'Loading…' : 'Fetch Posts' }}
    </button>

    <div
      v-if="status === 'error'"
      role="alert"
      class="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      Error: {{ errorMessage }}
    </div>

    <p v-if="status === 'success' && posts.length === 0" class="text-sm text-gray-500">
      No posts found.
    </p>

    <ul v-if="posts.length > 0" class="flex flex-col gap-2">
      <li v-for="post in posts" :key="post.id" class="rounded-md border p-4">
        <h2 class="font-semibold">{{ post.title }}</h2>
        <p class="mt-1 text-sm text-gray-500">{{ post.body }}</p>
      </li>
    </ul>
  </div>
</template>
