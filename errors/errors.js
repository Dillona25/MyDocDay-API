export class AppError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status || 500;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 400 Error
export class BadRequestError extends AppError {
  constructor(message = "The request could not be processed. Please check your input and try again.") {
    super(message, 400);
  }
}

// 401 - not authorized error
export class UnauthorizedError extends AppError {
  constructor(message = "You must be logged in to access this resource.") {
    super(message, 401);
  }
}

// 403 - Valid creds but not permitted
export class ForbiddenError extends AppError {
  constructor(message = "You don’t have permission to perform this action.") {
    super(message, 403);
  }
}

// 404 - Not found
export class NotFoundError extends AppError {
  constructor(message = "Resources not found") {
    super(message, 404);
  }
}

// 409 - conflict error
export class ConflictError extends AppError {
  constructor(message = "This action could not be completed due to a conflict. The record may already exist.") {
    super(message, 409);
  }
}

// 500 — Internal server issue (fallback)
export class InternalServerError extends AppError {
  constructor(message = "Something went wrong on our end. Please try again later.") {
    super(message, 500);
  }
}

// 503 — External service down or DB offline
export class ServiceUnavailableError extends AppError {
  constructor(message = "Our service is temporarily unavailable. Please try again in a few minutes.") {
    super(message, 503);
  }
}
