class ApiResponse {
  constructor(statusCode, message, data = null, meta = {}) {
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("2") ? "success" : "error";
    this.message = message;
    this.data = data;
    this.meta = meta;
  }

  send(res) {
    return res.status(this.statusCode).json({
      status: this.status,
      message: this.message,
      ...(this.data !== null && { data: this.data }),
      ...(Object.keys(this.meta).length > 0 && { meta: this.meta }),
    });
  }

  static success(res, message = "Success", data = null, meta = {}) {
    return new ApiResponse(200, message, data, meta).send(res);
  }

  static created(
    res,
    message = "Resource created successfully",
    data = null,
    meta = {}
  ) {
    return new ApiResponse(201, message, data, meta).send(res);
  }

  static noContent(res) {
    return res.status(204).end();
  }

  static notModified(res) {
    return res.status(304).end();
  }

  static withPagination(res, message, data, pagination) {
    return ApiResponse.success(res, message, data, { pagination });
  }
}

module.exports = ApiResponse;
