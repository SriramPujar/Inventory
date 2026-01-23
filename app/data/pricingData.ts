export type PriceItem = {
    name: string;
    price: number;
    description?: string;
}

export type PricingCategory = {
    name: string;
    items: PriceItem[];
    variablePrice?: boolean; // For "Large Size Print" where price is per sq inch
}

export const PRODUCT_CATEGORIES: PricingCategory[] = [
    {
        name: "STUDIO EXPOSES",
        items: [
            { name: "Passport Size Photographs (8PP or 6*4)", price: 80 },
            { name: "Passport Size Photographs (4PP Visiting Card)", price: 80 },
            { name: "2B (2 Copies)", price: 80 },
            { name: "2B (16PP or 12*8)", price: 130 },
            { name: "4*6 (Instant Maxi Size) (1 Copy)", price: 80 },

            { name: "4*6 (32PP or 24*16)", price: 200 },
            { name: "4*6 (Maxi Size) (2 Copies)", price: 150 },
            { name: "5*7 (2 Copies)", price: 200 },
            { name: "6*8 (2 Copies)", price: 200 },
            { name: "8*12 (Click or Recopy) (1 Copy)", price: 250 },
            { name: "10*12 (Click or Recopy) (1 Copy)", price: 300 },
            { name: "12*15 (Click or Recopy) (1 Copy)", price: 400 },
            { name: "12*18 (Click or Recopy) (1 Copy)", price: 250 },
            { name: "12*30 (Click or Recopy) (1 Copy)", price: 600 },
        ]
    },
    {
        name: "4*6 (Instant Maxi Size) (PP)",
        items: [
            { name: "4*6 (Instant Maxi Size) (PP)", price: 80 }
        ]
    },
    {
        name: "VISA/PASSPORTS",
        items: [
            { name: "Any Country Sizes (2 sheets of 4*6 size glossy/matt paper)", price: 250 },
            { name: "Any Country Visa Sizes (1 sheet of 4*6 size glossy/matt paper)", price: 150 },
        ]
    },
    {
        name: "LARGE SIZE PRINT",
        variablePrice: true,
        items: [
            { name: "Per Square Inch", price: 4 }
        ]
    },
    {
        name: "MOBILE OR MEDIA PRINT",
        items: [
            { name: "4*6 (1 Copy)", price: 50 },
            { name: "Upto 100 Copies", price: 20 },
            { name: "Above 200 Copies", price: 15 },
        ]
    },
    {
        name: "PHOTO WITH LAMINATIONS",
        items: [
            { name: "4*6", price: 100 },
            { name: "6*8", price: 300 },
            { name: "8*12", price: 500 },
            { name: "12*10", price: 600 },
            { name: "12*15", price: 800 },
            { name: "12*18", price: 1000 },
            { name: "12*30", price: 1200 },
            { name: "16*20", price: 2000 },
            { name: "20*24", price: 2500 },
            { name: "20*30", price: 3500 },
            { name: "30*40", price: 4500 },
            { name: "16*20 (Frames)", price: 2500 },
            { name: "20*30 (Frames)", price: 4500 },
            { name: "30*40 (Frames)", price: 6500 },
        ]
    },
    {
        name: "PHOTO WITH FRAMES",
        items: [
            { name: "4*6", price: 200 },
            { name: "6*8", price: 400 },
            { name: "8*12", price: 600 },
            { name: "12*10", price: 800 },
            { name: "12*15", price: 1000 },
            { name: "12*18", price: 1200 },
            { name: "12*30", price: 1500 },
            { name: "4*6 (Extra Mount)", price: 300 },
            { name: "6*8 (Extra Mount)", price: 500 },
            { name: "8*12 (Extra Mount)", price: 800 },
            { name: "12*10 (Extra Mount)", price: 1200 },
            { name: "12*15 (Extra Mount)", price: 1500 },
            { name: "12*18 (Extra Mount)", price: 1800 },
            { name: "12*30 (Extra Mount)", price: 2000 },
        ]
    },
    {
        name: "LED FRAMES",
        items: [
            { name: "6*8", price: 700 },
            { name: "8*12", price: 1200 },
            { name: "10*12", price: 1600 },
            { name: "12*15", price: 2200 },
            { name: "12*18", price: 2400 },
            { name: "16*20", price: 3500 },
            { name: "12*30", price: 5000 },
        ]
    }
];
