const router = require("express").Router()
const propertyController = require("../controllers/PropertyController")
const validateToken = require("../middlewares/AuthMiddleware")
const { checkRole } = require("../middlewares/RoleMiddleware")
const upload = require("../middlewares/UploadMiddleware")

// Add a property (Hosts and Admins only) - accepts up to 5 images
router.post("/", validateToken, checkRole(["Host", "Admin"]), upload.array("images", 5), propertyController.addProperty)

// Get all properties (with filters) - Public
router.get("/", propertyController.getAllProperties)

// Get property by ID - Public
router.get("/:id", propertyController.getPropertyById)

// Update a property (Hosts and Admins only) - accepts up to 5 new images
router.put("/:id", validateToken, checkRole(["Host", "Admin"]), upload.array("images", 5), propertyController.updateProperty)

// Delete a property (Hosts and Admins only)
router.delete("/:id", validateToken, checkRole(["Host", "Admin"]), propertyController.deleteProperty)

module.exports = router
