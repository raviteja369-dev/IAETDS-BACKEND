import { Router } from 'express';

import authRoutes from './auth.routes.js';
import analyticsRoutes from './analytics.routes.js';
import notificationRoutes from './notification.routes.js';
import auditRoutes from './audit.routes.js';
import assetRoutes from './asset.routes.js';
import { resourceRouter } from './resourceRouter.js';

import { Ticket } from '../models/Ticket.js';
import { Incident } from '../models/Incident.js';
import { SecurityEvent } from '../models/SecurityEvent.js';
import { MaintenanceTask } from '../models/MaintenanceTask.js';
import { Report } from '../models/Report.js';
import { User } from '../models/User.js';

export const apiRouter = Router();

// Centralized Asset Registry (CMDB) — fields denormalized for relational display.
const ASSET_SELECT =
  'assetTag name category criticality environment ipAddress location os status healthScore';

apiRouter.use('/auth', authRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/audit-logs', auditRoutes);

apiRouter.use('/assets', assetRoutes);

apiRouter.use(
  '/tickets',
  resourceRouter(Ticket, 'tickets', {
    searchable: ['ticketId', 'subject', 'requesterName', 'assigneeName'],
    filterable: ['status', 'priority', 'category'],
    populate: { path: 'relatedAsset', select: ASSET_SELECT },
  }),
);

apiRouter.use(
  '/incidents',
  resourceRouter(Incident, 'incidents', {
    searchable: ['incidentId', 'title', 'commanderName'],
    filterable: ['status', 'severity', 'priority', 'category'],
    populate: { path: 'affectedAssets', select: ASSET_SELECT },
  }),
);

apiRouter.use(
  '/security-events',
  resourceRouter(SecurityEvent, 'security', {
    searchable: ['eventId', 'title', 'sourceIp', 'targetUser'],
    filterable: ['type', 'severity', 'status'],
    sortDefault: '-occurredAt',
    populate: { path: 'targetAsset', select: ASSET_SELECT },
  }),
);

apiRouter.use(
  '/maintenance',
  resourceRouter(MaintenanceTask, 'maintenance', {
    searchable: ['workOrderId', 'title', 'assetName', 'assigneeName'],
    filterable: ['type', 'status', 'priority'],
    populate: { path: 'asset', select: ASSET_SELECT },
  }),
);

apiRouter.use(
  '/reports',
  resourceRouter(Report, 'reports', {
    searchable: ['reportId', 'name', 'framework'],
    filterable: ['type', 'status', 'format'],
    populate: { path: 'relatedAssets', select: ASSET_SELECT },
  }),
);

apiRouter.use(
  '/users',
  resourceRouter(User, 'users', {
    searchable: ['name', 'email', 'department', 'title'],
    filterable: ['role', 'status', 'department'],
  }),
);
