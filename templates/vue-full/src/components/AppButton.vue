<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}>();
</script>

<template>
  <button
    :disabled="disabled"
    :class="[
      'inline-flex items-center justify-center rounded-md font-medium transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      variant === 'secondary'
        ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
        : variant === 'outline'
          ? 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
          : 'bg-gray-900 text-white hover:bg-gray-700',
      size === 'sm'
        ? 'h-8 px-3 text-xs'
        : size === 'lg'
          ? 'h-11 px-8 text-base'
          : 'h-9 px-4 text-sm',
    ]"
  >
    <slot />
  </button>
</template>
