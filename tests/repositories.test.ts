import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { resetDbForTests } from '@/lib/db';
import { createUser } from '@/lib/repositories/users';
import { createPost, listPosts, getPost, updatePost, deletePost } from '@/lib/repositories/posts';
import { createComment, listByPost } from '@/lib/repositories/comments';
import { createRace, listRaces } from '@/lib/repositories/races';
import { createGlossary, listGlossary, findTerm } from '@/lib/repositories/glossary';

const TEST_DB = path.join(process.cwd(), 'data', 'test.db');

beforeEach(() => {
  resetDbForTests();
  if (fs.existsSync(TEST_DB)) fs.rmSync(TEST_DB);
  process.env.DATABASE_PATH = TEST_DB;
});

describe('posts repository', () => {
  it('creates and lists posts by category', () => {
    const user = createUser('a@example.com', 'hash', 'Alice');
    createPost({ category: 'free', authorId: user.id, title: 'Hello', body: 'world' });
    createPost({ category: 'training', authorId: user.id, title: 'LSD', body: 'long slow' });

    const free = listPosts('free');
    const training = listPosts('training');
    expect(free.items).toHaveLength(1);
    expect(training.items).toHaveLength(1);
    expect(free.items[0].title).toBe('Hello');
  });

  it('enforces author-only update and delete', () => {
    const a = createUser('a@x.com', 'h', 'A');
    const b = createUser('b@x.com', 'h', 'B');
    const post = createPost({ category: 'free', authorId: a.id, title: 't', body: 'b' });

    const forbidden = updatePost(post.id, b.id, { title: 'hack' });
    expect(forbidden.ok).toBe(false);
    expect(forbidden.reason).toBe('forbidden');

    const ok = updatePost(post.id, a.id, { title: 'updated' });
    expect(ok.ok).toBe(true);
    expect(getPost(post.id)?.title).toBe('updated');

    const delForbidden = deletePost(post.id, b.id);
    expect(delForbidden.ok).toBe(false);

    const delOk = deletePost(post.id, a.id);
    expect(delOk.ok).toBe(true);
    expect(getPost(post.id)).toBeUndefined();
  });
});

describe('comments repository', () => {
  it('attaches comments to posts', () => {
    const u = createUser('c@x.com', 'h', 'C');
    const p = createPost({ category: 'free', authorId: u.id, title: 't', body: 'b' });
    createComment(p.id, u.id, '잘 봤어요');
    createComment(p.id, u.id, '감사합니다');
    const list = listByPost(p.id);
    expect(list).toHaveLength(2);
  });
});

describe('races repository', () => {
  it('separates upcoming and past races', () => {
    const u = createUser('r@x.com', 'h', 'R');
    createRace({
      name: '미래 대회',
      raceDate: '2099-01-01',
      location: '서울',
      distanceKm: 10,
      createdBy: u.id,
    });
    createRace({
      name: '과거 대회',
      raceDate: '2000-01-01',
      location: '부산',
      distanceKm: 21.0975,
      createdBy: u.id,
    });
    const { upcoming, past } = listRaces();
    expect(upcoming.map((r) => r.name)).toContain('미래 대회');
    expect(past.map((r) => r.name)).toContain('과거 대회');
  });
});

describe('glossary repository', () => {
  it('searches by term and definition', () => {
    const u = createUser('g@x.com', 'h', 'G');
    createGlossary('LSD', 'Long Slow Distance — 천천히 오래 달리는 훈련', u.id);
    createGlossary('VO2max', '최대 산소 섭취량', u.id);

    expect(listGlossary('LSD')).toHaveLength(1);
    expect(listGlossary('산소')).toHaveLength(1);
    expect(listGlossary('xyz')).toHaveLength(0);
    expect(findTerm('lsd')?.term).toBe('LSD');
  });
});
