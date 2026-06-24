import { asyncHandler } from '../utils/asyncHandler.js';
import { hasPermission } from '../config/rbac.js';
import { Asset } from '../models/Asset.js';
import { Incident } from '../models/Incident.js';
import { MaintenanceTask } from '../models/MaintenanceTask.js';
import { User } from '../models/User.js';
import { Report } from '../models/Report.js';

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Builds a fuzzy filter: every whitespace-separated token must match (AND),
 * and each token may match any of the searchable fields (OR). This allows
 * multi-term queries like "db prod 01" to match across fields.
 */
function buildFuzzyFilter(q, fields) {
  const tokens = String(q).trim().split(/\s+/).filter(Boolean).slice(0, 6);
  if (!tokens.length) return null;
  return {
    $and: tokens.map((token) => {
      const rx = new RegExp(escapeRegex(token), 'i');
      return { $or: fields.map((field) => ({ [field]: rx })) };
    }),
  };
}

/**
 * Registry of searchable collections. Each source declares the permission a
 * user must hold, the fields to match, and how to project a document into a
 * uniform search result (type, title, subtitle, href).
 */
const SOURCES = [
  {
    type: 'asset',
    permission: 'assets:read',
    model: Asset,
    fields: ['name', 'assetTag', 'model', 'ipAddress', 'serialNumber', 'category', 'location'],
    select: 'name assetTag category criticality ipAddress status',
    href: '/assets',
    map: (d) => ({
      label: d.name,
      identifier: d.assetTag,
      subtitle: [d.assetTag, d.category, d.ipAddress].filter(Boolean).join(' · '),
      meta: d.criticality,
    }),
  },
  {
    type: 'incident',
    permission: 'incidents:read',
    model: Incident,
    fields: ['incidentId', 'title', 'commanderName', 'category'],
    select: 'incidentId title severity status commanderName',
    href: '/incidents',
    map: (d) => ({
      label: d.title,
      identifier: d.incidentId,
      subtitle: [d.incidentId, d.commanderName].filter(Boolean).join(' · '),
      meta: d.severity,
    }),
  },
  {
    type: 'maintenance',
    permission: 'maintenance:read',
    model: MaintenanceTask,
    fields: ['workOrderId', 'title', 'assetName', 'assigneeName', 'type'],
    select: 'workOrderId title type status assetName assigneeName',
    href: '/maintenance',
    map: (d) => ({
      label: d.title,
      identifier: d.workOrderId,
      subtitle: [d.workOrderId, d.assetName].filter(Boolean).join(' · '),
      meta: d.status,
    }),
  },
  {
    type: 'user',
    permission: 'users:read',
    model: User,
    fields: ['name', 'email', 'department', 'title'],
    select: 'name email role department title',
    href: '/users',
    map: (d) => ({
      label: d.name,
      identifier: d.email,
      subtitle: [d.title || d.department, d.email].filter(Boolean).join(' · '),
      meta: d.role,
    }),
  },
  {
    type: 'report',
    permission: 'reports:read',
    model: Report,
    fields: ['reportId', 'name', 'framework', 'type'],
    select: 'reportId name type status framework',
    href: '/reports',
    map: (d) => ({
      label: d.name,
      identifier: d.reportId,
      subtitle: [d.reportId, d.framework || d.type].filter(Boolean).join(' · '),
      meta: d.type,
    }),
  },
];

/**
 * GET /api/search?q=...&limit=5
 * Global, permission-aware, fuzzy search across the core collections.
 */
export const globalSearch = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  const perType = Math.min(10, Math.max(1, parseInt(req.query.limit || '5', 10)));

  if (q.length < 1) {
    return res.json({ success: true, data: [], meta: { query: q, total: 0 } });
  }

  const allowed = SOURCES.filter((s) => hasPermission(req.user.role, s.permission));

  const settled = await Promise.all(
    allowed.map(async (source) => {
      const filter = buildFuzzyFilter(q, source.fields);
      if (!filter) return [];
      const docs = await source.model
        .find(filter)
        .select(source.select)
        .limit(perType)
        .lean();
      return docs.map((doc) => {
        const projected = source.map(doc);
        return {
          id: String(doc._id),
          type: source.type,
          href: source.href,
          ...projected,
        };
      });
    }),
  );

  const data = settled.flat();
  res.json({
    success: true,
    data,
    meta: { query: q, total: data.length },
  });
});
