import { Link } from "react-router-dom";
import { FiArrowLeft, FiMinus, FiPlus, FiShoppingBag, FiTrash2 } from "react-icons/fi";
import { useCart } from "../context/useCart";
import "../styles/products.css";

const fallbackImage =
  "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=300&q=80";

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const CartPage = () => {
  const { cart, clearCart, loading, removeItem, updateItem } = useCart();
  const items = cart.items || [];

  const changeQuantity = (product, nextQuantity) => {
    if (nextQuantity < 1 || nextQuantity > product.stock) return;
    updateItem(product._id, nextQuantity);
  };

  return (
    <main className="shop-shell">
      <Link className="back-link" to="/"><FiArrowLeft /> Continue shopping</Link>

      <header className="cart-header">
        <div>
          <p className="shop-kicker cart-kicker">Your cart</p>
          <h1>Review your picks.</h1>
        </div>
        {items.length > 0 && (
          <button className="secondary-action" type="button" onClick={clearCart}>
            <FiTrash2 />
            Clear cart
          </button>
        )}
      </header>

      {loading ? (
        <div className="product-state">Loading cart...</div>
      ) : items.length === 0 ? (
        <section className="empty-cart">
          <FiShoppingBag />
          <h2>Your cart is empty</h2>
          <p>Add a few products and they will show up here.</p>
          <Link className="primary-action" to="/">Browse products</Link>
        </section>
      ) : (
        <section className="cart-layout">
          <div className="cart-items">
            {items.map((item) => {
              const product = item.product;

              return (
                <article className="cart-item" key={product._id}>
                  <img src={product.images?.[0] || fallbackImage} alt={product.name} />
                  <div className="cart-item__info">
                    <Link to={`/products/${product.slug || product._id}`}>{product.name}</Link>
                    <span>{product.category} - {product.brand || "uKart selection"}</span>
                    <strong>{formatPrice(item.unitPrice)}</strong>
                  </div>
                  <div className="quantity-stepper" aria-label={`Quantity for ${product.name}`}>
                    <button
                      type="button"
                      onClick={() => changeQuantity(product, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      title="Decrease quantity"
                    >
                      <FiMinus />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => changeQuantity(product, item.quantity + 1)}
                      disabled={item.quantity >= product.stock}
                      title="Increase quantity"
                    >
                      <FiPlus />
                    </button>
                  </div>
                  <div className="cart-item__total">
                    <strong>{formatPrice(item.lineTotal)}</strong>
                    <button type="button" onClick={() => removeItem(product._id)} title="Remove item">
                      <FiTrash2 />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="cart-summary">
            <h2>Order summary</h2>
            <div>
              <span>Items</span>
              <strong>{cart.totalItems}</strong>
            </div>
            <div>
              <span>Subtotal</span>
              <strong>{formatPrice(cart.subtotal)}</strong>
            </div>
            <div>
              <span>Delivery</span>
              <strong>At checkout</strong>
            </div>
            <Link className="primary-action" to="/checkout">
              Checkout
            </Link>
          </aside>
        </section>
      )}
    </main>
  );
};

export default CartPage;
