CREATE TABLE "classroom_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"classroom_id" uuid NOT NULL,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "classroom_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "checkout_sessions" ADD COLUMN "entitlement_key" text DEFAULT 'premium' NOT NULL;--> statement-breakpoint
ALTER TABLE "classroom_invitations" ADD CONSTRAINT "classroom_invitations_classroom_id_classrooms_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."classrooms"("id") ON DELETE cascade ON UPDATE no action;