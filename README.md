# Nexora Everyday Discovery

Build two pages now.

=== A) CATEGORY PAGE (routes "/categories" and "/category/:slug") ===

- Top bar: back arrow (left), page title "Electronics" (dynamic from category, center-left),

  search icon and filter/sort icon (right).

- Below: horizontally scrollable FILTER CHIPS (rounded-full pills):

  "All" (active = solid black white text), "Headphones", "Smartwatch", "Accessories"

  and more sub-categories. Inactive chips = light gray background with dark text.

  Selecting a chip filters the product grid instantly.

- 2-column product grid using the same ProductCard (image, discount badge top-left,

  heart top-right, name, price, old price).

  Items: Wireless Headphones, Earbuds Pro, Smart Watch, Smartphone, Power Bank, Smart Charger.

- Filter/Sort icon opens a bottom sheet (drawer) with: Sort by (Popularity, Price Low to High,

  Price High to Low, Newest, Rating), Price range slider, Rating filter, and

  "Apply" + "Reset" buttons. All filters must actually work.

- "/categories" (bottom nav tab) shows a grid of all main categories as large cards;

  tapping one opens that category page.

- Bottom navigation: Categories tab active.

=== B) SEARCH PAGE (route "/search") ===

- Top: back arrow + auto-focused search input "Search products...".

- When input is empty show:

  - "Recent Searches" section: list with a clock icon, the search term, and an "×" button

    to remove each (e.g. headphones, sneakers, smart watch, backpack).

    Stored in Zustand + localStorage. Include "Clear all".

  - "Popular Searches" section: wrapped rounded-full outlined chips

    (iPhone, Laptop, T-shirt, Shoes, Bag, Watch). Tapping a chip runs that search.

- When user types: show live search results (debounced 300ms) as a product list/grid

  with matching name/category, and an empty state ("No products found") when nothing matches.

- Pressing Enter saves the term to Recent Searches.
  Add a protected ADMIN PANEL at route "/admin" (only for users with role "admin",

store roles in a separate user_roles table with a security-definer function to check

the role, never on the profile table). Use a clean desktop-friendly dashboard layout

with a left sidebar (black) matching the NEXORA monochrome style.

Admin pages:

1. Dashboard: cards for Total Sales (৳), Total Orders, Total Customers, Low Stock items;

   a sales line chart for the last 30 days; recent orders table.

2. Products: table with image, name, category, price, stock, status;

   Add / Edit / Delete product with image upload (Supabase Storage), multiple images,

   colors, sizes, discount, and best-deal/trending toggles.

3. Categories: add, edit, delete.

4. Orders: table with filters by status and date; open an order to see full details

   and change status (Pending → Processing → Shipped → Delivered / Cancelled).

   Also update payment status for bKash/Nagad (verify transaction ID).

5. Customers: list of users with their order count and total spent.

6. Banners: manage homepage hero banner slides (image, title, subtitle, link).

Make all admin tables searchable, paginated and mobile-friendly.Now make the whole site fully RESPONSIVE and production-ready.

=== DESKTOP LAYOUT (lg and above) ===

Replace the bottom nav with a clean white top navbar:

- Left: "NEXORA" logo

- Center links: Home, Shop, Categories, About, Contact (small text)

- Right: search icon, user icon, cart icon with badge

- Homepage on desktop: a large full-width light-gray hero section with big heading

  "Upgrade Your Everyday Life", subtext "Premium quality products for a better tomorrow.",

  a black "Shop Now →" button, and a large product image (headphones) on the right.

- Below: "Shop by Category" row of 5 icon items centered, then "Trending Products" section

  with a 4-5 column product grid (Wireless Headphones ৳1,850, Casual Sneakers ৳2,400,

  Smart Watch ৳2,150, Backpack ৳1,200) with "See All →" link.

- Add a footer: NEXORA logo + "Shop Smarter. Live Better.", quick links, customer support,

  social icons, payment method icons (bKash, Nagad, Visa, Mastercard), copyright.

- Product details on desktop: two-column layout (gallery left, info right).

- Cart on desktop: items list on left, sticky order summary card on right.

- Checkout on desktop: form on left, order summary on right.

- Category page on desktop: left filter sidebar + 3-4 column grid.

=== FINAL POLISH ===

- Add loading skeletons, empty states, error states and toast notifications everywhere.

- Add page transition animations (subtle fade/slide).

- Add SEO: page titles, meta descriptions, Open Graph tags, favicon,

  alt text for all images, semantic HTML.

- Lazy-load images and routes for fast performance.

- Add a floating WhatsApp support button.

- Make sure all buttons, links, forms and navigation actually work with no console errors

  or broken routes. Fix any TypeScript errors.

- Accessibility: proper focus states, aria-labels on icon buttons, good color contrast.

Extra: Bug fix prompt (kono somossa hole eta use korben)
Review the entire project and fix all bugs: broken routes, TypeScript errors,

console errors, non-working buttons, broken cart/wishlist logic, price calculation

mistakes, and layout issues on mobile (375px), tablet (768px) and desktop (1280px).

Do not change the design or remove any existing feature. Keep the NEXORA black-white

minimal style consistent on every page.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://nexora-everyday-discovery.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bff796e5-4c9f-425e-bfa4-1661933f8c97).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
