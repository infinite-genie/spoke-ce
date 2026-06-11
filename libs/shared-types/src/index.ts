import { z } from 'zod';

export const UserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  displayName: z.string().min(1).max(80),
  avatarUrl: z.url().nullable(),
  createdAt: z.iso.datetime(),
});
export type User = z.infer<typeof UserSchema>;

export const WorkspaceSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(80),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/),
  createdAt: z.iso.datetime(),
});
export type Workspace = z.infer<typeof WorkspaceSchema>;

export const WorkspaceRoleSchema = z.enum(['owner', 'admin', 'member']);
export type WorkspaceRole = z.infer<typeof WorkspaceRoleSchema>;

export const WorkspaceMemberSchema = z.object({
  workspaceId: z.uuid(),
  userId: z.uuid(),
  role: WorkspaceRoleSchema,
  joinedAt: z.iso.datetime(),
});
export type WorkspaceMember = z.infer<typeof WorkspaceMemberSchema>;

/** Attached to every request by TenantContextGuard (spec §4). */
export const WorkspaceContextSchema = z.object({
  userId: z.uuid(),
  workspaceId: z.uuid(),
  role: WorkspaceRoleSchema,
});
export type WorkspaceContext = z.infer<typeof WorkspaceContextSchema>;
