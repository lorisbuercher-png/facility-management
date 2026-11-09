CREATE TABLE execution_teams (
 id text PRIMARY KEY NOT NULL,
 owner_id text NOT NULL,
 name text NOT NULL,
 created_at text NOT NULL,
 updated_at text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX execution_teams_owner_name ON execution_teams (owner_id,name);
--> statement-breakpoint
CREATE TABLE execution_team_members (
 owner_id text NOT NULL,
 team_id text NOT NULL REFERENCES execution_teams(id) ON DELETE CASCADE,
 employee_grant_id text NOT NULL REFERENCES team_access(id) ON DELETE CASCADE,
 created_at text NOT NULL,
 PRIMARY KEY(team_id,employee_grant_id)
);
--> statement-breakpoint
CREATE INDEX execution_team_members_grant ON execution_team_members (owner_id,employee_grant_id);
--> statement-breakpoint
CREATE TABLE task_email_outbox (
 id text PRIMARY KEY NOT NULL,
 owner_id text NOT NULL,
 recipient_email text NOT NULL,
 company_id text NOT NULL,
 task_id text NOT NULL,
 kind text NOT NULL,
 team_name text,
 company_name text NOT NULL,
 location_name text NOT NULL,
 status text NOT NULL DEFAULT 'pending',
 attempts integer NOT NULL DEFAULT 0,
 next_attempt_at text NOT NULL,
 created_at text NOT NULL,
 sent_at text,
 last_error text
);
--> statement-breakpoint
CREATE INDEX task_email_outbox_pending ON task_email_outbox (status,next_attempt_at);
--> statement-breakpoint
CREATE INDEX task_email_outbox_owner ON task_email_outbox (owner_id,created_at);
