import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const platformState = sqliteTable('platform_state', {
  ownerId: text('owner_id').primaryKey(),
  payload: text('payload').notNull(),
  revision: integer('revision').notNull().default(0),
  updatedAt: text('updated_at').notNull(),
});

export const teamAccess = sqliteTable('team_access', {
 id: text('id').primaryKey(),
 ownerId: text('owner_id').notNull(),
 name: text('name').notNull(),
 email: text('email').notNull(),
 role: text('role').notNull(),
 companyId: text('company_id'),
 locationId: text('location_id'),
 active: integer('active').notNull().default(1),
 revision: integer('revision').notNull().default(1),
 createdAt: text('created_at').notNull(),
 updatedAt: text('updated_at').notNull(),
}, (t)=>[uniqueIndex('team_access_owner_email').on(t.ownerId,t.email)]);
