import { Router } from 'express';

import authRoutes from './auth.routes.js';
import analyticsRoutes from './analytics.routes.js';
import notificationRoutes from './notification.routes.js';
import auditRoutes from './audit.routes.js';
import { resourceRouter } from './resourceRouter.js';

import { Asset } from '../models/Asset.js';
import { Ticket } from '../models/Ticket.js';
import { Incident } from '../models/Incident.js';
import { SecurityEvent } from '../models/SecurityEvent.js';
import { MaintenanceTask } from '../models/MaintenanceTask.js';
import { Report } from '../models/Report.js';
import { User } from '../models/User.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/audit-logs', auditRoutes);

apiRouter.use(
  '/assets',
  resourceRouter(Asset, 'assets', {
    searchable: ['name', 'assetTag', 'model', 'ipAddress', 'serialNumber'],
    filterable: ['category', 'status', 'criticality', 'environment'],
  }),
);

apiRouter.use(
  '/tickets',
  resourceRouter(Ticket, 'tickets', {
    searchable: ['ticketId', 'subject', 'requesterName', 'assigneeName'],
    filterable: ['status', 'priority', 'category'],
  }),
);

apiRouter.use(
  '/incidents',
  resourceRouter(Incident, 'incidents', {
    searchable: ['incidentId', 'title', 'commanderName'],
    filterable: ['status', 'severity', 'priority', 'category'],
  }),
);

apiRouter.use(
  '/security-events',
  resourceRouter(SecurityEvent, 'security', {
    searchable: ['eventId', 'title', 'sourceIp', 'targetUser'],
    filterable: ['type', 'severity', 'status'],
    sortDefault: '-occurredAt',
  }),
);

apiRouter.use(
  '/maintenance',
  resourceRouter(MaintenanceTask, 'maintenance', {
    searchable: ['workOrderId', 'title', 'assetName', 'assigneeName'],
    filterable: ['type', 'status', 'priority'],
  }),
);

apiRouter.use(
  '/reports',
  resourceRouter(Report, 'reports', {
    searchable: ['reportId', 'name', 'framework'],
    filterable: ['type', 'status', 'format'],
  }),
);

apiRouter.use(
  '/users',
  resourceRouter(User, 'users', {
    searchable: ['name', 'email', 'department', 'title'],
    filterable: ['role', 'status', 'department'],
  }),
);
