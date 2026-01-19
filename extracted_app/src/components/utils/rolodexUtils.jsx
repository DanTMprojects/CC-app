import { base44 } from "@/api/base44Client";

/**
 * Ensure a rolodex link exists between GC and trade
 */
export async function ensureRolodexLink(gcProfileId, tradeProfileId, source = "invite") {
  if (!gcProfileId || !tradeProfileId) return null;

  // Check if link already exists
  const existingLinks = await base44.entities.RolodexLink.filter({
    gc_profile_id: gcProfileId,
    trade_profile_id: tradeProfileId,
  });

  if (existingLinks.length > 0) {
    return existingLinks[0];
  }

  // Create new link
  const newLink = await base44.entities.RolodexLink.create({
    gc_profile_id: gcProfileId,
    trade_profile_id: tradeProfileId,
    source,
  });

  return newLink;
}

/**
 * Get all trades linked to a GC
 */
export async function getLinkedTrades(gcProfileId) {
  if (!gcProfileId) return [];

  const links = await base44.entities.RolodexLink.filter({
    gc_profile_id: gcProfileId,
  });

  if (links.length === 0) return [];

  // Get all trade profiles
  const allProfiles = await base44.entities.Profile.list();
  const linkedTradeIds = links.map((link) => link.trade_profile_id);

  return allProfiles.filter(
    (profile) => profile.role === "trade" && linkedTradeIds.includes(profile.id)
  );
}