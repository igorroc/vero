"use server";

import prisma from "@/lib/db";
import { getUserBySession } from "@/lib/auth";

export type DeleteEventResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Delete a single event
 */
export async function deleteEvent(eventId: string): Promise<DeleteEventResult> {
  try {
    const user = await getUserBySession();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify ownership
    const existing = await prisma.event.findFirst({
      where: {
        id: eventId,
        userId: user.id,
      },
    });

    if (!existing) {
      return { success: false, error: "Event not found" };
    }

    await prisma.event.delete({
      where: { id: eventId },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete event:", error);
    return { success: false, error: "Failed to delete event" };
  }
}

/**
 * Delete a recurrence template and optionally all its instances
 */
export async function deleteRecurrence(
  templateId: string,
  deleteInstances: boolean = false
): Promise<DeleteEventResult> {
  try {
    const user = await getUserBySession();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify ownership and that it's a template
    const template = await prisma.event.findFirst({
      where: {
        id: templateId,
        userId: user.id,
        isRecurrenceTemplate: true,
      },
    });

    if (!template) {
      return { success: false, error: "Recurrence template not found" };
    }

    if (deleteInstances) {
      // Delete all instances linked to this template
      await prisma.event.deleteMany({
        where: {
          recurrenceId: templateId,
          userId: user.id,
        },
      });
    } else {
      // Just unlink instances from template
      await prisma.event.updateMany({
        where: {
          recurrenceId: templateId,
          userId: user.id,
        },
        data: {
          recurrenceId: null,
        },
      });
    }

    // Delete the template itself
    await prisma.event.delete({
      where: { id: templateId },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete recurrence:", error);
    return { success: false, error: "Failed to delete recurrence" };
  }
}
