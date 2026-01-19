import { base44 } from "@/api/base44Client";

/**
 * Check if user is GC for a project
 */
export function isGCForProject(project, user) {
  if (!project || !user) return false;
  return project.created_by === user.email;
}

/**
 * Mark announcements as read for a trade
 */
export async function markAnnouncementsRead(projectId, tradeProfileId) {
  if (!projectId || !tradeProfileId) return;

  // Get all unread receipts for this trade in this project
  const receipts = await base44.entities.ProjectAnnouncementReceipt.filter({
    project_id: projectId,
    trade_profile_id: tradeProfileId,
  });

  const unreadReceipts = receipts.filter((r) => !r.read_at);

  // Mark them as read
  for (const receipt of unreadReceipts) {
    await base44.entities.ProjectAnnouncementReceipt.update(receipt.id, {
      read_at: new Date().toISOString(),
    });
  }
}

/**
 * Create announcement and deliver to all trades
 */
export async function createAnnouncementForProject(projectId, userId, profileId, body) {
  // Create announcement
  const announcement = await base44.entities.ProjectAnnouncement.create({
    project_id: projectId,
    created_by_user_id: userId,
    created_by_profile_id: profileId,
    body,
    pinned: true,
  });

  // Get all trades linked to this project
  const tradeLinks = await base44.entities.ProjectTradeLink.filter({
    project_id: projectId,
  });

  // Create receipts for all trades
  for (const link of tradeLinks) {
    await base44.entities.ProjectAnnouncementReceipt.create({
      announcement_id: announcement.id,
      project_id: projectId,
      trade_profile_id: link.contact_id,
      read_at: null,
    });
  }

  return announcement;
}

/**
 * Get unread announcement count for a trade in a project
 */
export async function getUnreadAnnouncementCount(projectId, tradeProfileId) {
  if (!projectId || !tradeProfileId) return 0;

  const receipts = await base44.entities.ProjectAnnouncementReceipt.filter({
    project_id: projectId,
    trade_profile_id: tradeProfileId,
  });

  return receipts.filter((r) => !r.read_at).length;
}