import { count, eq, isNull } from 'drizzle-orm';
import { db } from './index.ts';
import {
  adminUsers,
  galleryImages,
  menuCategories,
  menuItems,
  restaurantSettings,
  restaurantTables,
} from './schema.ts';

let seeded = false;
let seedPromise: Promise<void> | null = null;

const CATALOG_VERSION = 'v2_full_menu_2026';

interface SeedItemInput {
  categorySlug: string;
  name: string;
  description: string;
  priceInr: number;
  isVeg: boolean;
}

const FULL_MENU_ITEMS: SeedItemInput[] = [
  // 1. Combos (19)
  {
    categorySlug: 'combos',
    name: 'Paneer Butter Masala With 2 Tandoori Roti',
    description: 'Paneer Butter Masala + 2 Tandoori Roti.',
    priceInr: 300,
    isVeg: true,
  },
  {
    categorySlug: 'combos',
    name: 'Butter Chicken Masala With 2 Butter Naan',
    description: 'Butter Chicken Masala + 2 Butter Naan.',
    priceInr: 330,
    isVeg: false,
  },
  {
    categorySlug: 'combos',
    name: 'Chicken Biryani With Chicken Kebab',
    description: 'Chicken Biryani + Chicken Kebab.',
    priceInr: 380,
    isVeg: false,
  },
  {
    categorySlug: 'combos',
    name: 'Mutton Combo',
    description:
      'Mutton Biryani + Chicken Kebab (2 Pieces) + Chilli Chicken (2 Pieces) + Egg.',
    priceInr: 370,
    isVeg: false,
  },
  {
    categorySlug: 'combos',
    name: 'Chicken Combo',
    description:
      'Chicken Biryani + Chicken Kebab (2 Pieces) + Chilli Chicken (2 Pieces) + Egg.',
    priceInr: 300,
    isVeg: false,
  },
  {
    categorySlug: 'combos',
    name: 'Chicken Meal',
    description:
      'Ragi Ball (1 Piece) + Rice (Half) + Chicken Masala + Chicken Liver Fry + 1 Boiled Egg.',
    priceInr: 220,
    isVeg: false,
  },
  {
    categorySlug: 'combos',
    name: 'Mutton Meal',
    description:
      'Ragi Ball (1 Piece) + Rice (Half) + Mutton Masala + Chicken Liver (2 Pieces) + Boiled Egg (1 Egg).',
    priceInr: 320,
    isVeg: false,
  },
  {
    categorySlug: 'combos',
    name: 'Keema Meal',
    description:
      'Ragi Ball (1 Piece) + Rice (Half) + Keema Masala + Chicken Kebab or Liver (2 Pieces) + Boiled Egg (1 Egg).',
    priceInr: 250,
    isVeg: false,
  },
  {
    categorySlug: 'combos',
    name: 'Mutton Boti Fry',
    description:
      'Spicy and flavorful mutton boti fry made with tender mutton pieces tossed in aromatic spices, fresh herbs, and a delicious masala coating.',
    priceInr: 230,
    isVeg: false,
  },
  {
    categorySlug: 'combos',
    name: 'Mutton Boti Masala',
    description:
      'Tender mutton boti pieces cooked in a rich, spicy masala gravy with onions, tomatoes, and aromatic Indian spices.',
    priceInr: 240,
    isVeg: false,
  },
  {
    categorySlug: 'combos',
    name: 'Kasturi Chicken',
    description: 'Nati style chicken tossed with fragrant kasuri methi and house spices.',
    priceInr: 220,
    isVeg: false,
  },
  {
    categorySlug: 'combos',
    name: 'Karibevu Chicken',
    description: 'Nati style chicken prepared with fresh curry leaves and roasted spices.',
    priceInr: 220,
    isVeg: false,
  },
  {
    categorySlug: 'combos',
    name: 'Mutton Keema Fry',
    description:
      'Finely minced mutton tossed with onions, tomatoes, ginger, garlic, and aromatic Indian spices.',
    priceInr: 240,
    isVeg: false,
  },
  {
    categorySlug: 'combos',
    name: 'Mutton Keema Masala',
    description:
      'Minced mutton cooked with onions, tomatoes, ginger, garlic, and a rich blend of aromatic Indian spices.',
    priceInr: 240,
    isVeg: false,
  },
  {
    categorySlug: 'combos',
    name: 'Egg Boti Fry',
    description: 'Mutton boti sautéed with egg and bold traditional spices.',
    priceInr: 250,
    isVeg: false,
  },
  {
    categorySlug: 'combos',
    name: 'Chicken Kebab (Half) With 1 Tandoori Roti',
    description:
      'Succulent chicken kebab (Half) grilled with aromatic spices, paired with 1 Tandoori Roti.',
    priceInr: 220,
    isVeg: false,
  },
  {
    categorySlug: 'combos',
    name: 'Chicken Korma (Half) With 1 Tandoori Roti',
    description:
      'Flavourful South Indian-style chicken curry (Half) with traditional masalas, paired with 1 Tandoori Roti.',
    priceInr: 230,
    isVeg: false,
  },
  {
    categorySlug: 'combos',
    name: 'Chicken Korma (Half) With 1 Butter Naan',
    description:
      'Flavourful South Indian-style chicken curry (Half) with traditional masalas, paired with 1 Butter Naan.',
    priceInr: 230,
    isVeg: false,
  },
  {
    categorySlug: 'combos',
    name: 'Chicken Kebab (Half) With 1 Butter Naan',
    description:
      'Succulent chicken kebab (Half) grilled with aromatic spices, paired with 1 Butter Naan.',
    priceInr: 230,
    isVeg: false,
  },

  // 2. Main Course (28)
  {
    categorySlug: 'main-course',
    name: 'Mutton Chops',
    description:
      'Tender mutton chops marinated in aromatic spices and herbs, cooked to perfection for a rich, juicy texture and bold flavor.',
    priceInr: 300,
    isVeg: false,
  },
  {
    categorySlug: 'main-course',
    name: 'Butter Chicken Masala',
    description:
      'Creamy, rich butter chicken masala made with tender chicken pieces simmered in a buttery tomato gravy.',
    priceInr: 250,
    isVeg: false,
  },
  {
    categorySlug: 'main-course',
    name: 'Kadhai Chicken',
    description:
      'Tender chicken pieces cooked in a rich kadai masala with capsicum, onions, tomatoes, and freshly ground spices.',
    priceInr: 230,
    isVeg: false,
  },
  {
    categorySlug: 'main-course',
    name: 'Chicken Tikka Masala',
    description:
      'Juicy chicken tikka pieces simmered in a rich, creamy tomato gravy blended with aromatic spices and herbs.',
    priceInr: 260,
    isVeg: false,
  },
  {
    categorySlug: 'main-course',
    name: 'Chicken Kolhapuri',
    description:
      'Spicy and flavorful Chicken Kolhapuri prepared with tender chicken pieces in a fiery gravy of roasted spices and coconut.',
    priceInr: 230,
    isVeg: false,
  },
  {
    categorySlug: 'main-course',
    name: 'Chicken Masala',
    description:
      'Tender chicken pieces cooked in a rich masala gravy blended with aromatic spices, fresh herbs, and balanced flavors.',
    priceInr: 230,
    isVeg: false,
  },
  {
    categorySlug: 'main-course',
    name: 'Special Chicken Masala',
    description:
      'Signature chicken delicacy prepared with tender chicken pieces, special house spices, and a rich flavourful masala.',
    priceInr: 280,
    isVeg: false,
  },
  {
    categorySlug: 'main-course',
    name: 'Guntur Chicken',
    description:
      'Spicy Guntur chicken prepared with tender chicken pieces tossed in fiery Guntur chillies and aromatic spices.',
    priceInr: 250,
    isVeg: false,
  },
  {
    categorySlug: 'main-course',
    name: 'Mutton Masala',
    description:
      'Juicy mutton pieces simmered in a rich masala gravy made with onions, tomatoes, and traditional Indian spices.',
    priceInr: 300,
    isVeg: false,
  },
  {
    categorySlug: 'main-course',
    name: 'Mutton Sambar',
    description:
      'Authentic Nati-style mutton sambar crafted to pair with ragi ball and white rice.',
    priceInr: 320,
    isVeg: false,
  },
  {
    categorySlug: 'main-course',
    name: 'Chicken Sambar',
    description:
      'Authentic Nati-style chicken sambar crafted to pair with ragi ball and white rice.',
    priceInr: 230,
    isVeg: false,
  },
  {
    categorySlug: 'main-course',
    name: 'Chicken Fry',
    description:
      'Crispy and juicy chicken fry marinated in aromatic spices and herbs, fried to golden perfection.',
    priceInr: 200,
    isVeg: false,
  },
  {
    categorySlug: 'main-course',
    name: 'Mutton Boti Masala',
    description:
      'Tender mutton boti pieces cooked in a rich, spicy masala gravy with onions, tomatoes, and aromatic spices.',
    priceInr: 240,
    isVeg: false,
  },
  {
    categorySlug: 'main-course',
    name: 'Mutton Keema Masala',
    description:
      'Minced mutton cooked with onions, tomatoes, ginger, garlic, and a hearty blend of aromatic Indian spices.',
    priceInr: 240,
    isVeg: false,
  },
  {
    categorySlug: 'main-course',
    name: 'Kaju Masala',
    description:
      'Cashew nuts cooked in a rich, creamy tomato-onion gravy blended with aromatic Indian spices and fresh herbs.',
    priceInr: 260,
    isVeg: true,
  },
  {
    categorySlug: 'main-course',
    name: 'Paneer Tikka Masala',
    description:
      'Soft paneer cubes marinated in yoghurt and spices, char-grilled and simmered in a creamy tomato-onion gravy.',
    priceInr: 270,
    isVeg: true,
  },
  {
    categorySlug: 'main-course',
    name: 'Paneer Butter Masala',
    description:
      'Soft paneer cubes simmered in a rich buttery tomato gravy blended with aromatic spices and fresh cream.',
    priceInr: 230,
    isVeg: true,
  },
  {
    categorySlug: 'main-course',
    name: 'Palak Paneer',
    description:
      'North Indian curry made with soft paneer cubes simmered in a rich, creamy spinach gravy.',
    priceInr: 240,
    isVeg: true,
  },
  {
    categorySlug: 'main-course',
    name: 'Veg Kadhai',
    description:
      'Fresh mixed vegetables cooked with capsicum, onions, tomatoes, and aromatic kadai spices.',
    priceInr: 200,
    isVeg: true,
  },
  {
    categorySlug: 'main-course',
    name: 'Mushroom Masala',
    description:
      'Tender mushrooms cooked in a rich gravy with aromatic spices, onions, tomatoes, and fresh herbs.',
    priceInr: 200,
    isVeg: true,
  },
  {
    categorySlug: 'main-course',
    name: 'Mushroom Kadhai',
    description:
      'Fresh mushrooms cooked with capsicum, onions, tomatoes, and freshly ground kadai spices.',
    priceInr: 220,
    isVeg: true,
  },
  {
    categorySlug: 'main-course',
    name: 'Kadhai Paneer',
    description:
      'Soft paneer cubes cooked with capsicum, onions, tomatoes, and freshly ground kadai spices.',
    priceInr: 270,
    isVeg: true,
  },
  {
    categorySlug: 'main-course',
    name: 'Veg Kolhapuri',
    description:
      'Spicy mixed vegetable curry prepared with fresh vegetables, aromatic spices, and rich Maharashtrian masala gravy.',
    priceInr: 200,
    isVeg: true,
  },
  {
    categorySlug: 'main-course',
    name: 'Veg Hyderabadi',
    description:
      'Rich and creamy vegetable curry made with fresh vegetables, aromatic spices, and Hyderabadi flavours.',
    priceInr: 200,
    isVeg: true,
  },
  {
    categorySlug: 'main-course',
    name: 'Dal Fry',
    description:
      'Yellow lentils cooked with onions, tomatoes, garlic, and aromatic Indian spices finished with tempering.',
    priceInr: 130,
    isVeg: true,
  },
  {
    categorySlug: 'main-course',
    name: 'Dal Tadka',
    description:
      'Comforting yellow dal prepared with aromatic spices, onions, tomatoes, and a tempering of ghee, garlic, and cumin.',
    priceInr: 150,
    isVeg: true,
  },
  {
    categorySlug: 'main-course',
    name: 'Aloo Matar Masala',
    description:
      'Tender potatoes and green peas cooked in a rich tomato-onion gravy blended with aromatic spices.',
    priceInr: 220,
    isVeg: true,
  },
  {
    categorySlug: 'main-course',
    name: 'Chana Masala',
    description:
      'Soft chickpeas cooked in a rich onion-tomato gravy with freshly ground spices and herbs.',
    priceInr: 200,
    isVeg: true,
  },

  // 3. Breads (10)
  {
    categorySlug: 'breads',
    name: 'Paneer Kulcha',
    description:
      'Soft and fluffy kulcha stuffed with spiced paneer and fresh herbs, cooked to golden perfection.',
    priceInr: 70,
    isVeg: true,
  },
  {
    categorySlug: 'breads',
    name: 'Lachha Parotta',
    description:
      'Crispy, flaky, layered Indian flatbread folded and rolled to create multiple soft layers.',
    priceInr: 60,
    isVeg: true,
  },
  {
    categorySlug: 'breads',
    name: '1 Tandoori Roti',
    description:
      'Whole wheat tandoori roti baked in a traditional clay tandoor for crisp edges and smoky flavour.',
    priceInr: 40,
    isVeg: true,
  },
  {
    categorySlug: 'breads',
    name: 'Butter Roti',
    description:
      'Soft freshly prepared tandoori roti brushed with rich melted butter.',
    priceInr: 45,
    isVeg: true,
  },
  {
    categorySlug: 'breads',
    name: 'Butter Naan',
    description:
      'Soft and fluffy tandoor-baked naan brushed generously with melted butter.',
    priceInr: 50,
    isVeg: true,
  },
  {
    categorySlug: 'breads',
    name: 'Plain Naan',
    description:
      'Soft, fluffy, freshly baked Indian flatbread with a light golden finish.',
    priceInr: 40,
    isVeg: true,
  },
  {
    categorySlug: 'breads',
    name: 'Garlic Naan',
    description:
      'Freshly baked naan topped with chopped garlic, fresh coriander, and butter.',
    priceInr: 50,
    isVeg: true,
  },
  {
    categorySlug: 'breads',
    name: 'Plain Kulcha',
    description:
      'Soft, fluffy Indian flatbread with a mildly crisp texture, perfect for curries.',
    priceInr: 40,
    isVeg: true,
  },
  {
    categorySlug: 'breads',
    name: 'Butter Kulcha',
    description:
      'Soft, fluffy kulcha brushed with rich, melted butter.',
    priceInr: 50,
    isVeg: true,
  },
  {
    categorySlug: 'breads',
    name: 'Masala Kulcha',
    description:
      'Soft and fluffy kulcha stuffed and topped with aromatic spices, herbs, and seasonings.',
    priceInr: 60,
    isVeg: true,
  },

  // 4. Rice & Biryani (11)
  {
    categorySlug: 'rice',
    name: 'Veg Biryani',
    description:
      'Fragrant rice cooked with fresh vegetables and a rich blend of traditional spices and herbs.',
    priceInr: 150,
    isVeg: true,
  },
  {
    categorySlug: 'rice',
    name: 'Egg Biryani',
    description:
      'Aromatic basmati rice prepared with boiled eggs and a blend of rich spices and herbs.',
    priceInr: 160,
    isVeg: false,
  },
  {
    categorySlug: 'rice',
    name: 'Chicken Biryani',
    description:
      'Fragrant long-grain basmati rice layered with tender chicken, traditional spices, coriander, and mint.',
    priceInr: 220,
    isVeg: false,
  },
  {
    categorySlug: 'rice',
    name: 'Mutton Biryani',
    description:
      'Aromatic mutton biryani made with tender juicy mutton, fragrant basmati rice, and traditional spices.',
    priceInr: 320,
    isVeg: false,
  },
  {
    categorySlug: 'rice',
    name: 'Curd Rice',
    description:
      'Refreshing curd rice made with soft rice, creamy yogurt, and a tempering of mustard seeds and curry leaves.',
    priceInr: 100,
    isVeg: true,
  },
  {
    categorySlug: 'rice',
    name: 'Plain Rice',
    description: 'Steamed rice, served hot and fluffy.',
    priceInr: 70,
    isVeg: true,
  },
  {
    categorySlug: 'rice',
    name: 'Tomato Rice',
    description:
      'Fragrant South Indian tomato rice prepared with juicy tomatoes, aromatic spices, and fresh herbs.',
    priceInr: 130,
    isVeg: true,
  },
  {
    categorySlug: 'rice',
    name: 'Palak Rice',
    description:
      'Healthy and flavorful rice prepared with fresh spinach, aromatic spices, and herbs.',
    priceInr: 140,
    isVeg: true,
  },
  {
    categorySlug: 'rice',
    name: 'Jeera Rice',
    description:
      'Fragrant basmati rice tempered with aromatic cumin seeds, ghee, and subtle spices.',
    priceInr: 130,
    isVeg: true,
  },
  {
    categorySlug: 'rice',
    name: 'Ghee Rice',
    description:
      'Fragrant basmati rice cooked with rich ghee, whole spices, and fresh herbs.',
    priceInr: 150,
    isVeg: true,
  },
  {
    categorySlug: 'rice',
    name: 'Biryani Rice',
    description:
      'Aromatic biryani rice cooked with fragrant spices and herbs.',
    priceInr: 140,
    isVeg: true,
  },

  // 5. Fried Rice & Noodles (10)
  {
    categorySlug: 'fried-rice-noodles',
    name: 'Veg Hakka Noodles',
    description:
      'Veg Hakka noodles stir-fried with fresh vegetables, aromatic spices, and flavorful Indo-Chinese sauces.',
    priceInr: 170,
    isVeg: true,
  },
  {
    categorySlug: 'fried-rice-noodles',
    name: 'Chicken Hakka Noodles',
    description:
      'Chicken Hakka noodles tossed with tender chicken, fresh vegetables, and savory Indo-Chinese sauces.',
    priceInr: 210,
    isVeg: false,
  },
  {
    categorySlug: 'fried-rice-noodles',
    name: 'Veg Fried Rice',
    description:
      'Wok-tossed fried rice with fresh vegetables, aromatic spices, and savory sauces.',
    priceInr: 140,
    isVeg: true,
  },
  {
    categorySlug: 'fried-rice-noodles',
    name: 'Mushroom Fried Rice',
    description:
      'Wok-tossed fried rice with fresh mushrooms, crisp vegetables, aromatic spices, and savory sauces.',
    priceInr: 170,
    isVeg: true,
  },
  {
    categorySlug: 'fried-rice-noodles',
    name: 'Paneer Fried Rice',
    description:
      'Wok-tossed fried rice with soft paneer cubes, fresh vegetables, and aromatic Indo-Chinese sauces.',
    priceInr: 220,
    isVeg: true,
  },
  {
    categorySlug: 'fried-rice-noodles',
    name: 'Gobi Fried Rice',
    description:
      'Wok-tossed fried rice with fresh cauliflower, crisp vegetables, and flavorful sauces.',
    priceInr: 140,
    isVeg: true,
  },
  {
    categorySlug: 'fried-rice-noodles',
    name: 'Egg Fried Rice',
    description:
      'Wok-tossed fried rice with scrambled eggs, fresh vegetables, and aromatic sauces.',
    priceInr: 150,
    isVeg: false,
  },
  {
    categorySlug: 'fried-rice-noodles',
    name: 'Egg Schezwan Fried Rice',
    description:
      'Spicy fried rice tossed with scrambled eggs, fresh vegetables, and bold Schezwan sauce.',
    priceInr: 160,
    isVeg: false,
  },
  {
    categorySlug: 'fried-rice-noodles',
    name: 'Chicken Fried Rice',
    description:
      'Wok-tossed fried rice with tender chicken, fresh veggies, and aromatic spices.',
    priceInr: 200,
    isVeg: false,
  },
  {
    categorySlug: 'fried-rice-noodles',
    name: 'Chicken Schezwan Fried Rice',
    description:
      'Spicy Schezwan chicken fried rice tossed with tender chicken, fresh veggies, and bold Schezwan sauce.',
    priceInr: 220,
    isVeg: false,
  },

  // 6. Starters (14)
  {
    categorySlug: 'starters',
    name: 'Chilli Egg',
    description:
      'Crispy egg pieces tossed with spicy chilli sauce, fresh capsicum, onions, and aromatic seasonings.',
    priceInr: 150,
    isVeg: false,
  },
  {
    categorySlug: 'starters',
    name: 'Egg Manchurian',
    description:
      'Boiled eggs tossed in a spicy, tangy Manchurian sauce with garlic, onions, capsicum, and spices.',
    priceInr: 150,
    isVeg: false,
  },
  {
    categorySlug: 'starters',
    name: 'Egg Pepper Dry',
    description:
      'Boiled eggs tossed in freshly crushed black pepper, aromatic spices, onions, and herbs.',
    priceInr: 150,
    isVeg: false,
  },
  {
    categorySlug: 'starters',
    name: 'Chicken Lollipop (5pc)',
    description:
      'Crispy chicken lollipops tossed in flavorful spices, crunchy on the outside and juicy inside.',
    priceInr: 210,
    isVeg: false,
  },
  {
    categorySlug: 'starters',
    name: 'Chicken Manchurian',
    description:
      'Juicy chicken pieces tossed in a spicy, tangy Manchurian sauce with garlic, onions, and capsicum.',
    priceInr: 230,
    isVeg: false,
  },
  {
    categorySlug: 'starters',
    name: 'Chilli Chicken',
    description:
      'Tender chicken pieces tossed in a spicy blend of chillies, garlic, onions, and tangy sauces.',
    priceInr: 230,
    isVeg: false,
  },
  {
    categorySlug: 'starters',
    name: 'Chicken 65',
    description:
      'Crispy Chicken 65 marinated in aromatic spices, curry leaves, and herbs, fried to golden perfection.',
    priceInr: 230,
    isVeg: false,
  },
  {
    categorySlug: 'starters',
    name: 'Chicken Pepper Dry',
    description:
      'Tender chicken pieces tossed in freshly crushed black pepper, aromatic spices, onions, and herbs.',
    priceInr: 240,
    isVeg: false,
  },
  {
    categorySlug: 'starters',
    name: 'Lemon Chicken',
    description:
      'Juicy chicken pieces tossed with fresh lemon juice, aromatic spices, and herbs for a zesty finish.',
    priceInr: 260,
    isVeg: false,
  },
  {
    categorySlug: 'starters',
    name: 'Chicken Kebab',
    description:
      'Juicy, smoky, perfectly grilled chicken kebabs packed with rich spices and authentic flavors.',
    priceInr: 180,
    isVeg: false,
  },
  {
    categorySlug: 'starters',
    name: 'Chicken Ghee Roast',
    description:
      'Juicy chicken roasted in rich ghee with a spicy Mangalorean blend of traditional spices and herbs.',
    priceInr: 240,
    isVeg: false,
  },
  {
    categorySlug: 'starters',
    name: 'Garlic Chicken',
    description:
      'Tender chicken pieces tossed in a bold blend of fresh garlic, aromatic spices, herbs, and sauces.',
    priceInr: 230,
    isVeg: false,
  },
  {
    categorySlug: 'starters',
    name: 'Hallikatte Special Chicken',
    description:
      'Signature chicken delicacy prepared with tender chicken pieces, special house spices, and rich masala.',
    priceInr: 270,
    isVeg: false,
  },
  {
    categorySlug: 'starters',
    name: 'Chicken Tikka (BBQ)',
    description:
      'Juicy chicken pieces marinated in creamy yogurt, spices, and herbs, char-grilled for smoky aroma.',
    priceInr: 280,
    isVeg: false,
  },

  // 7. Rolls (8)
  {
    categorySlug: 'rolls',
    name: 'Veg Roll',
    description:
      'Soft roll stuffed with fresh crunchy vegetables, aromatic spices, and flavorful sauces.',
    priceInr: 100,
    isVeg: true,
  },
  {
    categorySlug: 'rolls',
    name: 'Paneer Roll',
    description:
      'Soft flatbread stuffed with paneer cubes, fresh vegetables, aromatic spices, and sauces.',
    priceInr: 170,
    isVeg: true,
  },
  {
    categorySlug: 'rolls',
    name: 'Mushroom Roll',
    description:
      'Soft roll stuffed with flavorful mushrooms, fresh vegetables, aromatic spices, and sauces.',
    priceInr: 140,
    isVeg: true,
  },
  {
    categorySlug: 'rolls',
    name: 'Egg Roll',
    description:
      'Soft flaky wrap filled with freshly cooked egg, crunchy vegetables, and flavorful sauces.',
    priceInr: 90,
    isVeg: false,
  },
  {
    categorySlug: 'rolls',
    name: 'Double Egg Roll',
    description:
      'Soft flaky paratha filled with two eggs, crunchy vegetables, aromatic spices, and sauces.',
    priceInr: 140,
    isVeg: false,
  },
  {
    categorySlug: 'rolls',
    name: 'Chicken Roll',
    description:
      'Soft flaky roll stuffed with juicy spiced chicken pieces, fresh vegetables, and sauces.',
    priceInr: 150,
    isVeg: false,
  },
  {
    categorySlug: 'rolls',
    name: 'Egg Chicken Roll',
    description:
      'Soft paratha filled with juicy chicken pieces and freshly cooked egg with crunchy vegetables.',
    priceInr: 170,
    isVeg: false,
  },
  {
    categorySlug: 'rolls',
    name: 'Baby Corn Roll',
    description:
      'Crispy baby corn wrapped with fresh ingredients, flavorful spices, and house sauces.',
    priceInr: 140,
    isVeg: true,
  },

  // 8. Snacks (9)
  {
    categorySlug: 'snacks',
    name: 'Veg Nuggets',
    description:
      'Crispy golden vegetable nuggets served hot with tangy dipping sauce.',
    priceInr: 110,
    isVeg: true,
  },
  {
    categorySlug: 'snacks',
    name: 'French Fries',
    description:
      'Crispy golden French fries with a soft, fluffy center and classic seasoning.',
    priceInr: 120,
    isVeg: true,
  },
  {
    categorySlug: 'snacks',
    name: 'Masala French Fries',
    description:
      'Crispy golden French fries tossed in aromatic spices and tangy masala seasoning.',
    priceInr: 120,
    isVeg: true,
  },
  {
    categorySlug: 'snacks',
    name: 'Egg Pakoda',
    description:
      'Boiled egg pieces coated in a spiced gram flour batter and fried to golden crispiness.',
    priceInr: 150,
    isVeg: false,
  },
  {
    categorySlug: 'snacks',
    name: 'Omelette',
    description:
      'Fluffy omelette prepared with fresh eggs, chopped onions, green chillies, and spices.',
    priceInr: 100,
    isVeg: false,
  },
  {
    categorySlug: 'snacks',
    name: 'Boiled Egg (2pc)',
    description:
      'Freshly boiled eggs (2 pieces), warm and lightly seasoned.',
    priceInr: 50,
    isVeg: false,
  },
  {
    categorySlug: 'snacks',
    name: 'Chicken Nuggets',
    description:
      'Bite-sized pieces of tender chicken coated in a crispy seasoning and fried golden.',
    priceInr: 150,
    isVeg: false,
  },
  {
    categorySlug: 'snacks',
    name: 'Egg Bhurji',
    description:
      'Fresh eggs scrambled with onions, tomatoes, green chillies, and aromatic Indian spices.',
    priceInr: 100,
    isVeg: false,
  },
  {
    categorySlug: 'snacks',
    name: 'Chicken Popcorn',
    description:
      'Bite-sized pieces of crispy seasoned chicken fried to golden perfection.',
    priceInr: 150,
    isVeg: false,
  },

  // 9. Soups (9)
  {
    categorySlug: 'soups',
    name: 'Veg Manchow Soup',
    description:
      'Hot and comforting veg Manchow soup prepared with fresh vegetables, garlic, ginger, and spices.',
    priceInr: 100,
    isVeg: true,
  },
  {
    categorySlug: 'soups',
    name: 'Tomato Soup',
    description:
      'Warm, creamy soup made with fresh tomatoes, herbs, and mild spices.',
    priceInr: 120,
    isVeg: true,
  },
  {
    categorySlug: 'soups',
    name: 'Veg Hot & Sour Soup',
    description:
      'Indo-Chinese soup prepared with fresh vegetables, aromatic spices, and a tangy, spicy broth.',
    priceInr: 100,
    isVeg: true,
  },
  {
    categorySlug: 'soups',
    name: 'Chicken Manchow Soup',
    description:
      'Hot and comforting chicken Manchow soup with tender chicken, fresh vegetables, garlic, and spices.',
    priceInr: 150,
    isVeg: false,
  },
  {
    categorySlug: 'soups',
    name: 'Chicken Hot & Sour Soup',
    description:
      'Tender chicken, fresh vegetables, garlic, and spices simmered in a spicy and tangy broth.',
    priceInr: 150,
    isVeg: false,
  },
  {
    categorySlug: 'soups',
    name: 'Leg Soup',
    description: 'Traditional slow-simmered mutton leg soup.',
    priceInr: 160,
    isVeg: false,
  },
  {
    categorySlug: 'soups',
    name: 'Sweet Corn Soup',
    description:
      'Smooth, comforting soup prepared with fresh sweet corn, finely chopped vegetables, and mild spices.',
    priceInr: 120,
    isVeg: true,
  },
  {
    categorySlug: 'soups',
    name: 'Hallikatte Special Veg Soup',
    description:
      'House-special comforting soup prepared with fresh vegetables, aromatic spices, and rich flavours.',
    priceInr: 130,
    isVeg: true,
  },
  {
    categorySlug: 'soups',
    name: 'Hallikatte Special Chicken Soup',
    description:
      'House-special comforting soup prepared with tender chicken, fresh ingredients, and rich flavours.',
    priceInr: 160,
    isVeg: false,
  },

  // 10. Milkshakes (3)
  {
    categorySlug: 'milkshakes',
    name: 'Cold Coffee',
    description: 'Chilled creamy cold coffee milkshake.',
    priceInr: 130,
    isVeg: true,
  },
  {
    categorySlug: 'milkshakes',
    name: 'Vanilla Milkshake',
    description:
      'Classic creamy vanilla milkshake blended with chilled milk and rich vanilla ice cream.',
    priceInr: 100,
    isVeg: true,
  },
  {
    categorySlug: 'milkshakes',
    name: 'Chocolate Milkshake',
    description:
      'Smooth, creamy, refreshing milkshake blended with chilled milk and rich chocolate.',
    priceInr: 130,
    isVeg: true,
  },

  // 11. Breakfast (1)
  {
    categorySlug: 'breakfast',
    name: 'Idli (Tatte Idli 1pc)',
    description: 'Soft steamed Karnataka-style Tatte Idli (1 piece), served hot.',
    priceInr: 35,
    isVeg: true,
  },
];

