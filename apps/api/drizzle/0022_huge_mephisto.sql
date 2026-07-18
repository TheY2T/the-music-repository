CREATE TABLE "drill_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"deck" text NOT NULL,
	"card" text NOT NULL,
	"modality" text NOT NULL,
	"accuracy" double precision NOT NULL,
	"correct" boolean NOT NULL,
	"response_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "drill_attempts" ADD CONSTRAINT "drill_attempts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "drill_attempts_user_deck_idx" ON "drill_attempts" USING btree ("user_id","deck");