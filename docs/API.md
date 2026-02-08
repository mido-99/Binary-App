# API reference (brief)

Base: `/api/`. Session auth (cookies). All JSON.

---

**Auth**
- `POST auth/login/` — Log in (body: `email`, `password`). Returns `user` or `error`.
- `POST auth/register/` — Sign up (body: `email`, `password`, `password_confirm`). Returns `user` or `error`.
- `GET auth/me/` — Current user or 401.
- `POST auth/logout/` — Log out (204).

**Stores**
- `GET stores/` — List stores (id, name, product_count, seller).
- `GET stores/<id>/` — Store detail.
- `GET stores/<id>/products/` — Products in store (same query params as products list).

**Sellers**
- `GET sellers/` — List sellers.
- `GET sellers/<id>/` — Seller detail.
- `GET sellers/<id>/stores/` — Stores owned by seller.

**Products**
- `GET products/` — List products. Query: `q`, `categories`, `category`, `min_price`, `max_price`, `stores`, `sellers`, `on_sale`, `sort`, `page`, `page_size`. Returns `products` (each has `image_url` when set), `total_count`, `page`, `page_size`, `categories`.
- `GET products/<id>/` — Product detail (includes `related_products`, `image_url`).
- `GET products/<id>/related/` — Related products (same category).

**Cart** (session)
- `GET cart/` — List cart items.
- `POST cart/add/` — Add item (body: `product_id`, `quantity`).
- `POST cart/update/` — Update quantity (body: `product_id`, `quantity`).
- `DELETE cart/remove/<product_id>/` — Remove item.
- `POST cart/clear/` — Empty cart.

**User** (auth required)
- `PATCH users/me/` — Update profile (e.g. email).
- `POST users/me/change-password/` — Change password (body: `current_password`, `new_password`).
- `GET users/me/addresses/` — List addresses.
- `POST users/me/addresses/create/` — Create address.
- `PATCH users/me/addresses/<id>/` — Update address.
- `DELETE users/me/addresses/<id>/delete/` — Delete address.

**Orders** (auth required)
- `GET orders/` — List user orders. Query: `status`, `sort`, `page`, `page_size`.
- `GET orders/<id>/` — Order detail.
- `POST orders/` — Create order (checkout). Body: `shipping_address_id`, `payment_method`, etc.
- `POST orders/<id>/cancel/` — Cancel order (if allowed).

**Wishlist** (auth required)
- `GET wishlist/` — List wishlist products.
- `POST wishlist/<product_id>/add/` — Add to wishlist.
- `DELETE wishlist/<product_id>/remove/` — Remove from wishlist.

**Dashboard** (auth required)
- `GET dashboard/` — Referral dashboard summary.
- `GET dashboard/tree/` — Referral tree data.
- `GET dashboard/bonus-events/` — Bonus events.

---

**Product images:** `image_url` is set in product payloads by `_product_list_item()` in `core/api_views.py` (around lines 23–46). It uses `Product.image` (path under `media/`, e.g. `products/black headphone.jpg`), URL-encodes the path, and returns a full URL via `request.build_absolute_uri()` so images load from the backend (e.g. `http://127.0.0.1:8000/media/products/black%20headphone.jpg`).
