import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Generic, paginated CRUD controller factory for Mongoose models.
 *
 * options:
 *  - searchable: array of fields used for `?search=` regex matching
 *  - filterable: array of fields directly filterable via query params
 *  - sortDefault: default sort (e.g. '-createdAt')
 *  - populate: mongoose populate spec
 */
export function crudFactory(Model, options = {}) {
  const {
    searchable = [],
    filterable = [],
    sortDefault = '-createdAt',
    populate = null,
  } = options;

  const list = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const filter = {};
    for (const field of filterable) {
      if (req.query[field] !== undefined && req.query[field] !== '' && req.query[field] !== 'all') {
        filter[field] = req.query[field];
      }
    }
    if (req.query.search && searchable.length) {
      const rx = new RegExp(escapeRegex(req.query.search), 'i');
      filter.$or = searchable.map((f) => ({ [f]: rx }));
    }

    const sort = req.query.sort || sortDefault;

    let query = Model.find(filter).sort(sort).skip(skip).limit(limit);
    if (populate) query = query.populate(populate);

    const [items, total] = await Promise.all([
      query.lean(),
      Model.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  });

  const getOne = asyncHandler(async (req, res) => {
    let query = Model.findById(req.params.id);
    if (populate) query = query.populate(populate);
    const item = await query.lean();
    if (!item) throw ApiError.notFound(`${Model.modelName} not found`);
    res.json({ success: true, data: item });
  });

  const create = asyncHandler(async (req, res) => {
    const item = await Model.create(req.body);
    res.status(201).json({ success: true, data: item });
  });

  const update = asyncHandler(async (req, res) => {
    const item = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) throw ApiError.notFound(`${Model.modelName} not found`);
    res.json({ success: true, data: item });
  });

  const remove = asyncHandler(async (req, res) => {
    const item = await Model.findByIdAndDelete(req.params.id);
    if (!item) throw ApiError.notFound(`${Model.modelName} not found`);
    res.json({ success: true, data: { id: req.params.id } });
  });

  return { list, getOne, create, update, remove };
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
