const jwt = require("jsonwebtoken")

const validateToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization

        if (!token) {
            return res.status(401).json({ message: "Access denied. No token provided." })
        }

        if (!token.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Invalid token format. Use Bearer token." })
        }

        const tokenValue = token.split(" ")[1]
        const decodedData = jwt.verify(tokenValue, process.env.JWT_SECRET)
        req.user = decodedData
        next()

    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Session expired. Please log in again." })
        }
        if (err.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid token." })
        }
        res.status(500).json({ message: "Authentication error." })
    }
}

module.exports = validateToken