import { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import type { Post } from '@/mocks/handlers';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function PostList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function fetchPosts() {
    setStatus('loading');
    setPosts([]);
    setErrorMessage('');

    try {
      const response = await axios.get<Post[]>('/api/posts');
      setPosts(response.data);
      setStatus('success');
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? ((err.response?.data as { message: string })?.message ?? err.message)
        : 'Unknown error';
      setErrorMessage(message);
      setStatus('error');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Button onClick={fetchPosts} disabled={status === 'loading'}>
        {status === 'loading' ? 'Loading…' : 'Fetch Posts'}
      </Button>

      {status === 'error' && (
        <div
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          Error: {errorMessage}
        </div>
      )}

      {status === 'success' && posts.length === 0 && (
        <p className="text-sm text-muted-foreground">No posts found.</p>
      )}

      {posts.length > 0 && (
        <ul className="flex flex-col gap-2">
          {posts.map((post) => (
            <li key={post.id} className="rounded-md border p-4">
              <h2 className="font-semibold">{post.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{post.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
