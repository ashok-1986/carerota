CREATE TABLE "homes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"group_id" uuid,
	"payroll_start_day" smallint DEFAULT 19 NOT NULL,
	"budget_cap_monthly" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "home_floors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"home_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(10) NOT NULL,
	"floor_type" varchar NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"userId" uuid NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"providerAccountId" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255),
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" varchar(255) PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"emailVerified" timestamp,
	"image" text
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"home_id" uuid NOT NULL,
	"home_floor_id" uuid,
	"name" varchar(255) NOT NULL,
	"role" varchar(50) NOT NULL,
	"employment_type" varchar NOT NULL,
	"contracted_hours" numeric(5, 2),
	"pay_rate_hourly" numeric(8, 2),
	"auth_user_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(10) NOT NULL,
	"label" varchar(100) NOT NULL,
	"hours" numeric(4, 2) NOT NULL,
	"category" varchar(20) NOT NULL,
	"floors" varchar[] NOT NULL,
	CONSTRAINT "shift_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "rota_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"home_id" uuid NOT NULL,
	"staff_id" uuid NOT NULL,
	"home_floor_id" uuid NOT NULL,
	"shift_date" date NOT NULL,
	"shift_code_id" uuid,
	"actual_floor_id" uuid,
	"rota_month" date NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"home_id" uuid NOT NULL,
	"staff_id" uuid NOT NULL,
	"leave_type" varchar NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"home_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"before_value" jsonb,
	"after_value" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" varchar(45)
);
--> statement-breakpoint
CREATE TABLE "staff_patterns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staff_id" uuid NOT NULL,
	"day_of_week" smallint NOT NULL,
	"shift_code_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "home_floors" ADD CONSTRAINT "home_floors_home_id_homes_id_fk" FOREIGN KEY ("home_id") REFERENCES "public"."homes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_home_id_homes_id_fk" FOREIGN KEY ("home_id") REFERENCES "public"."homes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_home_floor_id_home_floors_id_fk" FOREIGN KEY ("home_floor_id") REFERENCES "public"."home_floors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rota_entries" ADD CONSTRAINT "rota_entries_home_id_homes_id_fk" FOREIGN KEY ("home_id") REFERENCES "public"."homes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rota_entries" ADD CONSTRAINT "rota_entries_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rota_entries" ADD CONSTRAINT "rota_entries_home_floor_id_home_floors_id_fk" FOREIGN KEY ("home_floor_id") REFERENCES "public"."home_floors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rota_entries" ADD CONSTRAINT "rota_entries_shift_code_id_shift_codes_id_fk" FOREIGN KEY ("shift_code_id") REFERENCES "public"."shift_codes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rota_entries" ADD CONSTRAINT "rota_entries_actual_floor_id_home_floors_id_fk" FOREIGN KEY ("actual_floor_id") REFERENCES "public"."home_floors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_home_id_homes_id_fk" FOREIGN KEY ("home_id") REFERENCES "public"."homes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_patterns" ADD CONSTRAINT "staff_patterns_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_patterns" ADD CONSTRAINT "staff_patterns_shift_code_id_shift_codes_id_fk" FOREIGN KEY ("shift_code_id") REFERENCES "public"."shift_codes"("id") ON DELETE set null ON UPDATE no action;