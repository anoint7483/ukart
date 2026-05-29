const express = require("express");
const router = express.Router();
const {
  getAdminOrders,
  getMyOrders,
  getOrder,
  placeOrder,
  updateOrderStatus,
} = require("../controllers/orderController");
const { authorize, protect } = require("../middleware/authMiddleware");

router.use(protect);

router.post("/", placeOrder);
router.get("/mine", getMyOrders);
router.get("/admin", authorize("admin"), getAdminOrders);
router.get("/:id", getOrder);
router.put("/:id/status", authorize("admin"), updateOrderStatus);

module.exports = router;
