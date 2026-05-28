import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiEdit3, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import api from "../api/api";
import "../styles/products.css";

const emptyForm = {
  name: "",
  brand: "",
  category: "",
  description: "",
  price: "",
  discountPrice: "",
  stock: "",
  images: "",
  isFeatured: false,
  isActive: true,
};

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/products/admin");
      setProducts(res.data.products || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load admin products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await api.get("/products/admin");
        setProducts(res.data.products || []);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load admin products");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const updateField = (event) => {
    const { name, type, checked, value } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleEdit = (product) => {
    setEditingId(product._id);
    setForm({
      name: product.name || "",
      brand: product.brand || "",
      category: product.category || "",
      description: product.description || "",
      price: product.price ?? "",
      discountPrice: product.discountPrice ?? "",
      stock: product.stock ?? "",
      images: (product.images || []).join("\n"),
      isFeatured: Boolean(product.isFeatured),
      isActive: Boolean(product.isActive),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, form);
        setMessage("Product updated successfully.");
      } else {
        await api.post("/products", form);
        setMessage("Product created successfully.");
      }
      resetForm();
      await fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId) => {
    const confirmed = window.confirm("Delete this product?");
    if (!confirmed) return;

    try {
      await api.delete(`/products/${productId}`);
      setProducts((current) => current.filter((product) => product._id !== productId));
      setMessage("Product deleted successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete product");
    }
  };

  return (
    <main className="shop-shell">
      <header className="admin-header">
        <div>
          <Link className="back-link" to="/"><FiArrowLeft /> Storefront</Link>
          <h1>Product dashboard</h1>
          <p>Create, update, and remove catalog items.</p>
        </div>
      </header>

      {(message || error) && (
        <div className={error ? "shop-alert" : "shop-alert shop-alert--success"}>
          {error || message}
        </div>
      )}

      <section className="admin-layout">
        <form className="product-form" onSubmit={handleSubmit}>
          <div className="form-title">
            <h2>{editingId ? "Edit product" : "Add product"}</h2>
            {editingId && (
              <button type="button" className="icon-only" onClick={resetForm} title="Cancel edit">
                <FiX />
              </button>
            )}
          </div>

          <div className="form-grid">
            <label>
              Product name
              <input name="name" value={form.name} onChange={updateField} required />
            </label>
            <label>
              Brand
              <input name="brand" value={form.brand} onChange={updateField} />
            </label>
            <label>
              Category
              <input name="category" value={form.category} onChange={updateField} required />
            </label>
            <label>
              Stock
              <input name="stock" type="number" min="0" value={form.stock} onChange={updateField} required />
            </label>
            <label>
              Price
              <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={updateField} required />
            </label>
            <label>
              Discount price
              <input name="discountPrice" type="number" min="0" step="0.01" value={form.discountPrice} onChange={updateField} />
            </label>
          </div>

          <label>
            Description
            <textarea name="description" value={form.description} onChange={updateField} rows="5" required />
          </label>

          <label>
            Image URLs
            <textarea
              name="images"
              value={form.images}
              onChange={updateField}
              rows="4"
              placeholder="One image URL per line"
            />
          </label>

          <div className="form-checks">
            <label><input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={updateField} /> Featured</label>
            <label><input type="checkbox" name="isActive" checked={form.isActive} onChange={updateField} /> Active</label>
          </div>

          <button className="primary-action" type="submit" disabled={saving}>
            <FiPlus />
            {saving ? "Saving..." : editingId ? "Update product" : "Create product"}
          </button>
        </form>

        <section className="admin-products">
          <h2>Catalog items</h2>
          {loading ? (
            <div className="product-state">Loading...</div>
          ) : products.length === 0 ? (
            <div className="product-state">No products yet.</div>
          ) : (
            <div className="admin-list">
              {products.map((product) => (
                <article className="admin-row" key={product._id}>
                  <img src={product.images?.[0] || "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=300&q=80"} alt={product.name} />
                  <div>
                    <h3>{product.name}</h3>
                    <p>{product.category} - Stock {product.stock}</p>
                  </div>
                  <div className="admin-row__actions">
                    <button type="button" className="icon-only" onClick={() => handleEdit(product)} title="Edit product">
                      <FiEdit3 />
                    </button>
                    <button type="button" className="icon-only icon-only--danger" onClick={() => handleDelete(product._id)} title="Delete product">
                      <FiTrash2 />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
};

export default AdminProductsPage;
