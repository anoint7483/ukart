const express = require("express");
const router = express.Router();
const {
  addToCart,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} = require("../controllers/cartController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", getCart);
router.post("/items", addToCart);
router.put("/items/:productId", updateCartItem);
router.delete("/items/:productId", removeCartItem);
router.delete("/", clearCart);

module.exports = router;
