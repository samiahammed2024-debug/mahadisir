export type CategorySlug =
  | "panjabi"
  | "shoes"
  | "watch"
  | "attar"
  | "tupi"
  | "shirt"
  | "islamic"
  | "electronics"
  | "fashion"
  | "home"
  | "beauty"
  | "sports";

export interface Category {
  slug: CategorySlug;
  name: string;
  description: string;
  image: string;
  subs: string[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: CategorySlug;
  sub: string;
  price: number;
  oldPrice: number;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  description: string;
  colors: { name: string; value: string }[];
  sizes: string[];
  images: string[];
  stock: number;
  isBestDeal: boolean;
  isTrending: boolean;
  createdAt: string;
}

const u = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=75`;

export const categories: Category[] = [
  {
    slug: "panjabi",
    name: "Panjabi",
    description: "Premium Silk, Fine Cotton & Kabli Sets",
    image: u("photo-1583391733956-3750e0ff4e8b"),
    subs: ["Semi-Long Panjabi", "Kabli Suit Set", "Jacquard Silk", "Fine Cotton"],
  },
  {
    slug: "shoes",
    name: "Shoes",
    description: "Royal Nagra, Genuine Leather Loafers & Casuals",
    image: u("photo-1533867617858-e7b97e060509"),
    subs: ["Nagra Shoes", "Leather Loafers", "Casual Shoes", "Sandals"],
  },
  {
    slug: "watch",
    name: "Watches",
    description: "Arabic Dial Luxury & Classic Quartz Timepieces",
    image: u("photo-1524805444758-089113d48a6d"),
    subs: ["Arabic Dial", "Leather Strap", "Golden Metal", "Chronograph"],
  },
  {
    slug: "attar",
    name: "Attar",
    description: "100% Non-Alcoholic Pure Oud & Musk Fragrance",
    image: u("photo-1592945403244-b3fbafd7f539"),
    subs: ["Musk Oud", "Jannatul Ferdous", "White Rose", "Arabian Amber"],
  },
  {
    slug: "tupi",
    name: "Caps (Tupi)",
    description: "Handmade Omani & Turkish Prayer Caps",
    image: u("photo-1588850561407-ed78c282e89b"),
    subs: ["Omani Style", "Turkish Velvet", "Cotton Prayer Cap", "Embroidered"],
  },
  {
    slug: "shirt",
    name: "Shirts",
    description: "Executive Cotton Formal & Mandarin Linen Shirts",
    image: u("photo-1596755094514-f87e34085b2c"),
    subs: ["Formal Shirt", "Casual Cotton", "Mandarin Collar", "Linen"],
  },
  {
    slug: "islamic",
    name: "Islamic Items",
    description: "Turkish Velvet Prayer Rugs & Digital Tasbih",
    image: u("photo-1564507592333-c60657eea523"),
    subs: ["Velvet Prayer Rug", "Digital Tasbih", "Quran Stand", "Gift Sets"],
  },
];

const white = { name: "White", value: "#ffffff" };
const black = { name: "Black", value: "#1a1a1a" };
const navy = { name: "Navy Blue", value: "#0f172a" };
const maroon = { name: "Maroon", value: "#881337" };
const olive = { name: "Olive Green", value: "#365314" };
const gold = { name: "Golden", value: "#d97706" };

const shoeSizes = ["39", "40", "41", "42", "43", "44"];
const panjabiSizes = ["38", "40", "42", "44", "46"];
const shirtSizes = ["M", "L", "XL", "XXL"];
const freeSize = ["Free Size"];

type Seed = Omit<Product, "slug" | "discountPercent" | "createdAt" | "images"> & {
  images: string[];
};

const seeds: Seed[] = [
  // 1. Panjabi
  {
    id: "panjabi-1",
    name: "Premium Semi-Long Cotton Panjabi",
    category: "panjabi",
    sub: "Semi-Long Panjabi",
    price: 1850,
    oldPrice: 2450,
    rating: 4.9,
    reviewCount: 142,
    description:
      "Crafted from 100% fine combed cotton. Features exquisite collar stitching, lightweight breathable drape, and enduring comfort for festive or everyday wear.",
    colors: [white, navy, black],
    sizes: panjabiSizes,
    images: [
      u("photo-1583391733956-3750e0ff4e8b"),
      u("photo-1617137984095-74e4e5e3613f"),
      u("photo-1602810318383-e386cc2a3ccf"),
    ],
    stock: 25,
    isBestDeal: true,
    isTrending: true,
  },
  {
    id: "panjabi-2",
    name: "Royal Jacquard Silk Kabli Panjabi Set",
    category: "panjabi",
    sub: "Kabli Suit Set",
    price: 2950,
    oldPrice: 3800,
    rating: 4.8,
    reviewCount: 96,
    description:
      "Regal jacquard weave with rich silk sheen. Comes complete with matching pajama trousers for Eid, Jummah, and formal occasions.",
    colors: [maroon, navy, olive],
    sizes: panjabiSizes,
    images: [
      u("photo-1617137984095-74e4e5e3613f"),
      u("photo-1583391733956-3750e0ff4e8b"),
    ],
    stock: 18,
    isBestDeal: false,
    isTrending: true,
  },
  {
    id: "panjabi-3",
    name: "Designer Embroidered Festive Panjabi",
    category: "panjabi",
    sub: "Fine Cotton",
    price: 2450,
    oldPrice: 3200,
    rating: 4.9,
    reviewCount: 88,
    description:
      "Intricate hand embroidery work along the placket and mandarin collar. Wrinkle-resistant premium fabric with sophisticated finish.",
    colors: [white, olive, gold],
    sizes: panjabiSizes,
    images: [
      u("photo-1602810318383-e386cc2a3ccf"),
      u("photo-1583391733956-3750e0ff4e8b"),
    ],
    stock: 22,
    isBestDeal: false,
    isTrending: false,
  },

  // 2. Shoes
  {
    id: "shoes-1",
    name: "Handcrafted Royal Nagra Shoes",
    category: "shoes",
    sub: "Nagra Shoes",
    price: 1650,
    oldPrice: 2200,
    rating: 4.8,
    reviewCount: 110,
    description:
      "Masterfully handcrafted traditional Nagra shoes. Designed with an ultra-soft padded insole for all-day comfort during celebrations.",
    colors: [black, maroon, gold],
    sizes: shoeSizes,
    images: [
      u("photo-1533867617858-e7b97e060509"),
      u("photo-1614252235316-8c857d38b5f4"),
    ],
    stock: 30,
    isBestDeal: true,
    isTrending: true,
  },
  {
    id: "shoes-2",
    name: "Premium Genuine Leather Loafers",
    category: "shoes",
    sub: "Leather Loafers",
    price: 2250,
    oldPrice: 2950,
    rating: 4.7,
    reviewCount: 75,
    description:
      "Authentic full-grain leather loafers with non-slip rubber grip outsole. Pairs effortlessly with both ethnic and Western attire.",
    colors: [black, navy],
    sizes: shoeSizes,
    images: [
      u("photo-1614252235316-8c857d38b5f4"),
      u("photo-1549298916-b41d501d3772"),
    ],
    stock: 20,
    isBestDeal: false,
    isTrending: true,
  },

  // 3. Watches
  {
    id: "watch-1",
    name: "Islamic Arabic Dial Golden Quartz Watch",
    category: "watch",
    sub: "Arabic Dial",
    price: 1950,
    oldPrice: 2650,
    rating: 4.9,
    reviewCount: 164,
    description:
      "Stunning Arabic numeral timepiece featuring a luxury gold-tone stainless steel bezel, scratch-resistant mineral glass, and water resistance.",
    colors: [gold, black],
    sizes: freeSize,
    images: [
      u("photo-1524805444758-089113d48a6d"),
      u("photo-1522335789203-aabd1fc54bc9"),
    ],
    stock: 25,
    isBestDeal: true,
    isTrending: true,
  },
  {
    id: "watch-2",
    name: "Royal Classic Leather Men's Watch",
    category: "watch",
    sub: "Leather Strap",
    price: 1750,
    oldPrice: 2350,
    rating: 4.8,
    reviewCount: 92,
    description:
      "Timeless minimalist dial paired with a genuine calfskin leather band. High precision quartz movement crafted for sophisticated gentlemen.",
    colors: [black],
    sizes: freeSize,
    images: [
      u("photo-1522335789203-aabd1fc54bc9"),
      u("photo-1524805444758-089113d48a6d"),
    ],
    stock: 15,
    isBestDeal: false,
    isTrending: false,
  },

  // 4. Attar
  {
    id: "attar-1",
    name: "Royal Musk Oud Premium Non-Alcoholic Attar (6ml)",
    category: "attar",
    sub: "Musk Oud",
    price: 850,
    oldPrice: 1200,
    rating: 5.0,
    reviewCount: 230,
    description:
      "100% alcohol-free concentrated perfume oil. Harmonious blend of rich Agarwood (Oud) and velvety Kashmiri musk with all-day sillage.",
    colors: [gold],
    sizes: ["6ml", "12ml"],
    images: [
      u("photo-1592945403244-b3fbafd7f539"),
      u("photo-1547887537-6158d64c35b3"),
    ],
    stock: 45,
    isBestDeal: true,
    isTrending: true,
  },
  {
    id: "attar-2",
    name: "Jannatul Ferdous Arabian Attar (12ml)",
    category: "attar",
    sub: "Jannatul Ferdous",
    price: 650,
    oldPrice: 950,
    rating: 4.9,
    reviewCount: 180,
    description:
      "Classic fresh floral and earthy Oriental notes. Non-staining formulation ideal for prayer times, Eid, and daily personal use.",
    colors: [gold],
    sizes: ["12ml"],
    images: [
      u("photo-1547887537-6158d64c35b3"),
      u("photo-1592945403244-b3fbafd7f539"),
    ],
    stock: 50,
    isBestDeal: false,
    isTrending: true,
  },

  // 5. Tupi
  {
    id: "tupi-1",
    name: "Omani Style Hand-Embroidered Prayer Cap",
    category: "tupi",
    sub: "Omani Style",
    price: 450,
    oldPrice: 650,
    rating: 4.9,
    reviewCount: 140,
    description:
      "Fine needlework embroidery on stiffened cotton. Provides a sharp, comfortable silhouette for prayer and formal gatherings.",
    colors: [white, navy, black],
    sizes: ["21", "21.5", "22", "22.5", "23"],
    images: [
      u("photo-1588850561407-ed78c282e89b"),
      u("photo-1576871337632-b9aef4c17ab9"),
    ],
    stock: 60,
    isBestDeal: false,
    isTrending: true,
  },
  {
    id: "tupi-2",
    name: "Turkish Velvet Prayer Cap",
    category: "tupi",
    sub: "Turkish Velvet",
    price: 350,
    oldPrice: 500,
    rating: 4.8,
    reviewCount: 95,
    description:
      "Soft plush velvet texture, easily foldable into your pocket. Comfortable stretch lining fits most head sizes comfortably.",
    colors: [black, navy, maroon],
    sizes: ["Free Size"],
    images: [
      u("photo-1576871337632-b9aef4c17ab9"),
      u("photo-1588850561407-ed78c282e89b"),
    ],
    stock: 75,
    isBestDeal: false,
    isTrending: false,
  },

  // 6. Shirt
  {
    id: "shirt-1",
    name: "Executive Cotton Formal Full Sleeve Shirt",
    category: "shirt",
    sub: "Formal Shirt",
    price: 1250,
    oldPrice: 1750,
    rating: 4.8,
    reviewCount: 115,
    description:
      "100% fine cotton weave with crisp point collar. Easy-iron finish makes it the ideal everyday business shirt.",
    colors: [white, navy],
    sizes: shirtSizes,
    images: [
      u("photo-1596755094514-f87e34085b2c"),
      u("photo-1603252109303-2751441dd157"),
    ],
    stock: 35,
    isBestDeal: false,
    isTrending: true,
  },
  {
    id: "shirt-2",
    name: "Casual Mandarin Collar Linen Shirt",
    category: "shirt",
    sub: "Mandarin Collar",
    price: 1150,
    oldPrice: 1600,
    rating: 4.7,
    reviewCount: 82,
    description:
      "Lightweight cotton-linen blend tailored with a modern Chinese mandarin collar. Breathable and relaxed for warm days.",
    colors: [white, olive],
    sizes: shirtSizes,
    images: [
      u("photo-1603252109303-2751441dd157"),
      u("photo-1596755094514-f87e34085b2c"),
    ],
    stock: 28,
    isBestDeal: false,
    isTrending: false,
  },

  // 7. Islamic Items
  {
    id: "islamic-1",
    name: "Turkish Velvet Luxury Prayer Rug (Janamaz)",
    category: "islamic",
    sub: "Velvet Prayer Rug",
    price: 1350,
    oldPrice: 1950,
    rating: 5.0,
    reviewCount: 190,
    description:
      "Authentic Turkish geometric arch design with deep pile plush velvet and dense foam underlay for gentle knee and head support.",
    colors: [maroon, navy, olive],
    sizes: freeSize,
    images: [
      u("photo-1564507592333-c60657eea523"),
      u("photo-1591604129939-f1efa4d9f7fa"),
    ],
    stock: 40,
    isBestDeal: true,
    isTrending: true,
  },
  {
    id: "islamic-2",
    name: "Digital Crystal Rechargeable Tasbih Counter",
    category: "islamic",
    sub: "Digital Tasbih",
    price: 450,
    oldPrice: 700,
    rating: 4.9,
    reviewCount: 160,
    description:
      "Sleek LED backlit finger counter with USB rechargeable battery, silence clicker, and durable crystal housing.",
    colors: [gold, white, black],
    sizes: freeSize,
    images: [
      u("photo-1591604129939-f1efa4d9f7fa"),
      u("photo-1564507592333-c60657eea523"),
    ],
    stock: 80,
    isBestDeal: false,
    isTrending: true,
  },
];

export const products: Product[] = seeds.map((s, i) => ({
  ...s,
  slug: s.slug || `nexora-${s.id}`,
  discountPercent: Math.round(((s.oldPrice - s.price) / s.oldPrice) * 100),
  createdAt: new Date(Date.UTC(2026, 9, 28 - i)).toISOString(),
}));

export const getProduct = (id: string) => products.find((p) => p.id === id);
export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);
