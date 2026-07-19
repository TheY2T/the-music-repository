CREATE TABLE "kofi_donations" (
	"message_id" text PRIMARY KEY NOT NULL,
	"kofi_transaction_id" text,
	"type" text NOT NULL,
	"from_name" text,
	"email" text,
	"amount" text,
	"currency" text,
	"message" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"is_subscription_payment" boolean DEFAULT false NOT NULL,
	"tier_name" text,
	"kofi_timestamp" timestamp with time zone,
	"raw" jsonb NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
