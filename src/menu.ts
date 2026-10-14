export type Item = {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  art: string;
  options?: string[];
  syrup?: boolean;
};
export const categories = [
  "All",
  "Classics",
  "Signature",
  "Matcha",
  "Pujo specials",
  "Mocktails",
  "Fries",
  "Momo",
  "Cigar rolls",
  "Pita pockets",
];
const rows: [string, number, string, string, string, string[]?, boolean?][] = [
  [
    "Americano",
    149,
    "Classics",
    "Espresso, beautifully simple.",
    "coffee",
    ["Hot", "Iced"],
    true,
  ],
  [
    "Cappuccino",
    179,
    "Classics",
    "Coffee beneath a soft milk foam.",
    "cup",
    ["Hot", "Iced"],
    true,
  ],
  [
    "Latte",
    179,
    "Classics",
    "Espresso & silky milk.",
    "latte",
    ["Hot", "Iced"],
    true,
  ],
  [
    "Mocha",
    189,
    "Classics",
    "Coffee meets chocolate.",
    "mocha",
    ["Hot", "Iced"],
    true,
  ],
  [
    "OG Cold Coffee",
    189,
    "Classics",
    "The familiar favourite, served cold.",
    "cold",
    undefined,
    true,
  ],
  [
    "Vietnamese Latte",
    239,
    "Signature",
    "Espresso, sweetened with condensed milk.",
    "latte",
    ["Hot", "Cold"],
  ],
  [
    "Pop-corn Latte",
    249,
    "Signature",
    "Espresso, milk, caramel popcorn & a cloud.",
    "popcorn",
    ["Hot", "Iced"],
  ],
  [
    "Tiramisu Latte",
    249,
    "Signature",
    "Espresso, milk, tiramisu cloud & cocoa.",
    "mocha",
    ["Hot", "Iced"],
  ],
  [
    "Strawberry Iced Latte",
    239,
    "Signature",
    "Espresso, milk & strawberry crush.",
    "strawberry",
  ],
  [
    "Cranberry Fizz Espresso",
    249,
    "Signature",
    "Cranberry & Sprite topped with espresso over ice.",
    "berry",
  ],
  [
    "Fridge Cigarette",
    249,
    "Signature",
    "Espresso, fizzy Diet Coke & silky vanilla cold foam.",
    "cold",
  ],
  ["Matcha Latte", 219, "Matcha", "Earthy matcha meets milk.", "matcha"],
  ["Iced Matcha Latte", 239, "Matcha", "Matcha & milk, over ice.", "matcha"],
  [
    "Strawberry Iced Matcha Latte",
    259,
    "Matcha",
    "Strawberry, milk & matcha.",
    "pinkmatcha",
  ],
  [
    "Salted Caramel Iced Matcha Latte",
    259,
    "Matcha",
    "Matcha with salted caramel.",
    "matcha",
  ],
  [
    "Nolen Gur Cloud Iced Latte",
    259,
    "Pujo specials",
    "Espresso, milk, topped with nolen gur cloud.",
    "popcorn",
  ],
  [
    "Nolen Gur Latte",
    249,
    "Pujo specials",
    "Espresso & milk, sweetened with nolen gur.",
    "latte",
  ],
  [
    "Kachha Aamer Shorbot",
    179,
    "Pujo specials",
    "Raw mango syrup, mint, desi spices & soda.",
    "lime",
  ],
  ["Jamun Fizz", 179, "Mocktails", "Spiced jamun syrup, lime & soda.", "berry"],
  ["Virgin Mojito", 179, "Mocktails", "Fresh mint, lime & soda.", "lime"],
  [
    "Orange Sunset",
    179,
    "Mocktails",
    "Orange, citrus, cranberry & soda.",
    "orange",
  ],
  [
    "Masala Coke / Diet Coke",
    179,
    "Mocktails",
    "Chilled coke with our signature spice mix.",
    "cold",
    ["Coke", "Diet Coke"],
  ],
  [
    "Strawberry Lemonade",
    179,
    "Mocktails",
    "Strawberry crush, lemon & soda.",
    "strawberry",
  ],
  ["Classic Fries", 149, "Fries", "Golden, crisp & lightly salted.", "fries"],
  [
    "Peri Peri Fries",
    169,
    "Fries",
    "Golden fries with a little heat.",
    "fries",
  ],
  [
    "Loaded Cheesy Fries",
    229,
    "Fries",
    "Crisp fries, generously cheesy.",
    "cheesy",
  ],
  [
    "Veg Momo",
    149,
    "Momo",
    "Vegetable-filled little parcels.",
    "momo",
    ["Steamed", "Fried"],
  ],
  [
    "Paneer Momo",
    169,
    "Momo",
    "Paneer-filled little parcels.",
    "momo",
    ["Steamed", "Fried"],
  ],
  [
    "Chicken Momo",
    179,
    "Momo",
    "Chicken-filled little parcels.",
    "momo",
    ["Steamed", "Fried"],
  ],
  [
    "Crispy Veg Cigar Rolls",
    179,
    "Cigar rolls",
    "Crisp rolls with a vegetable filling.",
    "rolls",
  ],
  [
    "Crispy Chicken Cigar Rolls",
    199,
    "Cigar rolls",
    "Crisp rolls with a chicken filling.",
    "rolls",
  ],
  [
    "Veg Falafel Pita",
    199,
    "Pita pockets",
    "Falafel tucked into a soft pita.",
    "pita",
  ],
  [
    "Chicken Shami Kebab Pita",
    229,
    "Pita pockets",
    "Chicken shami kebab in a soft pita.",
    "pita",
  ],
  [
    "Sunrise Iced Americano",
    239,
    "Signature",
    "Espresso & orange juice.",
    "sunrise",
  ],
];
export const menu: Item[] = rows.map(
  ([name, price, category, description, art, options, syrup], id) => ({
    id,
    name,
    price,
    category,
    description,
    art,
    options,
    syrup,
  }),
);
const artKeys = [
  "americano",
  "cappuccino",
  "latte",
  "mocha",
  "cold-coffee",
  "vietnamese",
  "popcorn",
  "tiramisu",
  "strawberry-latte",
  "cranberry-espresso",
  "fridge-cigarette",
  "hot-matcha",
  "iced-matcha",
  "strawberry-matcha",
  "caramel-matcha",
  "gur-cloud",
  "gur-latte",
  "mango-shorbot",
  "jamun",
  "mojito",
  "sunset",
  "masala-cola",
  "strawberry-lemonade",
  "fries",
  "peri-fries",
  "cheesy",
  "momo-veg",
  "momo-paneer",
  "momo-chicken",
  "rolls-veg",
  "rolls-chicken",
  "pita-falafel",
  "pita-chicken",
  "sunrise",
];
for (const item of menu) item.art = artKeys[item.id];
const signatureOrder = [
  "Strawberry Iced Latte",
  "Vietnamese Latte",
  "Pop-corn Latte",
  "Tiramisu Latte",
  "Sunrise Iced Americano",
  "Cranberry Fizz Espresso",
  "Fridge Cigarette",
];
menu.sort(
  (a, b) =>
    categories.indexOf(a.category) - categories.indexOf(b.category) ||
    (a.category === "Signature"
      ? signatureOrder.indexOf(a.name) - signatureOrder.indexOf(b.name)
      : a.id - b.id),
);
export const syrups = [
  "None",
  "Hazelnut",
  "Tiramisu",
  "Salted Caramel",
  "Popcorn Syrup",
  "Vanilla",
];

// Nolen Gur Latte is provisionally available both ways, pending stall confirmation.
menu.find((item) => item.id === 16)!.options = ["Hot", "Iced"];
export type Temperature = "Hot" | "Cold";
export const isDrink = (item: Item) =>
  ["Classics", "Signature", "Matcha", "Pujo specials", "Mocktails"].includes(
    item.category,
  );
export const hasTemperatureOptions = (item: Item) =>
  Boolean(item.options?.includes("Hot"));
export const servesTemperature = (item: Item, temperature: Temperature) =>
  !isDrink(item) ||
  hasTemperatureOptions(item) ||
  (item.id === 11 ? temperature === "Hot" : temperature === "Cold");
export const servingOption = (item: Item, temperature: Temperature) =>
  !isDrink(item)
    ? ""
    : hasTemperatureOptions(item)
      ? temperature === "Hot"
        ? "Hot"
        : item.options!.find((value) => value === "Iced" || value === "Cold")!
      : item.id === 11
        ? "Hot"
        : "Cold";
