const express = require("express");
const router = express.Router();
const {
  createProduct,
  deleteProduct,
  getAdminProducts,
  getProduct,
  getProducts,
  updateProduct,
} = require("../controllers/productController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", getProducts);
router.get("/admin", protect, authorize("admin"), getAdminProducts);
router.get("/:id", getProduct);
router.post("/", protect, authorize("admin"), createProduct);
router.put("/:id", protect, authorize("admin"), updateProduct);
router.delete("/:id", protect, authorize("admin"), deleteProduct);

module.exports = router;
