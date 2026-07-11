CREATE TABLE "content_genres" (
	"content_id" uuid NOT NULL,
	"genre_id" uuid NOT NULL,
	CONSTRAINT "content_genres_content_id_genre_id_pk" PRIMARY KEY("content_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "content_instruments" (
	"content_id" uuid NOT NULL,
	"instrument_id" uuid NOT NULL,
	CONSTRAINT "content_instruments_content_id_instrument_id_pk" PRIMARY KEY("content_id","instrument_id")
);
--> statement-breakpoint
CREATE TABLE "content_skill_topics" (
	"content_id" uuid NOT NULL,
	"skill_topic_id" uuid NOT NULL,
	CONSTRAINT "content_skill_topics_content_id_skill_topic_id_pk" PRIMARY KEY("content_id","skill_topic_id")
);
--> statement-breakpoint
CREATE TABLE "content_tags" (
	"content_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "content_tags_content_id_tag_id_pk" PRIMARY KEY("content_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "genres" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "genres_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "instruments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "instruments_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"storage_key" text NOT NULL,
	"filename" text NOT NULL,
	"mime" text NOT NULL,
	"bytes" integer DEFAULT 0 NOT NULL,
	"license" text,
	"attribution" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "skill_topics_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "content_items" ADD COLUMN "body_mdx" text;--> statement-breakpoint
ALTER TABLE "content_items" ADD COLUMN "difficulty" integer;--> statement-breakpoint
ALTER TABLE "content_items" ADD COLUMN "source" text;--> statement-breakpoint
ALTER TABLE "content_items" ADD COLUMN "attribution" text;--> statement-breakpoint
ALTER TABLE "content_items" ADD COLUMN "license" text;--> statement-breakpoint
ALTER TABLE "content_genres" ADD CONSTRAINT "content_genres_content_id_content_items_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_genres" ADD CONSTRAINT "content_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_instruments" ADD CONSTRAINT "content_instruments_content_id_content_items_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_instruments" ADD CONSTRAINT "content_instruments_instrument_id_instruments_id_fk" FOREIGN KEY ("instrument_id") REFERENCES "public"."instruments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_skill_topics" ADD CONSTRAINT "content_skill_topics_content_id_content_items_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_skill_topics" ADD CONSTRAINT "content_skill_topics_skill_topic_id_skill_topics_id_fk" FOREIGN KEY ("skill_topic_id") REFERENCES "public"."skill_topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_tags" ADD CONSTRAINT "content_tags_content_id_content_items_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_tags" ADD CONSTRAINT "content_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_content_id_content_items_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;