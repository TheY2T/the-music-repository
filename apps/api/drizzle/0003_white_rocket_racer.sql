CREATE TABLE "favorites" (
	"user_id" text NOT NULL,
	"content_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favorites_user_id_content_id_pk" PRIMARY KEY("user_id","content_id")
);
--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_content_id_content_items_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;