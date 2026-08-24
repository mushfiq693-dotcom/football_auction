"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
class AppError extends Error {
    statusCode;
    message;
    errors;
    constructor(statusCode, message, errors = []) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.errors = errors;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.AppError = AppError;
function errorHandler(err, _req, res, _next) {
    console.error('💥 Global Error Handler:', err);
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors,
        });
    }
    if (err instanceof zod_1.ZodError) {
        const errorDetails = err.issues
            .map((e) => {
            const field = e.path.filter((p) => p !== 'body').join('.') || 'input';
            return `${field}: ${e.message}`;
        })
            .join(', ');
        return res.status(400).json({
            success: false,
            message: errorDetails ? `Validation failed (${errorDetails})` : 'Validation failed',
            errors: err.issues.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            })),
        });
    }
    return res.status(500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
}
