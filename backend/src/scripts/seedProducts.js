require("dotenv").config();

const crypto = require("crypto");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const User = require("../models/User");

const catalog = [
  ["Traditional Clothing", [
    ["Kanchipuram Silk Saree", "kanchipuram-silk-saree", 8500, "Handwoven silk saree with a traditional zari border.", 4.9, 18, "Pure silk and zari", "Kanchipuram, Tamil Nadu"],
    ["Madurai Sungudi Cotton Saree", "madurai-sungudi-cotton-saree", 2400, "Soft cotton saree with the traditional tie-dye dots of Madurai Sungudi craft.", 4.7, 12, "Cotton", "Madurai, Tamil Nadu"],
    ["Chettinad Cotton Saree", "chettinad-cotton-saree", 1850, "Breathable handloom cotton saree inspired by Chettinad colors.", 4.6, 8, "Cotton", "Chettinad, Tamil Nadu"],
    ["Salem Cotton Veshti", "salem-cotton-veshti", 950, "Classic white cotton veshti woven for everyday and festive wear.", 4.5, 6, "Cotton", "Salem, Tamil Nadu"],
    ["Arani Silk Dupatta", "arani-silk-dupatta", 1650, "Lightweight silk dupatta with a traditional woven border.", 4.4, 5, "Silk", "Arani, Tamil Nadu"],
    ["Handloom Cotton Kurta Fabric", "handloom-cotton-kurta-fabric", 780, "Soft handloom fabric suitable for a comfortable everyday kurta.", 4.3, 4, "Cotton", "Tamil Nadu"],
  ]],
  ["Handicrafts", [
    ["Swamimalai Bronze Kuthu Vilakku", "swamimalai-bronze-kuthu-vilakku", 3200, "Traditional lamp inspired by Swamimalai metal casting.", 4.8, 9, "Brass", "Swamimalai, Tamil Nadu"],
    ["Hand-carved Rosewood Golu Doll", "rosewood-golu-doll", 1450, "Hand-finished wooden figurine for festive displays and home decor.", 4.6, 7, "Rosewood", "Tamil Nadu"],
    ["Madurai Wood Carving", "madurai-wood-carving", 2200, "Decorative wood carving made by local craft workers.", 4.5, 5, "Wood", "Madurai, Tamil Nadu"],
    ["Palm Leaf Folk Toy", "palm-leaf-folk-toy", 420, "Handwoven palm leaf toy made with a traditional folk design.", 4.4, 4, "Palm leaf", "Tamil Nadu"],
    ["Stone Ganesha Sculpture", "stone-ganesha-sculpture", 2800, "Small hand-finished stone sculpture for a home altar.", 4.8, 6, "Stone", "Tamil Nadu"],
    ["Brass Urli Bowl", "brass-urli-bowl", 1950, "Decorative brass urli bowl inspired by traditional South Indian homes.", 4.7, 7, "Brass", "Tamil Nadu"],
  ]],
  ["Traditional Jewellery", [
    ["Vadasery Temple Jewellery Set", "vadasery-temple-jewellery-set", 2800, "Festive temple-inspired necklace and earring set.", 4.5, 8, "Brass alloy", "Vadasery, Tamil Nadu"],
    ["Kemp Stone Jhumka Earrings", "kemp-stone-jhumka-earrings", 950, "Traditional gold-tone jhumkas with red and green stone detailing.", 4.4, 15, "Brass alloy and stones", "Tamil Nadu"],
    ["Antique Coin Necklace", "antique-coin-necklace", 1350, "Traditional coin necklace with an antique finish.", 4.6, 7, "Brass alloy", "Tamil Nadu"],
    ["Temple Motif Bangles", "temple-motif-bangles", 780, "Pair of bangles decorated with classic temple motifs.", 4.3, 5, "Brass alloy", "Tamil Nadu"],
    ["Madurai Sungudi Fabric Earrings", "sungudi-fabric-earrings", 390, "Lightweight fabric earrings inspired by Madurai Sungudi patterns.", 4.2, 4, "Cotton and brass", "Madurai, Tamil Nadu"],
    ["Traditional Silver Toe Rings", "traditional-silver-toe-rings", 1150, "Simple traditional toe rings with a handcrafted finish.", 4.5, 6, "Silver", "Tamil Nadu"],
  ]],
  ["Traditional Food", [
    ["Kumbakonam Degree Coffee Blend", "kumbakonam-degree-coffee-blend", 420, "South Indian filter coffee blend prepared for a rich decoction.", 4.8, 31, "Coffee and chicory", "Kumbakonam, Tamil Nadu"],
    ["Organic Palm Jaggery", "organic-palm-jaggery", 280, "Traditional palm jaggery made in small batches.", 4.6, 19, "Palm jaggery", "Tamil Nadu"],
    ["Chettinad Spice Blend", "chettinad-spice-blend", 350, "Aromatic spice blend inspired by Chettinad home cooking.", 4.5, 11, "Spices", "Chettinad, Tamil Nadu"],
    ["Uthukuli Cow Ghee", "uthukuli-cow-ghee", 620, "Clarified butter prepared in the traditional style.", 4.7, 14, "Cow milk", "Uthukuli, Tamil Nadu"],
    ["Cold-Pressed Groundnut Oil", "cold-pressed-groundnut-oil", 540, "Small-batch groundnut oil for everyday cooking.", 4.4, 8, "Groundnut", "Tamil Nadu"],
    ["Traditional Millet Snack Mix", "traditional-millet-snack-mix", 260, "Crunchy snack mix made with regional millets.", 4.3, 9, "Millets", "Tamil Nadu"],
  ]],
  ["Home Decor", [
    ["Tanjore Gold Foil Art Print", "tanjore-gold-foil-art-print", 3600, "Devotional art print inspired by Tanjore painting.", 4.9, 11, "Wood panel and gold foil", "Thanjavur, Tamil Nadu"],
    ["Athangudi Handmade Tile Pair", "athangudi-handmade-tile-pair", 780, "Handmade tiles with geometric patterns inspired by Chettinad homes.", 4.5, 6, "Cement and natural pigments", "Athangudi, Tamil Nadu"],
    ["Brass Pooja Bell", "brass-pooja-bell", 680, "Hand-finished brass bell for a prayer room or entryway.", 4.6, 5, "Brass", "Tamil Nadu"],
    ["Palm Leaf Wall Basket", "palm-leaf-wall-basket", 520, "Woven wall basket for lightweight home storage.", 4.4, 7, "Palm leaf", "Chettinad, Tamil Nadu"],
    ["Hand-Painted Wooden Tray", "hand-painted-wooden-tray", 1250, "Decorative serving tray with a traditional hand-painted pattern.", 4.5, 4, "Wood", "Tamil Nadu"],
    ["Cotton Door Toran", "cotton-door-toran", 460, "Colorful handmade cotton toran for festive home decor.", 4.3, 6, "Cotton", "Tamil Nadu"],
  ]],
  ["Pottery and Terracotta", [
    ["Manamadurai Clay Water Pot", "manamadurai-clay-water-pot", 650, "Naturally porous clay pot shaped by local potters.", 4.7, 14, "Natural clay", "Manamadurai, Tamil Nadu"],
    ["Hand-thrown Terracotta Planter", "hand-thrown-terracotta-planter", 520, "Hand-thrown planter with a warm natural finish.", 4.3, 10, "Terracotta", "Tamil Nadu"],
    ["Terracotta Oil Lamp Set", "terracotta-oil-lamp-set", 340, "Set of small clay oil lamps for festive occasions.", 4.5, 8, "Terracotta", "Tamil Nadu"],
    ["Clay Cooking Pot", "clay-cooking-pot", 890, "Traditional clay cooking pot for slow-cooked meals.", 4.6, 9, "Natural clay", "Tamil Nadu"],
    ["Terracotta Garden Figurine", "terracotta-garden-figurine", 740, "Hand-shaped garden figurine with a natural clay finish.", 4.4, 5, "Terracotta", "Tamil Nadu"],
    ["Decorative Clay Water Cup Set", "decorative-clay-water-cup-set", 420, "Set of reusable clay cups for serving cool water.", 4.2, 6, "Natural clay", "Tamil Nadu"],
  ]],
  ["Pooja Items", [
    ["Nachiarkoil Brass Pooja Thali", "nachiarkoil-brass-pooja-thali", 1850, "Traditional brass worship plate from the Nachiarkoil metalware tradition.", 4.8, 13, "Brass", "Nachiarkoil, Tamil Nadu"],
    ["Brass Kuthu Vilakku Pair", "brass-kuthu-vilakku-pair", 2600, "Pair of traditional standing oil lamps for prayer and festivals.", 4.7, 8, "Brass", "Tamil Nadu"],
    ["Brass Temple Bell", "brass-temple-bell", 720, "Hand-finished brass bell for daily prayer.", 4.6, 7, "Brass", "Tamil Nadu"],
    ["Camphor Aarti Plate", "camphor-aarti-plate", 560, "Small brass plate for camphor aarti and daily worship.", 4.4, 6, "Brass", "Tamil Nadu"],
    ["Brass Deepam Stand", "brass-deepam-stand", 1120, "Traditional brass deepam stand with a simple polished finish.", 4.5, 5, "Brass", "Tamil Nadu"],
    ["Pooja Kumkum Box Set", "pooja-kumkum-box-set", 390, "Set of small containers for kumkum and turmeric.", 4.3, 4, "Brass alloy", "Tamil Nadu"],
  ]],
  ["Eco-Friendly Products", [
    ["Chettinad Palm Leaf Basket", "chettinad-palm-leaf-basket", 480, "Lightweight woven storage basket made from palm leaves.", 4.6, 16, "Palm leaf", "Chettinad, Tamil Nadu"],
    ["Coconut Shell Serving Cup Set", "coconut-shell-serving-cup-set", 360, "Reusable serving cups shaped from coconut shells.", 4.4, 9, "Coconut shell", "Tamil Nadu"],
    ["Palm Leaf Storage Box", "palm-leaf-storage-box", 520, "Handwoven box for storing small household items.", 4.5, 7, "Palm leaf", "Tamil Nadu"],
    ["Bamboo Table Basket", "bamboo-table-basket", 440, "Reusable woven basket for serving or organizing household items.", 4.3, 6, "Bamboo", "Tamil Nadu"],
    ["Coconut Fiber Bath Scrubber", "coconut-fiber-bath-scrubber", 180, "Plastic-free bath scrubber made with natural coconut fiber.", 4.2, 8, "Coconut fiber", "Tamil Nadu"],
    ["Palm Leaf Coaster Set", "palm-leaf-coaster-set", 260, "Set of woven palm leaf coasters for everyday use.", 4.4, 5, "Palm leaf", "Tamil Nadu"],
  ]],
];

