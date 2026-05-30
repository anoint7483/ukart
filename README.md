### 1. Project setup and architecture
    1. Folder structure and monorepo
    2. Node + express server setup
    3. MongoDb + mongoose connection
    4. React app with vite
    5. Environment variables
### 2. Authentication system
### 3. Product Catalog
### 4. Cart and Order System
### 5. Admin Dashboard
### 6. Deployment and Polish




# uKart Authentication System

  

## Project Structure

  

```

ukart/

├── backend/

│   ├── controllers/authController.js   ← All auth logic

│   ├── middleware/authMiddleware.js     ← JWT protect + authorize

│   ├── models/User.js                  ← Mongoose schema

│   ├── routes/authRoutes.js            ← Express routes

│   ├── utils/jwt.js                    ← Token helpers

│   ├── utils/email.js                  ← Nodemailer helpers

│   ├── server.js                       ← Express app entry

│   ├── package.json

│   └── .env.example                    ← Copy to .env and fill in

│

└── frontend/

    └── src/

        ├── App.jsx                     ← Routes wired up

        ├── context/AuthContext.jsx     ← Global auth state

        ├── utils/api.js                ← Axios + auto refresh

        ├── components/auth/

        │   ├── PrivateRoute.jsx        ← Route guard

        │   ├── GoogleLoginButton.jsx   ← Google GSI button

        │   └── auth.css               ← Shared styles

        └── pages/

            ├── LoginPage.jsx

            ├── RegisterPage.jsx

            ├── ForgotPasswordPage.jsx

            ├── ResetPasswordPage.jsx

            └── VerifyEmailPage.jsx

```

  

---

  

## Quick Setup

  

### 1. Backend

  

```bash

cd backend

cp .env.example .env    # Fill in your secrets

npm install

npm run dev             # Starts on port 5000

```

  

### 2. Frontend

  

```bash

cd frontend

cp .env.example .env    # Add Google Client ID

npm install

npm start               # Starts on port 3000

```

  

### 3. Add Google GSI script to `frontend/public/index.html`

  

```html

<script src="https://accounts.google.com/gsi/client" async defer></script>

```

  

---

  

## API Endpoints

  

| Method | Route                          | Auth     | Description                  |

|--------|-------------------------------|----------|------------------------------|

| POST   | /api/auth/register             | Public   | Register + send verify email |

| POST   | /api/auth/login                | Public   | Login → accessToken + cookie |

| POST   | /api/auth/logout               | Bearer   | Revoke refresh token         |

| POST   | /api/auth/refresh              | Cookie   | Rotate refresh token         |

| POST   | /api/auth/google               | Public   | Google OAuth (ID token)      |

| GET    | /api/auth/verify-email?token=  | Public   | Verify email address         |

| POST   | /api/auth/resend-verification  | Public   | Resend verification email    |

| POST   | /api/auth/forgot-password      | Public   | Send password reset email    |

| POST   | /api/auth/reset-password       | Public   | Reset password with token    |

| GET    | /api/auth/me                   | Bearer   | Get current user             |

  

---

  

## Security Features

  

- **Passwords**: bcrypt hashed (salt rounds 12)

- **Access tokens**: Short-lived (15 min), JWT in memory

- **Refresh tokens**: 7-day httpOnly cookie, stored in DB (multi-device), rotated on every use

- **Email tokens**: SHA-256 hashed before storage

- **Rate limiting**: 20 req / 15 min on all auth routes

- **Helmet**: Security headers

- **CORS**: Restricted to CLIENT_URL

  

---

  

## Protecting Your Routes (Backend)

  

```js

const { protect, authorize } = require("./middleware/authMiddleware");

  

// Any logged-in user

router.get("/orders", protect, getOrders);

  

// Admins only

router.delete("/product/:id", protect, authorize("admin"), deleteProduct);

```

  

## Using Auth in React

  

```jsx

import { useAuth } from "./context/AuthContext";

  

const { user, login, logout, accessToken } = useAuth();

```
