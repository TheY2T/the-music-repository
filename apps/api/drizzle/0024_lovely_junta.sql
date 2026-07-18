CREATE TABLE "entity_translation_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"translation_id" uuid NOT NULL,
	"value" text,
	"action" text NOT NULL,
	"edited_by" text,
	"edited_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entity_translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"field" text NOT NULL,
	"draft_value" text,
	"published_value" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"deleted_at" timestamp with time zone,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entity_translations_target_uq" UNIQUE("entity_type","entity_id","locale","field")
);
--> statement-breakpoint
ALTER TABLE "entity_translation_revisions" ADD CONSTRAINT "entity_translation_revisions_translation_id_entity_translations_id_fk" FOREIGN KEY ("translation_id") REFERENCES "public"."entity_translations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "entity_translations_lookup_idx" ON "entity_translations" USING btree ("entity_type","entity_id","locale");