import express from 'express';
import {
    createGroup,
    getGroup,
    groupExists,
    addMember,
    updateLocation,
    getGroupLocations,
    deleteGroup
} from '../models/store.js';


const router = express.Router();

// POST /api/groups - Create a new group
router.post('/groups', (req, res) => {
    try {
        const { name, refreshInterval, expiryDuration } = req.body;

        const group = createGroup(name, refreshInterval, expiryDuration);

        res.status(201).json({
            success: true,
            group: {
                id: group.id,
                name: group.name,
                refreshInterval: group.refreshInterval,
                expiresAt: group.expiresAt
            }
        });
    } catch (error) {
        console.error('[API] Error creating group:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create group'
        });
    }
});

// POST /api/groups/:groupId/join - Join an existing group
router.post('/groups/:groupId/join', (req, res) => {
    try {
        const { groupId } = req.params;
        const { memberId, displayName } = req.body;

        // Validation
        if (!memberId || !displayName) {
            return res.status(400).json({
                success: false,
                error: 'memberId and displayName are required'
            });
        }

        if (!groupExists(groupId)) {
            return res.status(404).json({
                success: false,
                error: 'Group not found. Please check the group ID and try again.'
            });
        }

        const member = addMember(groupId, memberId, displayName);
        const group = getGroup(groupId);

        res.status(200).json({
            success: true,
            member: {
                id: member.id,
                displayName: member.displayName,
                groupId: member.groupId
            },
            group: {
                id: group.id,
                name: group.name,
                refreshInterval: group.refreshInterval,
                expiresAt: group.expiresAt
            }
        });
    } catch (error) {
        console.error('[API] Error joining group:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to join group'
        });
    }
});

// POST /api/groups/:groupId/locations - Update member location
router.post('/groups/:groupId/locations', (req, res) => {
    try {
        const { groupId } = req.params;
        const { memberId, lat, lng, sharingEnabled } = req.body;

        // Validation
        if (!memberId || lat === undefined || lng === undefined) {
            return res.status(400).json({
                success: false,
                error: 'memberId, lat, and lng are required'
            });
        }

        if (typeof lat !== 'number' || typeof lng !== 'number') {
            return res.status(400).json({
                success: false,
                error: 'lat and lng must be numbers'
            });
        }

        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return res.status(400).json({
                success: false,
                error: 'Invalid coordinates'
            });
        }

        const location = updateLocation(memberId, groupId, lat, lng, sharingEnabled !== undefined ? sharingEnabled : true);

        if (!location) {
            return res.status(404).json({
                success: false,
                error: 'Member not found in this group'
            });
        }

        res.status(200).json({
            success: true,
            location: {
                memberId: location.memberId,
                lat: location.lat,
                lng: location.lng,
                sharingEnabled: location.sharingEnabled,
                updatedAt: location.updatedAt
            }
        });
    } catch (error) {
        console.error('[API] Error updating location:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update location'
        });
    }
});

// GET /api/groups/:groupId/locations - Get all member locations in a group
router.get('/groups/:groupId/locations', (req, res) => {
    try {
        const { groupId } = req.params;

        if (!groupExists(groupId)) {
            return res.status(404).json({
                success: false,
                error: 'Group not found'
            });
        }

        const locations = getGroupLocations(groupId);

        res.status(200).json({
            success: true,
            locations
        });
    } catch (error) {
        console.error('[API] Error fetching locations:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch locations'
        });
    }
});

// DELETE /api/groups/:groupId - Delete a group
router.delete('/groups/:groupId', (req, res) => {
    try {
        const { groupId } = req.params;

        if (!groupExists(groupId)) {
            return res.status(404).json({
                success: false,
                error: 'Group not found'
            });
        }

        const deleted = deleteGroup(groupId);

        if (deleted) {
            res.status(200).json({
                success: true,
                message: 'Group deleted successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to delete group'
            });
        }
    } catch (error) {
        console.error('[API] Error deleting group:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete group'
        });
    }
});

export default router;

