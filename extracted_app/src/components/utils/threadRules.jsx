import { base44 } from "@/api/base44Client";

/**
 * Check if current user is GC for a project
 */
export function isGCForProject(project, currentUser) {
  if (!project || !currentUser) return false;
  return project.created_by === currentUser.email;
}

/**
 * Check if thread is announcement type
 */
export function isAnnouncementThread(thread) {
  return thread?.thread_type === "announcement";
}

/**
 * Check if thread is direct (unassigned) type
 */
export function isDirectThread(thread) {
  return thread?.thread_type === "direct" && !thread?.project_id;
}

/**
 * Check if thread is project type
 */
export function isProjectThread(thread) {
  return thread?.thread_type === "project" && !!thread?.project_id;
}

/**
 * Find or create direct thread for a trade
 */
export async function findOrCreateDirectThread(tradeProfileId) {
  const existingThreads = await base44.entities.ProjectThread.filter({
    trade_profile_id: tradeProfileId,
    thread_type: "direct",
  });

  const directThread = existingThreads.find(t => !t.project_id);
  if (directThread) {
    return directThread;
  }

  const newThread = await base44.entities.ProjectThread.create({
    project_id: null,
    trade_profile_id: tradeProfileId,
    thread_type: "direct",
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
 * Ensure announcement thread exists for project
 */
export async function ensureAnnouncementThread(projectId) {
  const existingThreads = await base44.entities.ProjectThread.filter({
    project_id: projectId,
    thread_type: "announcement",
  });

  if (existingThreads.length > 0) {
    return existingThreads[0];
  }

  const newThread = await base44.entities.ProjectThread.create({
    project_id: projectId,
    trade_profile_id: null,
    thread_type: "announcement",
    last_message_at: null,
    last_message_preview: "",
    pinned: true,
    archived: false,
    unread_count_gc: 0,
    unread_count_trade: 0,
  });

  return newThread;
}

/**
 * Move direct thread to project
 */
export async function moveThreadToProject(threadId, projectId, tradeProfileId) {
  // Check if project thread already exists
  const existingProjectThreads = await base44.entities.ProjectThread.filter({
    project_id: projectId,
    trade_profile_id: tradeProfileId,
    thread_type: "project",
  });

  if (existingProjectThreads.length > 0) {
    // Project thread exists - reassign all messages
    const existingThread = existingProjectThreads[0];
    const messages = await base44.entities.ProjectMessage.filter({
      thread_id: threadId,
    });

    // Update all messages to point to existing project thread
    for (const message of messages) {
      await base44.entities.ProjectMessage.update(message.id, {
        thread_id: existingThread.id,
      });
    }

    // Delete the direct thread
    await base44.entities.ProjectThread.delete(threadId);

    return existingThread;
  }

  // No existing project thread - convert direct thread
  await base44.entities.ProjectThread.update(threadId, {
    project_id: projectId,
    thread_type: "project",
  });

  const updatedThreads = await base44.entities.ProjectThread.list();
  return updatedThreads.find(t => t.id === threadId);
}