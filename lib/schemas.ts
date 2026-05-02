import { z } from 'zod';

export const SignupSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(100),
  displayName: z.string().min(1).max(50),
});

export const LoginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(100),
});

export const PostCategory = z.enum(['free', 'training']);

const RunFields = {
  runDistanceKm: z.number().positive().max(300).nullable().optional(),
  runPace: z.string().regex(/^\d+:\d{2}$/).nullable().optional(),
  runType: z.enum(['LSD', '인터벌', '템포런', '파틀렉', '회복런', '레이스', '빌드업', '기타']).nullable().optional(),
};

export const PostCreateSchema = z.object({
  category: PostCategory,
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
  ...RunFields,
});

export const PostUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).max(10000).optional(),
  ...RunFields,
});

export const CommentCreateSchema = z.object({
  body: z.string().min(1).max(2000),
});

export const RaceCreateSchema = z.object({
  name: z.string().min(1).max(200),
  raceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식'),
  location: z.string().min(1).max(200),
  distanceKm: z.number().positive().max(250),
  description: z.string().max(2000).optional(),
  registrationUrl: z.string().url().max(500).optional(),
});

export const GlossaryCreateSchema = z.object({
  term: z.string().min(1).max(80),
  definition: z.string().min(1).max(2000),
});

export type SignupInput = z.infer<typeof SignupSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type PostCreateInput = z.infer<typeof PostCreateSchema>;
export type PostUpdateInput = z.infer<typeof PostUpdateSchema>;
export type CommentCreateInput = z.infer<typeof CommentCreateSchema>;
export type RaceCreateInput = z.infer<typeof RaceCreateSchema>;
export type GlossaryCreateInput = z.infer<typeof GlossaryCreateSchema>;
