CREATE TABLE "feature_flag_environments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"rank" integer DEFAULT 0 NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feature_flag_environments_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "feature_flag_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"flag_id" uuid,
	"environment_id" uuid,
	"action" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"actor_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flag_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"flag_id" uuid NOT NULL,
	"environment_id" uuid NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"default_variant" text DEFAULT 'off' NOT NULL,
	"variants" jsonb NOT NULL,
	"targeting" jsonb,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feature_flag_settings_flag_env_uq" UNIQUE("flag_id","environment_id")
);
--> statement-breakpoint
CREATE TABLE "feature_flag_versions" (
	"environment_id" uuid PRIMARY KEY NOT NULL,
	"version" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"domain" text DEFAULT '' NOT NULL,
	"flag_type" text DEFAULT 'boolean' NOT NULL,
	"default_value" jsonb NOT NULL,
	"source" text DEFAULT 'runtime' NOT NULL,
	"seeded" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feature_flags_key_uq" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "feature_flag_settings" ADD CONSTRAINT "feature_flag_settings_flag_id_feature_flags_id_fk" FOREIGN KEY ("flag_id") REFERENCES "public"."feature_flags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flag_settings" ADD CONSTRAINT "feature_flag_settings_environment_id_feature_flag_environments_id_fk" FOREIGN KEY ("environment_id") REFERENCES "public"."feature_flag_environments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_flag_versions" ADD CONSTRAINT "feature_flag_versions_environment_id_feature_flag_environments_id_fk" FOREIGN KEY ("environment_id") REFERENCES "public"."feature_flag_environments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feature_flag_settings_env_idx" ON "feature_flag_settings" USING btree ("environment_id");--> statement-breakpoint
CREATE INDEX "feature_flags_domain_idx" ON "feature_flags" USING btree ("domain");