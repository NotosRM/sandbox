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
    "test:run": "vitest run"
  },
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "lucide-react": "^0.400.0",
    "@sandbox/shared": "workspace:*",
    "axios": "^1.7.0"
  },
  "devDependencies": {
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "@vitejs/plugin-react": "^4.4.1",
    "@tailwindcss/vite": "^4.0.0",
    "tailwindcss": "^4.0.0",
    "storybook": "^8.0.0",
    "@storybook/react-vite": "^8.0.0",
    "@storybook/addon-essentials": "^8.0.0",
    "@storybook/test": "^8.0.0",
    "typescript": "^5.8.3",
    "vite": "^6.3.2",
    "vitest": "^3.0.0",
    "msw": "^2.7.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0"
  },
  "sandbox": {
    "template": "react-full",
    "created": "{{date}}"
  }
}
