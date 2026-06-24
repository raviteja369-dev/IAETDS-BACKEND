import { Router } from 'express';
import { crudFactory } from '../controllers/crudFactory.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { auditAction } from '../middleware/audit.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { Asset } from '../models/Asset.js';

/**
 * Centralized Asset Registry (CMDB).
 * The Assets collection is the single source of truth; every other module
 * references assets by ObjectId (relational key) and reads live data here.
 */
const router = Router();
const ctrl = crudFactory(Asset, {
  searchable: ['name', 'assetTag', 'model', 'ipAddress', 'serialNumber'],
  filterable: ['category', 'status', 'criticality', 'environment'],
});

const REGISTRY_FIELDS =
  'assetTag name category criticality environment ipAddress location os status healthScore';

router.use(authenticate);

// Lightweight registry feed for asset pickers across all modules.
router.get(
  '/options',
  requirePermission('assets:read'),
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) {
      const rx = new RegExp(String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: rx }, { assetTag: rx }, { ipAddress: rx }];
    }
    const assets = await Asset.find(filter)
      .select(REGISTRY_FIELDS)
      .sort('name')
      .limit(500)
      .lean();
    res.json({ success: true, data: assets, meta: { total: assets.length } });
  }),
);

// Resolve a single asset by its human-readable Asset ID (assetTag).
router.get(
  '/lookup/:assetTag',
  requirePermission('assets:read'),
  asyncHandler(async (req, res) => {
    const asset = await Asset.findOne({ assetTag: req.params.assetTag })
      .select(REGISTRY_FIELDS)
      .lean();
    if (!asset) throw ApiError.notFound('Asset not found in registry');
    res.json({ success: true, data: asset });
  }),
);

// Standard CRUD on the registry.
router.get('/', requirePermission('assets:read'), ctrl.list);
router.get('/:id', requirePermission('assets:read'), ctrl.getOne);
router.post('/', requirePermission('assets:write'), auditAction('assets.create'), ctrl.create);
router.patch('/:id', requirePermission('assets:write'), auditAction('assets.update'), ctrl.update);
router.delete('/:id', requirePermission('assets:write'), auditAction('assets.delete'), ctrl.remove);

export default router;
