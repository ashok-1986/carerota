import { pgTable, uuid, varchar, decimal } from "drizzle-orm/pg-core";

export const shiftCodes = pgTable('shift_codes', {
  id:          uuid('id').primaryKey().defaultRandom(),
  code:        varchar('code', { length: 10 }).notNull().unique(), // LD, N, E, L, RO, AL, etc.
  label:       varchar('label', { length: 100 }).notNull(),
  hours:       decimal('hours', { precision: 4, scale: 2 }).notNull(),
  category:    varchar('category', { length: 20 }).notNull(), // work, absence, float
  floors:      varchar('floors').array().notNull(), // array of floor types e.g. ['care'], ['ancillary', 'office'], ['all']
});
