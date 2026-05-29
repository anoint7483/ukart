import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FiArrowLeft, FiBox, FiShoppingBag } from "react-icons/fi";
import api from "../api/api";
import "../styles/products.css";

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatDate = (value) => new Date(value).toLocaleDateString("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const OrdersPage = () => {
  const { id } = useParams();
  const [orders, setOrders] = useState([]);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      setError("");
      try {
        const res = id ? await api.get(`/orders/${id}`) : await api.get("/orders/mine");
        if (id) setOrder(res.data.order);
        else setOrders(res.data.orders || []);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load orders");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [id]);

  if (loading) {
    return <main className="shop-shell"><div className="product-state">Loading orders...</div></main>;
  }

  if (error) {
    return (
      <main className="shop-shell">
        <Link className="back-link" to="/"><FiArrowLeft /> Storefront</Link>
        <div className="shop-alert">{error}</div>
      </main>
    );
  }

  if (id && order) {
    return (
      <main className="shop-shell">
        <Link className="back-link" to="/orders"><FiArrowLeft /> All orders</Link>
        <section className="order-detail">
          <header>
            <div>
              <p className="shop-kicker cart-kicker">Order placed</p>
              <h1>#{order._id.slice(-8).toUpperCase()}</h1>
              <span>{formatDate(order.createdAt)} - {order.orderStatus}</span>
            </div>
            <strong>{formatPrice(order.grandTotal)}</strong>
          </header>

          <div className="order-items">
            {order.items.map((item) => (
              <article className="order-line" key={item.product}>
                <img src={item.image || "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=300&q=80"} alt={item.name} />
                <div>
                  <strong>{item.name}</strong>
                  <span>Qty {item.quantity} - {formatPrice(item.price)}</span>
                </div>
                <strong>{formatPrice(item.price * item.quantity)}</strong>
              </article>
            ))}
          </div>

          <div className="address-box">
            <h2>Shipping address</h2>
            <p>
              {order.shippingAddress.fullName}, {order.shippingAddress.addressLine1}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="shop-shell">
      <Link className="back-link" to="/"><FiArrowLeft /> Storefront</Link>
      <header className="cart-header">
        <div>
          <p className="shop-kicker cart-kicker">Your orders</p>
          <h1>Track previous purchases.</h1>
        </div>
      </header>

      {orders.length === 0 ? (
        <section className="empty-cart">
          <FiShoppingBag />
          <h2>No orders yet</h2>
          <p>Your completed checkout history will appear here.</p>
          <Link className="primary-action" to="/">Browse products</Link>
        </section>
      ) : (
        <section className="order-list">
          {orders.map((item) => (
            <Link className="order-card" to={`/orders/${item._id}`} key={item._id}>
              <FiBox />
              <div>
                <strong>#{item._id.slice(-8).toUpperCase()}</strong>
                <span>{formatDate(item.createdAt)} - {item.orderStatus}</span>
              </div>
              <strong>{formatPrice(item.grandTotal)}</strong>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
};

export default OrdersPage;
