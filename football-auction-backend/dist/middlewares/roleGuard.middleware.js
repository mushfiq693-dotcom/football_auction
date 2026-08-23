"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleGuard = roleGuard;
const errorHandler_middleware_1 = require("./errorHandler.middleware");
function roleGuard(...allowedRoles) {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new errorHandler_middleware_1.AppError(401, 'Unauthorized: User authentication required'));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(new errorHandler_middleware_1.AppError(403, `Forbidden: User role '${req.user.role}' is not authorized for this resource`));
        }
        next();
    };
}
