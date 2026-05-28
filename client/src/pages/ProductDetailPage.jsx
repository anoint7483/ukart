import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiArrowLeft, FiBox, FiHeart, FiShoppingCart, FiTruck } from "react-icons/fi";
import api from "../api/api";
import "../styles/products.css";

const fallbackImage =
  "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=1200&q=80";

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const ProductDetailPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data.product);
        setSelectedImage(res.data.product.images?.[0] || fallbackImage);
      } catch (err) {
        setError(err.response?.data?.message || "Product not found");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return <main className="shop-shell"><div className="product-state">Loading product...</div></main>;
  }

  if (error || !product) {
    return (
      <main className="shop-shell">
        <Link className="back-link" to="/"><FiArrowLeft /> Back to products</Link>
        <div className="product-state">{error || "Product not found"}</div>
      </main>
    );
  }

  const images = product.images?.length ? product.images : [fallbackImage];
  const price = product.discountPrice || product.price;

  return (
    <main className="shop-shell">
      <Link className="back-link" to="/"><FiArrowLeft /> Back to products</Link>

      <section className="product-detail">
        <div className="product-gallery">
          <img className="product-main-image" src={selectedImage} alt={product.name} />
          <div className="product-thumbs">
            {images.map((image) => (
              <button
                type="button"
                key={image}
                className={image === selectedImage ? "is-selected" : ""}
                onClick={() => setSelectedImage(image)}
                aria-label={`View ${product.name}`}
              >
                <img src={image} alt="" />
              </button>
            ))}
          </div>
        </div>

        <article className="product-info">
          <span className="detail-category">{product.category}</span>
          <h1>{product.name}</h1>
          <p className="detail-brand">{product.brand || "uKart selection"}</p>
          <div className="detail-price">
            <strong>{formatPrice(price)}</strong>
            {product.discountPrice && <span>{formatPrice(product.price)}</span>}
          </div>
          <p className="detail-description">{product.description}</p>

          <div className="detail-actions">
            <button className="primary-action" disabled={product.stock <= 0}>
              <FiShoppingCart />
              {product.stock > 0 ? "Add to cart" : "Out of stock"}
            </button>
            <button className="secondary-action">
              <FiHeart />
              Wishlist
            </button>
          </div>

          <div className="detail-facts">
            <span><FiBox /> {product.stock} in stock</span>
            <span><FiTruck /> Delivery estimate shown at checkout</span>
          </div>
        </article>
      </section>
    </main>
  );
};

export default ProductDetailPage;
