import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  registrations: defineTable({
    name:       v.string(),
    email:      v.optional(v.string()),
    phone:      v.optional(v.string()),
    familyId:   v.number(),
    familyName: v.string(),
    emailSent:  v.boolean(),
    smsSent:    v.boolean(),
  }).index("by_family", ["familyId"]),
});