async function runSeed() {
  try {
    // Ensure owner admin account exists
    await db
      .insert(adminUsers)
      .values({
        email: 'harshabk59@gmail.com',
        fullName: 'HalliKatte Owner',
        role: 'admin',
        isActive: true,
      })
      .onConflictDoNothing({ target: adminUsers.email });

    // Seed tables if empty
    const [{ value: tableCount }] = await db
      .select({ value: count() })
      .from(restaurantTables);

    if (Number(tableCount) === 0) {
      await db.insert(restaurantTables).values([
        {
          tableNumber: 'HK-T1',
          label: 'Courtyard Table 1',
          capacity: 2,
          area: 'Main Courtyard',
        },
        {
          tableNumber: 'HK-T2',
          label: 'Courtyard Table 2',
          capacity: 4,
          area: 'Main Courtyard',
        },
        {
          tableNumber: 'HK-T3',
          label: 'Courtyard Table 3',
          capacity: 4,
          area: 'Main Courtyard',
        },
        {
          tableNumber: 'HK-T4',
          label: 'Banyan Alcove 1',
          capacity: 6,
          area: 'Banyan Pavilion',
        },
        {
          tableNumber: 'HK-T5',
          label: 'Banyan Alcove 2',
          capacity: 6,
          area: 'Banyan Pavilion',
        },
        {
          tableNumber: 'HK-T6',
          label: 'Family Verandah 1',
          capacity: 8,
          area: 'Family Verandah',
        },
        {
          tableNumber: 'HK-T7',
          label: 'Family Verandah 2',
          capacity: 8,
          area: 'Family Verandah',
        },
        {
          tableNumber: 'HK-T8',
          label: 'Village Gathering Hut',
          capacity: 12,
          area: 'Thatch Hut Pavilion',
        },
      ]);
    }

    // Seed configurable restaurant settings if empty
    const [{ value: settingsCount }] = await db
      .select({ value: count() })
      .from(restaurantSettings);

    if (Number(settingsCount) === 0) {
      await db
        .insert(restaurantSettings)
        .values([
          { key: 'phone', value: '+91 97318 10145' },
          { key: 'whatsapp', value: '919731810145' },
          { key: 'email', value: '' },
          {
            key: 'opening_hours',
            value: 'Open Daily: 12:00 PM – 9:30 PM',
          },
          {
            key: 'booking_slots',
            value: JSON.stringify([
              '12:00',
              '12:45',
              '13:30',
              '14:15',
              '15:00',
              '18:30',
              '19:15',
              '20:00',
              '20:45',
              '21:15',
            ]),
          },
          { key: 'online_ordering_enabled', value: 'true' },
          { key: 'instagram_url', value: 'https://share.google/RT42hbaTdWeYelrdO' },
          { key: 'facebook_url', value: '' },
        ])
        .onConflictDoNothing({ target: restaurantSettings.key });
    }

    // Check if full 122-item restaurant menu & real photo gallery have been synced
    const versionRow = await db
      .select()
      .from(restaurantSettings)
      .where(eq(restaurantSettings.key, 'catalog_version'))
      .limit(1);

    if (versionRow[0]?.value !== CATALOG_VERSION) {
      await db.transaction(async (tx) => {
        await tx.delete(menuItems);
        await tx.delete(menuCategories);

        const insertedCategories = await tx
          .insert(menuCategories)
          .values([
            { slug: 'combos', name: 'Combos', sortOrder: 1 },
            { slug: 'main-course', name: 'Main Course', sortOrder: 2 },
            { slug: 'breads', name: 'Breads', sortOrder: 3 },
            { slug: 'rice', name: 'Rice & Biryani', sortOrder: 4 },
            { slug: 'fried-rice-noodles', name: 'Fried Rice & Noodles', sortOrder: 5 },
            { slug: 'starters', name: 'Starters', sortOrder: 6 },
            { slug: 'rolls', name: 'Rolls', sortOrder: 7 },
            { slug: 'snacks', name: 'Snacks', sortOrder: 8 },
            { slug: 'soups', name: 'Soups', sortOrder: 9 },
            { slug: 'milkshakes', name: 'Milkshakes', sortOrder: 10 },
            { slug: 'breakfast', name: 'Breakfast', sortOrder: 11 },
          ])
          .returning();

        const catBySlug: Record<string, number> = {};
        for (const c of insertedCategories) {
          catBySlug[c.slug] = c.id;
        }

const MENU_ITEM_IMAGE_MAP: Record<string, string> = {
  'combos:Paneer Butter Masala With 2 Tandoori Roti': '/assets/aistudio/image_93fdde5a.png',
  'combos:Butter Chicken Masala With 2 Butter Naan': '/assets/aistudio/image_c8f5cd0c.png',
  'combos:Chicken Biryani With Chicken Kebab': '/assets/aistudio/image_5672e969.png',
  'combos:Mutton Combo': '/assets/aistudio/image_1cf222a8.png',
  'combos:Chicken Combo': '/assets/aistudio/image_b824a77f.png',
  'combos:Chicken Meal': '/assets/aistudio/image_cb82c1f8.png',
  'combos:Mutton Meal': '/assets/aistudio/image_e86bf121.png',
  'combos:Keema Meal': '/assets/aistudio/image_fe391867.png',
  'combos:Mutton Boti Fry': '/assets/aistudio/image_05fa424b.png',
  'combos:Mutton Boti Masala': '/assets/aistudio/image_ace12c94.png',
  'combos:Kasturi Chicken': '/assets/aistudio/image_f2b2705b.png',
  'combos:Karibevu Chicken': '/assets/aistudio/image_61cff77c.png',
  'combos:Mutton Keema Fry': '/assets/aistudio/image_b607c8b9.png',
  'combos:Mutton Keema Masala': '/assets/aistudio/image_d4720ede.png',
  'combos:Egg Boti Fry': '/assets/aistudio/image_729a8644.png',
  'combos:Chicken Kebab (Half) With 1 Tandoori Roti': '/assets/aistudio/image_c88f590b.png',
  'combos:Chicken Korma (Half) With 1 Tandoori Roti': '/assets/aistudio/image_f1baf0c6.png',
  'combos:Chicken Korma (Half) With 1 Butter Naan': '/assets/aistudio/image_139ac0fd.png',
  'combos:Chicken Kebab (Half) With 1 Butter Naan': '/assets/aistudio/image_c88f590b.png',
  'main-course:Mutton Chops': '/assets/aistudio/image_2ea55885.png',
  'main-course:Butter Chicken Masala': '/assets/aistudio/image_9e8dc02c.png',
  'main-course:Kadhai Chicken': '/assets/aistudio/image_6e4491a0.png',
  'main-course:Chicken Tikka Masala': '/assets/aistudio/image_01858db2.png',
  'main-course:Chicken Kolhapuri': '/assets/aistudio/image_900ab616.png',
  'main-course:Chicken Masala': '/assets/aistudio/image_19ad3cc3.png',
  'main-course:Special Chicken Masala': '/assets/aistudio/image_5b9d1a6c.png',
  'main-course:Guntur Chicken': '/assets/aistudio/image_7e601672.png',
  'main-course:Mutton Masala': '/assets/aistudio/image_fc0c88d1.png',
  'main-course:Mutton Sambar': '/assets/aistudio/image_3bf5c285.png',
  'main-course:Chicken Sambar': '/assets/aistudio/image_4e5c4a63.png',
  'main-course:Chicken Fry': '/assets/aistudio/image_1de07ee6.png',
  'main-course:Mutton Boti Masala': '/assets/aistudio/image_ace12c94.png',
  'main-course:Mutton Keema Masala': '/assets/aistudio/image_d4720ede.png',
  'main-course:Paneer Butter Masala': '/assets/aistudio/image_3a141999.png',
  'main-course:Palak Paneer': '/assets/aistudio/image_2027355d.png',
  'main-course:Veg Kadhai': '/assets/aistudio/image_42fe777c.png',
  'main-course:Mushroom Masala': '/assets/aistudio/image_2f53efce.png',
  'main-course:Kadhai Paneer': '/assets/aistudio/image_f0837f01.png',
  'main-course:Veg Kolhapuri': '/assets/aistudio/image_8e672f21.png',
  'main-course:Veg Hyderabadi': '/assets/aistudio/image_5f4eedfa.png',
  'main-course:Dal Fry': '/assets/aistudio/image_8b00c06e.png',
  'main-course:Dal Tadka': '/assets/aistudio/image_bf84a7ab.png',
  'main-course:Aloo Matar Masala': '/assets/aistudio/image_3863bb1d.png',
  'main-course:Chana Masala': '/assets/aistudio/image_f6029998.png',
  'breads:Paneer Kulcha': '/assets/aistudio/image_b36931d4.png',
  'breads:Lachha Parotta': '/assets/aistudio/image_e0d035bf.png',
  'breads:1 Tandoori Roti': '/assets/aistudio/image_828dd9ae.png',
  'breads:Butter Roti': '/assets/aistudio/image_c4c877cc.png',
  'breads:Butter Naan': '/assets/aistudio/image_978a8b1e.png',
  'breads:Plain Naan': '/assets/aistudio/image_c3293aa1.png',
  'breads:Garlic Naan': '/assets/aistudio/image_bbf9e34c.png',
  'breads:Plain Kulcha': '/assets/aistudio/image_5e009f68.png',
  'breads:Butter Kulcha': '/assets/aistudio/image_e1d53fdc.png',
  'breads:Masala Kulcha': '/assets/aistudio/image_a4cebb41.png',
  'rice:Veg Biryani': '/assets/aistudio/image_6891c38e.png',
  'rice:Egg Biryani': '/assets/aistudio/image_2b27e0d5.png',
  'rice:Chicken Biryani': '/assets/aistudio/image_11a2535b.png',
  'rice:Mutton Biryani': '/assets/aistudio/image_98c373e9.png',
  'rice:Curd Rice': '/assets/aistudio/image_f4db87f1.png',
  'rice:Plain Rice': '/assets/aistudio/image_58f2ccf9.png',
  'rice:Tomato Rice': '/assets/aistudio/image_4e1122bc.png',
  'rice:Palak Rice': '/assets/aistudio/image_6c8f896f.png',
  'rice:Jeera Rice': '/assets/aistudio/image_6c8f896f.png',
  'rice:Ghee Rice': '/assets/aistudio/image_1b03913a.png',
  'rice:Biryani Rice': '/assets/aistudio/image_1b03913a.png',
  'fried-rice-noodles:Veg Hakka Noodles': '/assets/aistudio/image_0f3f06f0.png',
  'fried-rice-noodles:Chicken Hakka Noodles': '/assets/aistudio/image_18b31fe9.png',
  'fried-rice-noodles:Veg Fried Rice': '/assets/aistudio/image_9759e372.png',
  'fried-rice-noodles:Mushroom Fried Rice': '/assets/aistudio/image_cdca149e.png',
  'fried-rice-noodles:Paneer Fried Rice': '/assets/aistudio/image_0851d4cd.png',
  'fried-rice-noodles:Gobi Fried Rice': '/assets/aistudio/image_e86e8a71.png',
  'fried-rice-noodles:Egg Fried Rice': '/assets/aistudio/image_8a6c7a86.png',
  'fried-rice-noodles:Egg Schezwan Fried Rice': '/assets/aistudio/image_21d73925.png',
  'fried-rice-noodles:Chicken Fried Rice': '/assets/aistudio/image_070232b3.png',
  'fried-rice-noodles:Chicken Schezwan Fried Rice': '/assets/aistudio/image_d5907871.png',
  'starters:Chilli Egg': '/assets/aistudio/image_1ec2db5b.png',
  'starters:Egg Manchurian': '/assets/aistudio/image_9632468a.png',
  'starters:Egg Pepper Dry': '/assets/aistudio/image_352f0726.png',
  'starters:Chicken Lollipop (5pc)': '/assets/aistudio/image_10202fbe.png',
  'starters:Chicken Manchurian': '/assets/aistudio/image_7c042be0.png',
  'starters:Chilli Chicken': '/assets/aistudio/image_7c042be0.png',
  'starters:Chicken 65': '/assets/aistudio/image_63826102.png',
  'starters:Chicken Pepper Dry': '/assets/aistudio/image_3a37aa8f.png',
  'starters:Lemon Chicken': '/assets/aistudio/image_318ed62c.png',
  'starters:Chicken Kebab': '/assets/aistudio/image_5ec8a8dc.png',
  'starters:Chicken Ghee Roast': '/assets/aistudio/image_8ea0a999.png',
  'starters:Garlic Chicken': '/assets/aistudio/image_07bff9c9.png',
  'starters:Hallikatte Special Chicken': '/assets/aistudio/image_ab1e4df6.png',
  'starters:Chicken Tikka (BBQ)': '/assets/aistudio/image_99813e14.png',
  'rolls:Veg Roll': '/assets/aistudio/image_7b784fda.png',
  'rolls:Paneer Roll': '/assets/aistudio/image_dc0d7550.png',
  'rolls:Mushroom Roll': '/assets/aistudio/image_0e8e0bbd.png',
  'rolls:Egg Roll': '/assets/aistudio/image_24a5442f.png',
  'rolls:Double Egg Roll': '/assets/aistudio/image_337885fe.png',
  'rolls:Chicken Roll': '/assets/aistudio/image_f8c9f612.png',
  'rolls:Egg Chicken Roll': '/assets/aistudio/image_fb2cb74d.png',
  'rolls:Baby Corn Roll': '/assets/aistudio/image_0e8e0bbd.png',
  'snacks:Veg Nuggets': '/assets/aistudio/image_8505a370.png',
  'snacks:French Fries': '/assets/aistudio/image_f1e497bf.png',
  'snacks:Masala French Fries': '/assets/aistudio/image_88f6d3a1.png',
  'snacks:Egg Pakoda': '/assets/aistudio/image_dbf10837.png',
  'snacks:Omelette': '/assets/aistudio/image_47fe973d.png',
  'snacks:Boiled Egg (2pc)': '/assets/aistudio/image_54b13809.png',
  'snacks:Chicken Nuggets': '/assets/aistudio/image_58fa6fb0.png',
  'snacks:Egg Bhurji': '/assets/aistudio/image_3c40cb1f.png',
  'snacks:Chicken Popcorn': '/assets/aistudio/image_e1b394c3.png',
  'soups:Veg Manchow Soup': '/assets/aistudio/image_b0647750.png',
  'soups:Tomato Soup': '/assets/aistudio/image_da213c92.png',
  'soups:Veg Hot & Sour Soup': '/assets/aistudio/image_28eef30e.png',
  'soups:Chicken Manchow Soup': '/assets/aistudio/image_b4bc7f54.png',
  'soups:Chicken Hot & Sour Soup': '/assets/aistudio/image_832e262f.png',
  'soups:Leg Soup': '/assets/aistudio/image_c164d8d9.png',
  'soups:Sweet Corn Soup': '/assets/aistudio/image_8107c78d.png',
  'soups:Hallikatte Special Veg Soup': '/assets/aistudio/image_c778cc6d.png',
  'soups:Hallikatte Special Chicken Soup': '/assets/aistudio/image_c4db69da.png',
  'milkshakes:Cold Coffee': '/assets/aistudio/image_7437f7b3.png',
  'milkshakes:Vanilla Milkshake': '/assets/aistudio/image_ac7fdc19.png',
  'milkshakes:Chocolate Milkshake': '/assets/aistudio/image_eca63639.png',
  'breakfast:Idli (Tatte Idli 1pc)': '/assets/aistudio/image_8d1fefff.png',
};

        await tx.insert(menuItems).values(
          FULL_MENU_ITEMS.map((item, idx) => ({
            categoryId: catBySlug[item.categorySlug],
            name: item.name,
            description: item.description,
            priceInr: item.priceInr,
            imageUrl: MENU_ITEM_IMAGE_MAP[`${item.categorySlug}:${item.name}`] ?? null,
            isVeg: item.isVeg,
            isAvailable: true,
            sortOrder: idx + 1,
          })),
        );

        // Replace empty gallery placeholders with real HalliKatte photographs
        await tx.delete(galleryImages).where(isNull(galleryImages.imageUrl));

        const [{ value: existingGalleryCount }] = await tx
          .select({ value: count() })
          .from(galleryImages);

        if (Number(existingGalleryCount) === 0) {
          await tx.insert(galleryImages).values([
            {
              section: 'Restaurant Ambience',
              title: 'Warli Wall & Bullock-Cart Dining',
              caption:
                'Hand-painted Warli tribal murals, wooden bullock-cart wheels, and warm pendant bulbs welcoming guests inside HalliKatte.',
              imageUrl: '/assets/aistudio/image_584b81b8.png',
              sortOrder: 1,
              isVisible: true,
            },
            {
              section: 'Restaurant Ambience',
              title: 'HK Village Courtyard Seating',
              caption:
                'Elevated lawn-textured village seating framed by Warli borders and rustic wheel chandeliers.',
              imageUrl: '/assets/aistudio/image_8390f7cc.png',
              sortOrder: 2,
              isVisible: true,
            },
            {
              section: 'Restaurant Ambience',
              title: 'The Dining Hall & Vertical Garden',
              caption:
                'Spacious family dining hall combining terracotta walls, lush vertical greenery, and handcrafted cart tables.',
              imageUrl: '/assets/aistudio/image_58df15b8.png',
              sortOrder: 3,
              isVisible: true,
            },
            {
              section: 'Restaurant Ambience',
              title: 'Banyan Tree Alcove',
              caption:
                'Serene golden Buddha relief beneath the spreading banyan tree beside our Warli mural corridor.',
              imageUrl: '/assets/aistudio/image_24c7ef2f.png',
              sortOrder: 4,
              isVisible: true,
            },
            {
              section: 'Family Dining',
              title: 'Joint Family Feast',
              caption:
                'Generations gathering around our signature long cart-wheel table in Nelamangala.',
              imageUrl: '/assets/aistudio/image_22761386.png',
              sortOrder: 5,
              isVisible: true,
            },
            {
              section: 'Family Dining',
              title: 'Warm Evening Meal',
              caption:
                'Smiles around the marble table after enjoying fresh starters and main courses.',
              imageUrl: '/assets/aistudio/image_729b19d3.png',
              sortOrder: 6,
              isVisible: true,
            },
            {
              section: 'Family Dining',
              title: 'Evening Gathering',
              caption:
                'Friends and family sharing a wholesome feast at HalliKatte Family Restaurant.',
              imageUrl: '/assets/aistudio/image_f6c795c1.png',
              sortOrder: 7,
              isVisible: true,
            },
          ]);
        }

        await tx
          .insert(restaurantSettings)
          .values({
            key: 'catalog_version',
            value: CATALOG_VERSION,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: restaurantSettings.key,
            set: { value: CATALOG_VERSION, updatedAt: new Date() },
          });
      });
    }

    seeded = true;
  } catch (error) {
    console.error('Database seed failed:', error);
    throw new Error('Failed to initialize restaurant catalog.', {
      cause: error,
    });
  }
}

export async function ensureSeeded(): Promise<void> {
  if (seeded) return;
  if (!seedPromise) {
    seedPromise = runSeed().finally(() => {
      seedPromise = null;
    });
  }
  await seedPromise;
}
