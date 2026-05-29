import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import api from "../api/api";
import "../styles/products.css";

const statuses = ["placed", "processing", "shipped", "delivered", "cancelled"];

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const res = await api.get("/orders/admin");
        setOrders(res.data.orders || []);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load orders");
      }
    };

    loadOrders();
  }, []);

  const updateStatus = async (orderId, orderStatus) => {
    setMessage("");
    setError("");
    try {
      const res = await api.put(`/orders/${orderId}/status`, { orderStatus });
      setOrders((current) => current.map((order) => (order._id === orderId ? res.data.order : order)));
      setMessage("Order status updated.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update order");
    }
  };

  return (
    <main className="shop-shell">
      <Link className="back-link" to="/dashboard"><FiArrowLeft /> Product dashboard</Link>
      <header className="cart-header">
        <div>
          <p className="shop-kicker cart-kicker">Admin</p>
          <h1>Manage orders.</h1>
        </div>
      </header>

      {(message || error) && (
        <div className={error ? "shop-alert" : "shop-alert shop-alert--success"}>
          {error || message}
        </div>
      )}

      <section className="admin-order-list">
        {orders.length === 0 ? (
          <div className="product-state">No orders yet.</div>
        ) : (
          orders.map((order) => (
            <article className="admin-order-row" key={order._id}>
              <div>
                <strong>#{order._id.slice(-8).toUpperCase()}</strong>
                <span>{order.user?.name || "Customer"} - {order.user?.email}</span>
              </div>
              <strong>{formatPrice(order.grandTotal)}</strong>
              <select value={order.orderStatus} onChange={(event) => updateStatus(order._id, event.target.value)}>
                {statuses.map((status) => (
                  <option value={status} key={status}>{status}</option>
                ))}
              </select>
            </article>
          ))
        )}
      </section>
    </main>
  );
};

export default AdminOrdersPage;
