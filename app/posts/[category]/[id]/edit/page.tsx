import { notFound, redirect } from 'next/navigation';
import { getPost } from '@/lib/repositories/posts';
import { getSession } from '@/lib/session';
import EditForm from './EditForm';

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ category: string; id: string }>;
}) {
  const { category, id } = await params;
  const post = getPost(Number(id));
  if (!post || post.category !== category) notFound();
  const session = await getSession();
  if (!session.userId) redirect('/login');
  if (session.userId !== post.author_id) redirect(`/posts/${category}/${id}`);

  return (
    <>
      <div className="section-head">
        <div>
          <h1>글 수정</h1>
          <p className="section-head__meta">{category === 'training' ? '훈련방법' : '자유게시판'}</p>
        </div>
      </div>
      <EditForm
        postId={post.id}
        category={category}
        initialTitle={post.title}
        initialBody={post.body}
        initialRunDistanceKm={post.run_distance_km}
        initialRunPace={post.run_pace}
        initialRunType={post.run_type}
      />
    </>
  );
}
