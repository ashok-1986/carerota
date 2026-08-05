CREATE TABLE "additional_costs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"home_id" uuid NOT NULL,
	"rota_month" date NOT NULL,
	"category" varchar(50) NOT NULL,
	"description" varchar(255) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"added_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"home_id" uuid NOT NULL,
	"url" text NOT NULL,
	"description" text,
	"events" text[] NOT NULL,
	"secret" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"last_triggered_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"identifier" text NOT NULL,
	"count" integer NOT NULL,
	"reset_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rate_limits_identifier_pk" PRIMARY KEY("identifier")
);
--> statement-breakpoint
ALTER TABLE "homes" ADD COLUMN "budget_notes" text;--> statement-breakpoint
ALTER TABLE "homes" ADD COLUMN "home_settings" jsonb DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "additional_costs" ADD CONSTRAINT "additional_costs_home_id_homes_id_fk" FOREIGN KEY ("home_id") REFERENCES "public"."homes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_home_id_homes_id_fk" FOREIGN KEY ("home_id") REFERENCES "public"."homes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_email_unique" UNIQUE("email");--> statement-breakpoint
ALTER TABLE "rota_entries" ADD CONSTRAINT "rota_entries_staff_day_floor_unique" UNIQUE("staff_id","shift_date","home_floor_id");