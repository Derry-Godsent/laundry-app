// src/data/pricing.ts

export const EXPRESS_SURCHARGE = 10;

export const LOYALTY_TIERS = [
  { name: "Standard", minVisits: 0, maxVisits: 4, discount: 0 },
  { name: "Bronze", minVisits: 5, maxVisits: 14, discount: 5 },
  { name: "Silver", minVisits: 15, maxVisits: 29, discount: 10 },
  { name: "Gold", minVisits: 30, maxVisits: Infinity, discount: 15 },
  { name: "VIP", minVisits: Infinity, discount: 20 }, // Custom designation
];

export interface ServiceItem {
  id: string;
  name: string;
  category: string;
  icon: string;
  prices: {
    wash: number;
    iron: number;
    fold: number;
    hang: number;
  };
}

export const SERVICES: ServiceItem[] = [
  // TOPS
  { id: "s1", name: "Shirt", category: "Tops", icon: "Shirt", prices: { wash: 7, iron: 9, fold: 13, hang: 15 } },
  { id: "s2", name: "T-Shirt", category: "Tops", icon: "Shirt", prices: { wash: 7, iron: 9, fold: 12, hang: 15 } },
  { id: "s9", name: "Jacket", category: "Tops", icon: "Shirt", prices: { wash: 8, iron: 11, fold: 15, hang: 18 } },
  
  // BOTTOMS
  { id: "s3", name: "Trousers", category: "Bottoms", icon: "Shirt", prices: { wash: 7, iron: 9, fold: 13, hang: 15 } },
  { id: "s18", name: "Shorts", category: "Bottoms", icon: "Shirt", prices: { wash: 6, iron: 10, fold: 10, hang: 0 } },

  // LADIES
  { id: "s4", name: "Dress", category: "Ladies", icon: "Shirt", prices: { wash: 7, iron: 9, fold: 15, hang: 15 } },
  { id: "s5", name: "Blouse & Skirt", category: "Ladies", icon: "Shirt", prices: { wash: 11, iron: 13, fold: 25, hang: 27 } },
  { id: "s10", name: "Ladies Suit", category: "Ladies", icon: "Shirt", prices: { wash: 17, iron: 19, fold: 40, hang: 40 } },

  // SUITS
  { id: "s6", name: "Suit 3-Piece", category: "Suits", icon: "Shirt", prices: { wash: 17, iron: 19, fold: 40, hang: 40 } },
  { id: "s7", name: "Suit 2-Piece", category: "Suits", icon: "Shirt", prices: { wash: 17, iron: 19, fold: 35, hang: 35 } },
  { id: "s8", name: "Suit Jacket", category: "Suits", icon: "Shirt", prices: { wash: 8, iron: 11, fold: 20, hang: 18 } },

  // TRADITIONAL
  { id: "s11", name: "Smock", category: "Traditional", icon: "Shirt", prices: { wash: 10, iron: 0, fold: 15, hang: 0 } },
  { id: "s12", name: "National Costume 2-Piece", category: "Traditional", icon: "Shirt", prices: { wash: 11, iron: 13, fold: 20, hang: 22 } },
  { id: "s13", name: "National Costume 3-Piece (Men)", category: "Traditional", icon: "Shirt", prices: { wash: 17, iron: 19, fold: 30, hang: 32 } },
  { id: "s14", name: "National Costume 3-Piece (Ladies)", category: "Traditional", icon: "Shirt", prices: { wash: 13, iron: 15, fold: 25, hang: 27 } },
  { id: "s15", name: "National Costume (Kids)", category: "Traditional", icon: "Shirt", prices: { wash: 6, iron: 8, fold: 10, hang: 12 } },

  // BASICS
  { id: "s16", name: "Underwear", category: "Basics", icon: "Shirt", prices: { wash: 3, iron: 0, fold: 3, hang: 0 } },
  { id: "s17", name: "Vest", category: "Basics", icon: "Shirt", prices: { wash: 6, iron: 6, fold: 6, hang: 0 } },

  // FABRIC
  { id: "s19", name: "Cloth - Kente", category: "Fabric", icon: "Shirt", prices: { wash: 35, iron: 0, fold: 35, hang: 0 } },
  { id: "s20", name: "Cloth - Small", category: "Fabric", icon: "Shirt", prices: { wash: 30, iron: 0, fold: 30, hang: 0 } },

  // LINEN
  { id: "s21", name: "Bedsheet", category: "Linen", icon: "Shirt", prices: { wash: 11, iron: 0, fold: 25, hang: 0 } },
  { id: "s22", name: "Pillowcase", category: "Linen", icon: "Shirt", prices: { wash: 2, iron: 0, fold: 2, hang: 0 } },
  { id: "s23", name: "Towel - Large", category: "Linen", icon: "Shirt", prices: { wash: 20, iron: 0, fold: 20, hang: 20 } },
  { id: "s24", name: "Towel - Medium", category: "Linen", icon: "Shirt", prices: { wash: 15, iron: 0, fold: 15, hang: 15 } },
  { id: "s25", name: "Towel - Small", category: "Linen", icon: "Shirt", prices: { wash: 10, iron: 0, fold: 10, hang: 10 } },
  { id: "s26", name: "Blanket - Large", category: "Linen", icon: "Shirt", prices: { wash: 60, iron: 0, fold: 60, hang: 0 } },
  { id: "s27", name: "Blanket - Medium", category: "Linen", icon: "Shirt", prices: { wash: 45, iron: 0, fold: 45, hang: 0 } },
  { id: "s28", name: "Blanket - Small", category: "Linen", icon: "Shirt", prices: { wash: 40, iron: 0, fold: 40, hang: 0 } },

  // HOME
  { id: "s29", name: "Curtains - Small", category: "Home", icon: "Shirt", prices: { wash: 10, iron: 0, fold: 10, hang: 10 } },
  { id: "s30", name: "Curtains - Medium", category: "Home", icon: "Shirt", prices: { wash: 15, iron: 0, fold: 15, hang: 15 } },
  { id: "s31", name: "Curtains - Large", category: "Home", icon: "Shirt", prices: { wash: 20, iron: 0, fold: 20, hang: 20 } },

  // SPECIALTY
  { id: "s32", name: "Choir Robe", category: "Specialty", icon: "Shirt", prices: { wash: 30, iron: 0, fold: 30, hang: 32 } },
  { id: "s33", name: "Carpet - Large", category: "Specialty", icon: "Shirt", prices: { wash: 200, iron: 0, fold: 200, hang: 200 } },
  { id: "s34", name: "Carpet - Small", category: "Specialty", icon: "Shirt", prices: { wash: 100, iron: 0, fold: 100, hang: 100 } },
  { id: "s35", name: "Door Mat", category: "Specialty", icon: "Shirt", prices: { wash: 40, iron: 0, fold: 40, hang: 40 } },
  { id: "s36", name: "Wedding Gown", category: "Specialty", icon: "Shirt", prices: { wash: 220, iron: 0, fold: 200, hang: 200 } },
];