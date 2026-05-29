const Cart = require("../models/Cart");
const Product = require("../models/Product");

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
};

const populateCart = (cart) =>
  cart.populate({
    path: "items.product",
    select: "name slug price discountPrice images stock isActive category brand",
  });

const buildCartResponse = (cart) => {
  const items = cart.items
    .filter((item) => item.product && item.product.isActive)
    .map((item) => {
      const product = item.product;
      const unitPrice = product.discountPrice || product.price;
      const quantity = item.quantity;

      return {
        product,
        quantity,
        unitPrice,
        lineTotal: unitPrice * quantity,
      };
    });

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    _id: cart._id,
    items,
    subtotal,
    totalItems,
  };
};

exports.getCart = async (req, res) => {
  try {
    const cart = await populateCart(await getOrCreateCart(req.user.id));
    res.json({ cart: buildCartResponse(cart) });
  } catch (err) {
    console.error("Get cart error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const requestedQuantity = Math.max(Number(quantity) || 1, 1);

    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (product.stock <= 0) return res.status(400).json({ message: "Product is out of stock" });

    const cart = await getOrCreateCart(req.user.id);
    const existingItem = cart.items.find((item) => item.product.toString() === productId);
    const currentQuantity = existingItem ? existingItem.quantity : 0;
    const nextQuantity = currentQuantity + requestedQuantity;

    if (nextQuantity > product.stock) {
      return res.status(400).json({ message: `Only ${product.stock} item(s) available` });
    }

    if (existingItem) {
      existingItem.quantity = nextQuantity;
    } else {
      cart.items.push({ product: product._id, quantity: requestedQuantity });
    }

    await cart.save();
    await populateCart(cart);

    res.status(201).json({ message: "Added to cart", cart: buildCartResponse(cart) });
  } catch (err) {
    console.error("Add to cart error:", err);
    res.status(400).json({ message: err.message || "Unable to add item to cart" });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const quantity = Number(req.body.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const cart = await getOrCreateCart(req.user.id);
    const item = cart.items.find((cartItem) => cartItem.product.toString() === req.params.productId);
    if (!item) return res.status(404).json({ message: "Item not found in cart" });

    const product = await Product.findById(req.params.productId);
    if (!product || !product.isActive) return res.status(404).json({ message: "Product not found" });
    if (quantity > product.stock) {
      return res.status(400).json({ message: `Only ${product.stock} item(s) available` });
    }

    item.quantity = quantity;
    await cart.save();
    await populateCart(cart);

    res.json({ message: "Cart updated", cart: buildCartResponse(cart) });
  } catch (err) {
    console.error("Update cart item error:", err);
    res.status(400).json({ message: err.message || "Unable to update cart" });
  }
};

exports.removeCartItem = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    cart.items = cart.items.filter((item) => item.product.toString() !== req.params.productId);
    await cart.save();
    await populateCart(cart);

    res.json({ message: "Item removed", cart: buildCartResponse(cart) });
  } catch (err) {
    console.error("Remove cart item error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    cart.items = [];
    await cart.save();

    res.json({ message: "Cart cleared", cart: buildCartResponse(cart) });
  } catch (err) {
    console.error("Clear cart error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
