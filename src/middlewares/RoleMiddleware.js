/**
 * Middleware to check if the authenticated user has one of the required roles.
 * Must be used AFTER AuthMiddleware (validateToken).
 * 
 * @param {Array<String>} allowedRoles - Array of roles allowed to access the route e.g., ["Admin", "Host"]
 */
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        try {
            // req.user should be populated by AuthMiddleware
            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized - User details not found" })
            }

            // Check if the user's role is in the list of allowed roles
            if (allowedRoles.includes(req.user.role)) {
                next()
            } else {
                return res.status(403).json({ 
                    message: "Forbidden - You do not have permission to access this resource" 
                })
            }
        } catch (err) {
            console.error("Role Check Error:", err)
            res.status(500).json({ message: "Internal server error during role validation" })
        }
    }
}

module.exports = {
    checkRole
}
