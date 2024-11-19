class ApiResponse {
  statusCode: number;
  status: string;
  data: any;
  message: string;

  constructor(statusCode: number, data: any, message = "Success") {
    this.statusCode = statusCode;
    this.status = statusCode < 400 ? "success" : "fail";
    this.data = data;
    this.message = message;
  }

  static success(data: any, message = "Success", statusCode = 200) {
    return new ApiResponse(statusCode, data, message);
  }

  static error(message = "Error", statusCode = 500) {
    return new ApiResponse(statusCode, null, message);
  }
}

export default ApiResponse;
