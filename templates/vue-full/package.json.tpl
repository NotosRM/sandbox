{
  "name": "@sandbox/{{name}}",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "test": "vitest",
    "test:run": "vitest run",
    "bench": "vitest bench"
  },
  "dependencies": {
    "vue": "^3.5.0",
    "@sandbox/shared": "workspace:*",
    "axios": "^1.7.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "tailwindcss": "^4.0.0",
    "storybook": "^8.0.0",
    "@storybook/vue3-vite": "^8.0.0",
    "@storybook/addon-essentials": "^8.0.0",
    "@storybook/test": "^8.0.0",
    "typescript": "^5.8.3",
    "vite": "^6.3.2",
    "vitest": "^3.0.0",
    "msw": "^2.7.0",
    "@vue/test-utils": "^2.0.0",
    "@testing-library/vue": "^8.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0"
  },
  "sandbox": {
    "template": "vue-full",
    "created": "{{date}}"
  }
}
