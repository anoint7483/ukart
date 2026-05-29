import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiLock, FiSave, FiUser } from "react-icons/fi";
import { useAuth } from "../context/useAuth";
import "../styles/products.css";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateProfile, changePassword } = useAuth();
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    avatar: user?.avatar || "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const updateProfileField = (event) => {
    const { name, value } = event.target;
    setProfileError("");
    setProfileMessage("");
    setProfileForm((current) => ({ ...current, [name]: value }));
  };

  const updatePasswordField = (event) => {
    const { name, value } = event.target;
    setPasswordError("");
    setPasswordMessage("");
    setPasswordForm((current) => ({ ...current, [name]: value }));
  };

  const submitProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setProfileError("");
    setProfileMessage("");

    const result = await updateProfile(profileForm.name, profileForm.avatar);
    if (result.success) setProfileMessage(result.message);
    else setProfileError(result.message);
    setSavingProfile(false);
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    setSavingPassword(true);
    setPasswordError("");
    setPasswordMessage("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match");
      setSavingPassword(false);
      return;
    }

    const result = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
    if (result.success) {
      setPasswordMessage(result.message);
      setTimeout(() => navigate("/login"), 600);
    } else {
      setPasswordError(result.message);
    }
    setSavingPassword(false);
  };

  const initials = user?.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="shop-shell">
      <Link className="back-link" to="/"><FiArrowLeft /> Storefront</Link>

      <header className="profile-header">
        <div className="profile-avatar">
          {profileForm.avatar ? <img src={profileForm.avatar} alt={user?.name} /> : <span>{initials || "UK"}</span>}
        </div>
        <div>
          <p className="shop-kicker cart-kicker">Account</p>
          <h1>{user?.name}</h1>
          <p>{user?.email}</p>
        </div>
      </header>

      <section className="profile-layout">
        <form className="product-form" onSubmit={submitProfile}>
          <div className="form-title">
            <h2><FiUser /> Profile details</h2>
          </div>

          {profileError && <div className="shop-alert">{profileError}</div>}
          {profileMessage && <div className="shop-alert shop-alert--success">{profileMessage}</div>}

          <label>
            Full name
            <input name="name" value={profileForm.name} onChange={updateProfileField} required />
          </label>
          <label>
            Avatar image URL
            <input name="avatar" value={profileForm.avatar} onChange={updateProfileField} placeholder="https://..." />
          </label>
          <label>
            Email
            <input value={user?.email || ""} disabled />
          </label>

          <button className="primary-action" type="submit" disabled={savingProfile}>
            <FiSave />
            {savingProfile ? "Saving..." : "Save profile"}
          </button>
        </form>

        <form className="product-form" onSubmit={submitPassword}>
          <div className="form-title">
            <h2><FiLock /> Change password</h2>
          </div>

          {passwordError && <div className="shop-alert">{passwordError}</div>}
          {passwordMessage && <div className="shop-alert shop-alert--success">{passwordMessage}</div>}

          <label>
            Current password
            <input
              name="currentPassword"
              type="password"
              value={passwordForm.currentPassword}
              onChange={updatePasswordField}
              required
            />
          </label>
          <label>
            New password
            <input
              name="newPassword"
              type="password"
              minLength="6"
              value={passwordForm.newPassword}
              onChange={updatePasswordField}
              required
            />
          </label>
          <label>
            Confirm new password
            <input
              name="confirmPassword"
              type="password"
              minLength="6"
              value={passwordForm.confirmPassword}
              onChange={updatePasswordField}
              required
            />
          </label>

          <button className="primary-action" type="submit" disabled={savingPassword}>
            <FiLock />
            {savingPassword ? "Updating..." : "Update password"}
          </button>
        </form>
      </section>
    </main>
  );
};

export default ProfilePage;
