import { base44 } from "@/api/base44Client";

/**
 * Find or create a thread for a given project and trade profile
 */
export async function findOrCreateThread(projectId, tradeProfileId) {
  // Try to find existing thread
  const existingThreads = await base44.entities.ProjectThread.filter({
    project_id: projectId,
    trade_profile_id: tradeProfileId,
  });

  if (existingThreads.length > 0) {
    return existingThreads[0];
  }

  // Create new thread
  const newThread = await base44.entities.ProjectThread.create({
    project_id: projectId,
    trade_profile_id: tradeProfileId,
    last_message_at: null,
    last_message_preview: "",
    pinned: false,
    archived: false,
    unread_count_gc: 0,
    unread_count_trade: 0,
  });

  return newThread;
}

/**
 * Ensure project-trade link exists
 */
export async function ensureProjectTradeLink(projectId, tradeProfileId, addedBy) {
  // Check if link already exists
  const existingLinks = await base44.entities.ProjectTradeLink.filter({
    project_id: projectId,
    trade_profile_id: tradeProfileId,
  });

  if (existingLinks.length > 0) {
    return existingLinks[0];
  }

  // Create new link
  const newLink = await base44.entities.ProjectTradeLink.create({
    project_id: projectId,
    trade_profile_id: tradeProfileId,
    added_by: addedBy,
  });

  return newLink;
}

/**
 * Send a message and update thread
 */
export async function sendMessage(threadId, senderRole, senderId, body) {
  // Create message
  const message = await base44.entities.ProjectMessage.create({
    thread_id: threadId,
    sender_role: senderRole,
    sender_id: senderId,
    body,
  });

  // Get thread
  const thread = await base44.entities.ProjectThread.list();
  const currentThread = thread.find((t) => t.id === threadId);

  if (currentThread) {
    // Update thread
    const updateData = {
      last_message_at: new Date().toISOString(),
      last_message_preview: body.substring(0, 100),
    };

    // Increment unread count for the opposite party
    if (senderRole === "gc") {
      updateData.unread_count_trade = (currentThread.unread_count_trade || 0) + 1;
    } else {
      updateData.unread_count_gc = (currentThread.unread_count_gc || 0) + 1;
    }

    await base44.entities.ProjectThread.update(threadId, updateData);
  }

  return message;
}

/**
 * Mark thread as read for GC
 */
export async function markThreadAsRead(threadId) {
  await base44.entities.ProjectThread.update(threadId, {
    unread_count_gc: 0,
  });
}

/**
 * Toggle thread pinned status
 */
export async function toggleThreadPinned(threadId, currentPinned) {
  await base44.entities.ProjectThread.update(threadId, {
    pinned: !currentPinned,
  });
}

/**
 * Toggle thread archived status
 */
export async function toggleThreadArchived(threadId, currentArchived) {
  await base44.entities.ProjectThread.update(threadId, {
    archived: !currentArchived,
  });
}

/**
 * Get display name for a trade profile
 */
export function getTradeDisplayName(profile) {
  if (!profile) return "Trade";
  return profile.company_name?.trim() || 
         profile.owner_name?.trim() || 
         profile.phone?.trim() || 
         "Trade";
}