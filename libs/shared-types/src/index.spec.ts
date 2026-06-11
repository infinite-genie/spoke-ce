import { describe, expect, it } from 'vitest';
import {
  UserSchema,
  WorkspaceSchema,
  WorkspaceRoleSchema,
  WorkspaceMemberSchema,
  WorkspaceContextSchema,
} from '@spoke/shared-types';

const uuid = '0197a1f0-7e2a-7b3c-8d4e-5f6a7b8c9d0e';
const iso = '2026-06-11T12:00:00.000Z';

describe('UserSchema', () => {
  it('parses a valid user', () => {
    const user = {
      id: uuid,
      email: 'rony@example.com',
      displayName: 'Rony',
      avatarUrl: null,
      createdAt: iso,
    };
    expect(UserSchema.parse(user)).toEqual(user);
  });

  it('rejects an invalid email', () => {
    expect(
      UserSchema.safeParse({
        id: uuid,
        email: 'nope',
        displayName: 'R',
        avatarUrl: null,
        createdAt: iso,
      }).success,
    ).toBe(false);
  });
});

describe('WorkspaceSchema', () => {
  it('parses a valid workspace', () => {
    const ws = { id: uuid, name: 'Acme', slug: 'acme', createdAt: iso };
    expect(WorkspaceSchema.parse(ws)).toEqual(ws);
  });

  it('rejects a non-uuid id and an invalid slug', () => {
    expect(
      WorkspaceSchema.safeParse({ id: 'x', name: 'Acme', slug: 'acme', createdAt: iso }).success,
    ).toBe(false);
    expect(
      WorkspaceSchema.safeParse({ id: uuid, name: 'Acme', slug: 'Not A Slug!', createdAt: iso })
        .success,
    ).toBe(false);
  });
});

describe('WorkspaceRoleSchema', () => {
  it('accepts exactly owner | admin | member', () => {
    expect(WorkspaceRoleSchema.options).toEqual(['owner', 'admin', 'member']);
    expect(WorkspaceRoleSchema.safeParse('guest').success).toBe(false);
  });
});

describe('WorkspaceMemberSchema', () => {
  it('parses a valid membership', () => {
    const m = { workspaceId: uuid, userId: uuid, role: 'member', joinedAt: iso };
    expect(WorkspaceMemberSchema.parse(m)).toEqual(m);
  });
});

describe('WorkspaceContextSchema', () => {
  it('parses the guard-attached context', () => {
    const ctx = { userId: uuid, workspaceId: uuid, role: 'admin' };
    expect(WorkspaceContextSchema.parse(ctx)).toEqual(ctx);
  });
});
