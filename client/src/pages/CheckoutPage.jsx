import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCreditCard, FiMapPin } from "react-icons/fi";
import api from "../api/api";
import { useCart } from "../context/useCart";
import "../styles/products.css";

const initialAddress = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
};

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, fetchCart } = useCart();
  const [shippingAddress, setShippingAddress] = useState(initialAddress);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  const shippingFee = cart.subtotal >= 999 || cart.subtotal === 0 ? 0 : 79;
  const grandTotal = cart.subtotal + shippingFee;

  const updateAddress = (event) => {
    const { name, value } = event.target;
    setShippingAddress((current) => ({ ...current, [name]: value }));
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    setPlacing(true);
    setError("");

    try {
      const res = await api.post("/orders", { shippingAddress, paymentMethod: "cod" });
      await fetchCart();
      navigate(`/orders/${res.data.order._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to place order");
    } finally {
      setPlacing(false);
    }
  };

  if (!cart.items?.length) {
    return (
      <main className="shop-shell">
        <Link className="back-link" to="/cart"><FiArrowLeft /> Back to cart</Link>
        <section className="empty-cart">
          <FiCreditCard />
          <h2>Your cart is empty</h2>
          <p>Add products before checkout.</p>
          <Link className="primary-action" to="/">Browse products</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="shop-shell">
      <Link className="back-link" to="/cart"><FiArrowLeft /> Back to cart</Link>

      <header className="cart-header">
        <div>
          <p className="shop-kicker cart-kicker">Checkout</p>
          <h1>Where should we send it?</h1>
        </div>
      </header>

      {error && <div className="shop-alert">{error}</div>}

      <section className="checkout-layout">
        <form className="product-form checkout-form" onSubmit={placeOrder}>
          <div className="form-title">
            <h2><FiMapPin /> Shipping address</h2>
          </div>

          <div className="form-grid">
            <label>
              Full name
              <input name="fullName" value={shippingAddress.fullName} onChange={updateAddress} required />
            </label>
            <label>
              Phone
              <input name="phone" value={shippingAddress.phone} onChange={updateAddress} required />
            </label>
          </div>

          <label>
            Address line 1
            <input name="addressLine1" value={shippingAddress.addressLine1} onChange={updateAddress} required />
          </label>
          <label>
            Address line 2
            <input name="addressLine2" value={shippingAddress.addressLine2} onChange={updateAddress} />
          </label>

          <div className="form-grid">
            <label>
              City
              <input name="city" value={shippingAddress.city} onChange={updateAddress} required />
            </label>
            <label>
              State
              <input name="state" value={shippingAddress.state} onChange={updateAddress} required />
            </label>
            <label>
              Postal code
              <input name="postalCode" value={shippingAddress.postalCode} onChange={updateAddress} required />
            </label>
            <label>
              Country
              <input name="country" value={shippingAddress.country} onChange={updateAddress} required />
            </label>
          </div>

          <div className="payment-box">
            <FiCreditCard />
            <div>
              <strong>Cash on delivery</strong>
              <span>Online payments can be added later with Stripe.</span>
            </div>
          </div>

          <button className="primary-action" type="submit" disabled={placing}>
            {placing ? "Placing order..." : "Place order"}
          </button>
        </form>

        <aside className="cart-summary">
          <h2>Order total</h2>
          <div><span>Subtotal</span><strong>{formatPrice(cart.subtotal)}</strong></div>
          <div><span>Delivery</span><strong>{shippingFee === 0 ? "Free" : formatPrice(shippingFee)}</strong></div>
          <div className="summary-total"><span>Total</span><strong>{formatPrice(grandTotal)}</strong></div>
        </aside>
      </section>
    </main>
  );
};

export default CheckoutPage;
