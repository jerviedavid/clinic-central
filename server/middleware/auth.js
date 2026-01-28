import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Middleware to require authentication
 * Verifies JWT from cookie or Authorization header
 * Attaches user info to req.user
 */
export function requireAuth(req, res, next) {
    try {
        // Try to get token from cookie first (web)
        let token = req.cookies.token;

        // If not in cookie, try Authorization header (mobile)
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        // Verify and decode token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Attach user info to request
        req.user = {
            userId: decoded.userId,
            clinicId: decoded.clinicId,
            roles: decoded.roles || []
        };

        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}

/**
 * Middleware to require specific roles
 * Must be used after requireAuth
 * @param {string[]} allowedRoles - Array of role names (e.g., ['DOCTOR', 'ADMIN'])
 */
export function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !req.user.roles) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        // Check if user has any of the allowed roles
        const hasRole = req.user.roles.some(role => allowedRoles.includes(role));

        if (!hasRole) {
            return res.status(403).json({
                message: 'Insufficient permissions',
                required: allowedRoles,
                current: req.user.roles
            });
        }

        next();
    };
}

/**
 * Middleware to require Super Admin role
 * Must be used after requireAuth
 */
export function requireSuperAdmin(req, res, next) {
    if (!req.user || !req.user.roles) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    if (!req.user.roles.includes('SUPER_ADMIN')) {
        return res.status(403).json({
            message: 'Super Admin access required',
            current: req.user.roles
        });
    }

    next();
}

/**
 * Middleware to require clinic access
 * Must be used after requireAuth
 * Verifies user has access to the clinic in the JWT
 */
export function requireClinicAccess(req, res, next) {
    if (!req.user || !req.user.clinicId) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    // The clinicId in the JWT represents the user's current working clinic
    // This middleware ensures they have a valid clinic context
    // Additional validation can be added here if needed

    next();
}
