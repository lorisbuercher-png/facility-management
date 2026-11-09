import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
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


// Dedicated append-only, tenant-scoped conversation. Not part of the 4 MB snapshot.
export const customerMessages = sqliteTable('customer_messages', {
 id: text('id').primaryKey(),
 ownerId: text('owner_id').notNull(),
 companyId: text('company_id').notNull(),
 taskId: text('task_id'),
 authorId: text('author_id').notNull(),
 authorName: text('author_name').notNull(),
 authorRole: text('author_role').notNull(),
 body: text('body').notNull(),
 createdAt: text('created_at').notNull(),
},t=>[index('customer_messages_tenant_time').on(t.ownerId,t.companyId,t.createdAt)]);


export const notifications = sqliteTable('notifications', {
 id: text('id').primaryKey(),
 ownerId: text('owner_id').notNull(),
 recipientEmail: text('recipient_email').notNull(),
 companyId: text('company_id').notNull(),
 locationId: text('location_id'),
 taskId: text('task_id'),
 kind: text('kind').notNull(),
 title: text('title').notNull(),
 body: text('body').notNull(),
 createdAt: text('created_at').notNull(),
 readAt: text('read_at'),
}, t=>[
 index('notifications_recipient_time').on(t.ownerId,t.recipientEmail,t.createdAt),
 index('notifications_recipient_unread').on(t.ownerId,t.recipientEmail,t.readAt),
]);

export const executionTeams = sqliteTable('execution_teams', {
 id: text('id').primaryKey(),
 ownerId:text('owner_id').notNull(),
 name:text('name').notNull(),
 createdAt:text('created_at').notNull(),
 updatedAt:text('updated_at').notNull(),
}, t=>[uniqueIndex('execution_teams_owner_name').on(t.ownerId,t.name)]);

export const executionTeamMembers = sqliteTable('execution_team_members',{
 ownerId:text('owner_id').notNull(),
 teamId:text('team_id').notNull().references(()=>executionTeams.id,{onDelete:'cascade'}),
 employeeGrantId:text('employee_grant_id').notNull().references(()=>teamAccess.id,{onDelete:'cascade'}),
 createdAt:text('created_at').notNull(),
},t=>[index('execution_team_members_grant').on(t.ownerId,t.employeeGrantId)]);

export const taskEmailOutbox = sqliteTable('task_email_outbox',{
 id:text('id').primaryKey(),
 ownerId:text('owner_id').notNull(),
 recipientEmail:text('recipient_email').notNull(),
 companyId:text('company_id').notNull(),
 taskId:text('task_id').notNull(),
 kind:text('kind').notNull(),
 teamName:text('team_name'),
 companyName:text('company_name').notNull(),
 locationName:text('location_name').notNull(),
 status:text('status').notNull().default('pending'),
 attempts:integer('attempts').notNull().default(0),
 nextAttemptAt:text('next_attempt_at').notNull(),
 createdAt:text('created_at').notNull(),
 sentAt:text('sent_at'),
 lastError:text('last_error'),
},t=>[index('task_email_outbox_pending').on(t.status,t.nextAttemptAt),index('task_email_outbox_owner').on(t.ownerId,t.createdAt)]);
