import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const MAX_SLOTS = 15;

/** Returns { [familyId]: count } for all families */
export const getCounts = query({
  handler: async (ctx) => {
    const regs = await ctx.db.query("registrations").collect();
    const counts: Record<number, number> = {};
    for (const reg of regs) {
      counts[reg.familyId] = (counts[reg.familyId] ?? 0) + 1;
    }
    return counts;
  },
});

/** Returns { [familyId]: [{name, email, phone}] } — for admin view */
export const getAll = query({
  handler: async (ctx) => {
    const regs = await ctx.db.query("registrations").collect();
    const grouped: Record<number, { name: string; email?: string; phone?: string }[]> = {};
    for (const reg of regs) {
      if (!grouped[reg.familyId]) grouped[reg.familyId] = [];
      grouped[reg.familyId].push({
        name:  reg.name,
        email: reg.email,
        phone: reg.phone,
      });
    }
    return grouped;
  },
});

/** Register a new member — checks capacity then schedules email/SMS */
export const register = mutation({
  args: {
    name:       v.string(),
    email:      v.optional(v.string()),
    phone:      v.optional(v.string()),
    familyId:   v.number(),
    familyName: v.string(),
  },
  handler: async (ctx, args) => {
    // Capacity check
    const existing = await ctx.db
      .query("registrations")
      .withIndex("by_family", (q) => q.eq("familyId", args.familyId))
      .collect();

    if (existing.length >= MAX_SLOTS) {
      throw new Error(`${args.familyName} is full. Please choose another family.`);
    }

    // Insert
    const id = await ctx.db.insert("registrations", {
      name:       args.name,
      email:      args.email,
      phone:      args.phone,
      familyId:   args.familyId,
      familyName: args.familyName,
      emailSent:  false,
      smsSent:    false,
    });

    // Fire-and-forget notifications (runs after mutation commits)
    await ctx.scheduler.runAfter(0, internal.notifications.sendNotifications, {
      registrationId: id,
      name:       args.name,
      email:      args.email,
      phone:      args.phone,
      familyName: args.familyName,
    });

    return { success: true };
  },
});
