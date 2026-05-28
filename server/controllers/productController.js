const Product = require("../models/Product");
const mongoose = require("mongoose");

const parseImages = (images) => {
  if (!images) return [];
  if (Array.isArray(images)) return images.map((image) => image.trim()).filter(Boolean);
  return String(images)
    .split("\n")
    .map((image) => image.trim())
    .filter(Boolean);
};

const buildProductPayload = (body) => ({
  name: body.name,
  description: body.description,
  price: Number(body.price),
  discountPrice:
    body.discountPrice === "" || body.discountPrice === undefined || body.discountPrice === null
      ? null
      : Number(body.discountPrice),
  category: body.category,
  brand: body.brand || "",
  images: parseImages(body.images),
  stock: Number(body.stock ?? 0),
  isFeatured: Boolean(body.isFeatured),
  isActive: body.isActive === undefined ? true : Boolean(body.isActive),
});

exports.getProducts = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 48);
    const skip = (page - 1) * limit;

    const filter = { isActive: true };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.featured === "true") filter.isFeatured = true;
    if (req.query.search) filter.$text = { $search: req.query.search };

    const sort =
      req.query.sort === "price_asc"
        ? { price: 1 }
        : req.query.sort === "price_desc"
          ? { price: -1 }
          : { createdAt: -1 };

    const [products, total, categories] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limit),
      Product.countDocuments(filter),
      Product.distinct("category", { isActive: true }),
    ]);

    res.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      categories: categories.sort(),
    });
  } catch (err) {
    console.error("Get products error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const lookup = mongoose.isValidObjectId(req.params.id)
      ? { $or: [{ _id: req.params.id }, { slug: req.params.id }] }
      : { slug: req.params.id };

    const product = await Product.findOne({ ...lookup, isActive: true });

    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ product });
  } catch (err) {
    res.status(404).json({ message: "Product not found" });
  }
};

exports.getAdminProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ products });
  } catch (err) {
    console.error("Get admin products error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create({
      ...buildProductPayload(req.body),
      createdBy: req.user.id,
    });

    res.status(201).json({ message: "Product created successfully", product });
  } catch (err) {
    console.error("Create product error:", err);
    res.status(400).json({ message: err.message || "Failed to create product" });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    Object.assign(product, buildProductPayload(req.body));
    await product.save();

    res.json({ message: "Product updated successfully", product });
  } catch (err) {
    console.error("Update product error:", err);
    res.status(400).json({ message: err.message || "Failed to update product" });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    await product.deleteOne();
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Delete product error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
