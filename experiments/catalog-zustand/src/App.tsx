import { Button } from '@/components/ui/button';
import PostList from '@/components/PostList/PostList';

export default function App() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-8 p-8">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold">React Full Template</h1>
        <p className="text-muted-foreground">Vite + React + Storybook + shadcn/ui</p>
        <div className="flex flex-wrap gap-2">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </div>

      <div className="w-full max-w-lg">
        <h2 className="mb-4 text-lg font-semibold">MSW Demo</h2>
        <PostList />
      </div>
    </main>
  );
}
