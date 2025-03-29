const config = require("../config/config");

class PaginationPlugin {
  constructor(model) {
    this.model = model;
  }

  async paginate(query = {}, options = {}) {
    const {
      page = config.pagination.defaultPage,
      limit = config.pagination.defaultLimit,
      sort = { createdAt: -1 },
      populate = [],
      select = "",
      lean = false,
    } = options;

    const limitValue = Math.min(parseInt(limit), config.pagination.maxLimit);
    const skip = (parseInt(page) - 1) * limitValue;

    let queryBuilder = this.model.find(query);

    if (select) {
      queryBuilder = queryBuilder.select(select);
    }

    if (populate.length > 0) {
      populate.forEach((field) => {
        queryBuilder = queryBuilder.populate(field);
      });
    }

    if (sort) {
      queryBuilder = queryBuilder.sort(sort);
    }

    queryBuilder = queryBuilder.skip(skip).limit(limitValue);

    if (lean) {
      queryBuilder = queryBuilder.lean();
    }

    const [results, total] = await Promise.all([
      queryBuilder.exec(),
      this.model.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitValue);

    return {
      results,
      pagination: {
        page: parseInt(page),
        limit: limitValue,
        total,
        totalPages,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
        nextPage: parseInt(page) < totalPages ? parseInt(page) + 1 : null,
        prevPage: parseInt(page) > 1 ? parseInt(page) - 1 : null,
      },
    };
  }

  static enhanceSchema(schema) {
    schema.statics.paginate = async function (query = {}, options = {}) {
      const paginator = new PaginationPlugin(this);
      return paginator.paginate(query, options);
    };

    return schema;
  }
}

module.exports = PaginationPlugin;
