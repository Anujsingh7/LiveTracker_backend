// In-memory data store for groups, members, and locations

const groups = new Map(); // groupId -> { id, name, createdAt, refreshInterval }
const members = new Map(); // memberId -> { id, groupId, displayName, createdAt }
const locations = new Map(); // memberId -> { memberId, groupId, lat, lng, updatedAt }

// Generate a unique 6-8 character alphanumeric group ID
export function generateGroupId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const length = 6;
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Check for collision (very unlikely but good practice)
  if (groups.has(id)) {
    return generateGroupId();
  }
  return id;
}

// Group operations
export function createGroup(name, refreshInterval = 30, expiryDuration = null) {
  const id = generateGroupId();
  const group = {
    id,
    name: name || `Group ${id}`,
    createdAt: new Date().toISOString(),
    expiresAt: expiryDuration ? new Date(Date.now() + expiryDuration * 60 * 60 * 1000).toISOString() : null,
    refreshInterval
  };
  groups.set(id, group);
  console.log(`[STORE] Created group: ${id} (${group.name})${expiryDuration ? ` - Expires in ${expiryDuration}h` : ''}`);
  return group;
}

export function getGroup(groupId) {
  return groups.get(groupId);
}

export function groupExists(groupId) {
  return groups.has(groupId);
}

// Member operations
export function addMember(groupId, memberId, displayName) {
  if (!groupExists(groupId)) {
    return null;
  }
  const member = {
    id: memberId,
    groupId,
    displayName,
    createdAt: new Date().toISOString()
  };
  members.set(memberId, member);
  console.log(`[STORE] Member ${displayName} (${memberId}) joined group ${groupId}`);
  return member;
}

export function getMember(memberId) {
  return members.get(memberId);
}

export function getGroupMembers(groupId) {
  const groupMembers = [];
  for (const member of members.values()) {
    if (member.groupId === groupId) {
      groupMembers.push(member);
    }
  }
  return groupMembers;
}

// Location operations
export function updateLocation(memberId, groupId, lat, lng, sharingEnabled = true) {
  const member = getMember(memberId);
  if (!member || member.groupId !== groupId) {
    return null;
  }

  // Get existing location to preserve the original timestamp
  const existingLocation = locations.get(memberId);

  const location = {
    memberId,
    groupId,
    lat,
    lng,
    sharingEnabled,
    // Preserve the original timestamp if location exists, otherwise set new timestamp
    updatedAt: existingLocation ? existingLocation.updatedAt : new Date().toISOString()
  };
  locations.set(memberId, location);
  console.log(`[STORE] Updated location for ${member.displayName}: (${lat}, ${lng}) [Sharing: ${sharingEnabled}]`);
  return location;
}

export function getGroupLocations(groupId) {
  const groupLocations = [];
  for (const location of locations.values()) {
    if (location.groupId === groupId) {
      const member = getMember(location.memberId);
      groupLocations.push({
        ...location,
        displayName: member ? member.displayName : 'Unknown',
        sharingEnabled: location.sharingEnabled !== undefined ? location.sharingEnabled : true
      });
    }
  }
  return groupLocations;
}

// Delete group and all associated data
export function deleteGroup(groupId) {
  if (!groupExists(groupId)) {
    return false;
  }

  // Delete all members in the group
  const groupMembers = getGroupMembers(groupId);
  for (const member of groupMembers) {
    members.delete(member.id);
    locations.delete(member.id);
  }

  // Delete the group itself
  groups.delete(groupId);
  console.log(`[STORE] Deleted group ${groupId} and ${groupMembers.length} members`);
  return true;
}

// Cleanup inactive members (optional - can be called periodically)
export function cleanupInactiveMembers(inactiveThresholdMs = 5 * 60 * 1000) {
  const now = Date.now();
  let cleaned = 0;

  for (const [memberId, location] of locations.entries()) {
    const lastUpdate = new Date(location.updatedAt).getTime();
    if (now - lastUpdate > inactiveThresholdMs) {
      locations.delete(memberId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[STORE] Cleaned up ${cleaned} inactive member locations`);
  }
  return cleaned;
}

// Cleanup expired groups
export function cleanupExpiredGroups() {
  const now = new Date();
  let cleaned = 0;

  for (const [groupId, group] of groups.entries()) {
    if (group.expiresAt && new Date(group.expiresAt) < now) {
      deleteGroup(groupId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[STORE] Cleaned up ${cleaned} expired groups`);
  }
  return cleaned;
}