const products = catalog.flatMap(([category, items]) => items.map(([name, slug, price, description, averageRating, totalReviews, material, origin]) => ({
  name,
  slug,
  description,
  category,
  price,
  averageRating,
  totalReviews,
  material,
  origin,
})));

async function seedProducts() {
  await mongoose.connect(process.env.MONGODB_URI);

  let seller = await User.findOne({ email: "catalog-seller@nammacart.local" });
  if (!seller) {
    seller = await User.create({
      fullName: "NammaCart Artisan Collective",
      email: "catalog-seller@nammacart.local",
      password: crypto.randomBytes(24).toString("hex"),
      role: "SELLER",
      sellerDetails: {
        shopName: "NammaCart Artisan Collective",
        shopDescription: "Development sample catalog for Tamil Nadu artisan products.",
        businessAddress: "Tamil Nadu, India",
        approvalStatus: "APPROVED",
      },
    });
  }

  let added = 0;
  let updated = 0;
  let skipped = 0;
  for (const item of products) {
    const existing = await Product.findOne({ slug: item.slug });
    if (existing && existing.seller.toString() !== seller._id.toString()) {
      skipped += 1;
      continue;
    }

    const values = {
      ...item,
      seller: seller._id,
      images: item.image ? [item.image] : [],
      discountPrice: 0,
      stock: 20,
      isHandmade: true,
      isFeatured: false,
      isActive: true,
    };

    if (existing) {
      Object.assign(existing, values);
      await existing.save();
      updated += 1;
    } else {
      await Product.create(values);
      added += 1;
    }
  }

  const counts = await Promise.all(catalog.map(async ([category]) => ({
    category,
    count: await Product.countDocuments({ category, seller: seller._id, isActive: true }),
  })));
  console.log(JSON.stringify({ added, updated, skipped, sampleSellerProducts: counts }, null, 2));
}

seedProducts().catch((error) => {
  console.error("Could not seed sample products:", error.message);
  process.exitCode = 1;
}).finally(async () => {
  await mongoose.disconnect();
});
