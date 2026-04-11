import type { Meta, StoryObj } from '@storybook/vue3';
import AppButton from './AppButton.vue';

const meta: Meta<typeof AppButton> = {
  title: 'Components/AppButton',
  component: AppButton,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    disabled: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof AppButton>;

export const Default: Story = {
  args: {
    variant: 'primary',
    size: 'md',
  },
  render: (args) => ({
    components: { AppButton },
    setup() {
      return { args };
    },
    template: '<AppButton v-bind="args">Button</AppButton>',
  }),
};

export const Variants: Story = {
  render: () => ({
    components: { AppButton },
    template: `
      <div class="flex flex-wrap gap-2">
        <AppButton variant="primary">Primary</AppButton>
        <AppButton variant="secondary">Secondary</AppButton>
        <AppButton variant="outline">Outline</AppButton>
      </div>
    `,
  }),
};

export const Sizes: Story = {
  render: () => ({
    components: { AppButton },
    template: `
      <div class="flex items-center gap-2">
        <AppButton size="sm">Small</AppButton>
        <AppButton size="md">Medium</AppButton>
        <AppButton size="lg">Large</AppButton>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  render: (args) => ({
    components: { AppButton },
    setup() {
      return { args };
    },
    template: '<AppButton v-bind="args">Disabled</AppButton>',
  }),
};
