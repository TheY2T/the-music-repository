CREATE TABLE "collection_bookmarks" (
	"user_id" text NOT NULL,
	"collection_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collection_bookmarks_user_id_collection_id_pk" PRIMARY KEY("user_id","collection_id")
);
--> statement-breakpoint
CREATE TABLE "collection_ratings" (
	"user_id" text NOT NULL,
	"collection_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collection_ratings_user_id_collection_id_pk" PRIMARY KEY("user_id","collection_id")
);
--> statement-breakpoint
CREATE TABLE "collection_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collection_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"position" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "collection_items" DROP CONSTRAINT "collection_items_collection_id_content_id_pk";--> statement-breakpoint
ALTER TABLE "collection_items" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "collection_items" ADD COLUMN "section_id" uuid;--> statement-breakpoint
ALTER TABLE "collection_items" ADD COLUMN "curator_note" text;--> statement-breakpoint
ALTER TABLE "collection_items" ADD COLUMN "focus_skills" jsonb;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "body_mdx" text;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "curation_type" text DEFAULT 'editorial' NOT NULL;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "owner_id" text;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "hero_image_key" text;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "accent" text;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "difficulty_min" integer;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "difficulty_max" integer;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "est_minutes" integer;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "curator_name" text;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "curator_bio" text;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "outcomes" jsonb;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "facets" jsonb;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "tags" jsonb;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "popularity" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "collection_bookmarks" ADD CONSTRAINT "collection_bookmarks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_bookmarks" ADD CONSTRAINT "collection_bookmarks_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_ratings" ADD CONSTRAINT "collection_ratings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_ratings" ADD CONSTRAINT "collection_ratings_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_sections" ADD CONSTRAINT "collection_sections_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_section_id_collection_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."collection_sections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_collection_content_uq" UNIQUE("collection_id","content_id");