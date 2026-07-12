CREATE TABLE "classroom_members" (
	"classroom_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "classroom_members_classroom_id_user_id_pk" PRIMARY KEY("classroom_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "classrooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"owner_id" text NOT NULL,
	"join_code" text NOT NULL,
	"premium_granted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "classrooms_join_code_unique" UNIQUE("join_code")
);
--> statement-breakpoint
ALTER TABLE "classroom_members" ADD CONSTRAINT "classroom_members_classroom_id_classrooms_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."classrooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classroom_members" ADD CONSTRAINT "classroom_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;