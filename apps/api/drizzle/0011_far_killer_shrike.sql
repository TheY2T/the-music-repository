CREATE TABLE "saved_progressions" (
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"key_root" integer NOT NULL,
	"chords" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_progressions_user_id_name_pk" PRIMARY KEY("user_id","name")
);
--> statement-breakpoint
ALTER TABLE "saved_progressions" ADD CONSTRAINT "saved_progressions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;