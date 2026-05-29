import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiLogOut, FiPackage, FiSearch, FiShoppingBag, FiShoppingCart, FiSliders, FiUser } from "react-icons/fi";
import api from "../api/api";
import { useAuth } from "../context/useAuth";
import { useCart } from "../context/useCart";
import "../styles/products.css";

const fallbackImage =
  "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=900&q=80";

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const ProductListPage = () => {
  const { user, logout } = useAuth();
  const { cart, addItem } = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartMessage, setCartMessage] = useState("");

  const params = useMemo(() => {
    const query = new URLSearchParams({ limit: "24" });
    if (search.trim()) query.set("search", search.trim());
    if (category) query.set("category", category);
    if (sort !== "newest") query.set("sort", sort);
    return query.toString();
  }, [category, search, sort]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/products?${params}`);
        setProducts(res.data.products || []);
        setCategories(res.data.categories || []);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [params]);

  const handleAddToCart = async (event, productId) => {
    event.preventDefault();
    setCartMessage("");
    const result = await addItem(productId, 1);
    setCartMessage(result.message);
  };

  return (
    <main className="shop-shell">
      <header className="shop-topbar">
        <Link to="/" className="shop-logo">
          u<span>Kart</span>
        </Link>
        <nav className="shop-nav">
          {user?.role === "admin" && (
            <>
              <Link to="/dashboard" className="icon-link" title="Manage products">
                <FiPackage />
                <span>Admin</span>
              </Link>
            </>
          )}
          <Link to="/orders" className="icon-link" title="View orders">
            <FiShoppingBag />
            <span>Orders</span>
          </Link>
          <Link to="/profile" className="icon-link" title="View profile">
            <FiUser />
            <span>Profile</span>
          </Link>
          <Link to="/cart" className="icon-link cart-link" title="View cart">
            <FiShoppingCart />
            <span>Cart</span>
            {cart.totalItems > 0 && <strong>{cart.totalItems}</strong>}
          </Link>
          <button className="icon-link icon-link--button" onClick={logout} title="Log out">
            <FiLogOut />
            <span>Logout</span>
          </button>
        </nav>
      </header>

      <section className="shop-hero">
        <div>
          <p className="shop-kicker">Fresh picks for {user?.name || "you"}</p>
          <h1>Find your next everyday favorite.</h1>
          <p className="shop-copy">
            Browse the first real uKart catalog, filter by category, and open product details.
          </p>
        </div>
        <div className="shop-hero-card">
          <FiShoppingBag />
          <strong>{products.length}</strong>
          <span>products shown</span>
        </div>
      </section>

      <section className="shop-toolbar" aria-label="Product filters">
        <label className="search-box">
          <FiSearch />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products"
          />
        </label>

        <label className="select-box">
          <FiSliders />
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="select-box">
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </label>
      </section>

      {error && <div className="shop-alert">{error}</div>}
      {cartMessage && <div className="shop-alert shop-alert--success">{cartMessage}</div>}

      {loading ? (
        <div className="product-state">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="product-state">No products found.</div>
      ) : (
        <section className="product-grid">
          {products.map((product) => {
            const image = product.images?.[0] || fallbackImage;
            const price = product.discountPrice || product.price;

            return (
              <Link className="product-card" to={`/products/${product.slug || product._id}`} key={product._id}>
                <img src={image} alt={product.name} />
                <div className="product-card__body">
                  <div className="product-card__meta">
                    <span>{product.category}</span>
                    {product.stock <= 0 && <span className="stock-pill">Out of stock</span>}
                  </div>
                  <h2>{product.name}</h2>
                  <p>{product.brand || "uKart selection"}</p>
                  <div className="product-card__footer">
                    <div className="product-card__price">
                      <strong>{formatPrice(price)}</strong>
                      {product.discountPrice && <span>{formatPrice(product.price)}</span>}
                    </div>
                    <button
                      type="button"
                      className="card-cart-button"
                      onClick={(event) => handleAddToCart(event, product._id)}
                      disabled={product.stock <= 0}
                      title="Add to cart"
                    >
                      <FiShoppingCart />
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </main>
  );
};

export default ProductListPage;
