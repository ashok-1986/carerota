import { pgTable, uuid, varchar, smallint } from "drizzle-orm/pg-core";
import { homes } from "./homes";

export const homeFloors = pgTable('home_floors', {
  id:          uuid('id').primaryKey().defaultRandom(),
  homeId:      uuid('home_id').notNull().references(() => homes.id),
  name:        varchar('name', { length: 100 }).notNull(),
  code:        varchar('code', { length: 10 }).notNull(),   // Kg, Uj, Th
  floorType:   varchar('floor_type').notNull(),             // care_floor|office|ancillary
  sortOrder:   smallint('sort_order').default(0).notNull(),
});
