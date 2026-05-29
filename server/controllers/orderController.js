const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");

const populateCart = (cart) =>
  cart.populate({
    path: "items.product",
    select: "name price discountPrice images stock isActive",
  });

const calculateOrderTotals = (items) => {
  const itemsTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = itemsTotal >= 999 ? 0 : 79;
  const tax = 0;

  return {
    itemsTotal,
    shippingFee,
    tax,
    grandTotal: itemsTotal + shippingFee + tax,
  };
};

exports.placeOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod = "cod" } = req.body;
    if (!shippingAddress) return res.status(400).json({ message: "Shipping address is required" });

    const cart = await populateCart(await Cart.findOne({ user: req.user.id }));
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const orderItems = [];

    for (const item of cart.items) {
      const product = item.product;
      if (!product || !product.isActive) {
        return res.status(400).json({ message: "A product in your cart is no longer available" });
      }
      if (item.quantity > product.stock) {
        return res.status(400).json({ message: `Only ${product.stock} ${product.name} item(s) available` });
      }

      const price = product.discountPrice || product.price;
      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.images?.[0] || "",
        price,
        quantity: item.quantity,
      });
    }

    const totals = calculateOrderTotals(orderItems);
    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      ...totals,
    });

    await Promise.all(
      orderItems.map((item) =>
        Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } })
      )
    );

    cart.items = [];
    await cart.save();

    res.status(201).json({ message: "Order placed successfully", order });
  } catch (err) {
    console.error("Place order error:", err);
    res.status(400).json({ message: err.message || "Unable to place order" });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    console.error("Get my orders error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== "admin") query.user = req.user.id;

    const order = await Order.findOne(query);
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json({ order });
  } catch (err) {
    res.status(404).json({ message: "Order not found" });
  }
};

exports.getAdminOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    console.error("Get admin orders error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;
    const allowed = ["placed", "processing", "shipped", "delivered", "cancelled"];
    if (!allowed.includes(orderStatus)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.orderStatus = orderStatus;
    if (orderStatus === "delivered") order.paymentStatus = "paid";
    await order.save();

    res.json({ message: "Order status updated", order });
  } catch (err) {
    console.error("Update order status error:", err);
    res.status(400).json({ message: err.message || "Unable to update order" });
  }
};
