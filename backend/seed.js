const mongoose = require('mongoose');
const Inventory = require('./models/inventory');

const MONGO_URI = 'mongodb://127.0.0.1:27017/smartdine';

const seedItems = [
    // =========================================================
    // MAINS
    // =========================================================
    {
        itemName: "Jollof Rice",
        category: "Mains",
        price: 3500,
        stockQuantity: 40,
        description: "Smoky jollof rice cooked in a rich tomato, pepper and onion blend, served with vegetables.",
        prepTime: 15,
        isAvailable: true,
        imageUrl: "https://simshomekitchen.com/wp-content/uploads/2020/06/Jollof_Rice_recipe.jpeg"
    },
    {
        itemName: "Jollof Spaghetti",
        category: "Mains",
        price: 3000,
        stockQuantity: 30,
        description: "Spaghetti cooked in a rich tomato and pepper sauce with a savoury and slightly spicy flavour.",
        prepTime: 15,
        isAvailable: true,
        imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS-rxg0Uwd0yiZT6pTVj47Hnnq6UAHAWg0yvjOFWWVORQ&s=10"
    },
    {
        itemName: "Beef Suya",
        category: "Mains",
        price: 3000,
        stockQuantity: 35,
        description: "Tender beef skewers grilled over high heat and coated with a traditional suya spice blend.",
        prepTime: 20,
        isAvailable: true,
        imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSZc1peN7iJbq4Rp_WwZg9QmW1kdTZJnt_czmXem3UkLD9_Lp-gX1vgx8g&s=10"
    },
    {
        itemName: "Chicken Shawarma",
        category: "Mains",
        price: 3500,
        stockQuantity: 25,
        description: "Chicken shawarma filled with seasoned grilled chicken, fresh vegetables and creamy sauce.",
        prepTime: 15,
        isAvailable: true,
        imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQQpFqTDQKdqr91eKkcYEx5h0-1SXZHElhIpiO0Psp5AA&s=10"
    },
    {
        itemName: "Classic Beef Burger",
        category: "Mains",
        price: 4000,
        stockQuantity: 20,
        description: "Juicy beef patty served in a soft burger bun with lettuce, tomatoes, onions and house sauce.",
        prepTime: 20,
        isAvailable: true,
        imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80"
    },

    // =========================================================
    // PROTEINS
    // =========================================================
    {
        itemName: "Chicken in Stew",
        category: "Proteins",
        price: 3000,
        stockQuantity: 25,
        description: "Tender chicken pieces simmered in a rich Nigerian red stew made with tomatoes, peppers and onions.",
        prepTime: 15,
        isAvailable: true,
        imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQi0tRr0xlVoUP9gAFU-8jUR8G2743xixWnoEX-FFwtUw&s=10"
    },
    {
        itemName: "Grilled Chicken",
        category: "Proteins",
        price: 3500,
        stockQuantity: 20,
        description: "Well-seasoned chicken grilled until tender and lightly charred for a rich smoky flavour.",
        prepTime: 25,
        isAvailable: true,
        imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5vt4PTG3s8JRdhbAL5GOG20Ux7EIAtgUtzGhiW60V7A&s=10"
    },
    {
        itemName: "Barbecue Chicken",
        category: "Proteins",
        price: 4000,
        stockQuantity: 20,
        description: "Succulent chicken coated in a sweet and smoky barbecue glaze and grilled until perfectly cooked.",
        prepTime: 25,
        isAvailable: true,
        imageUrl: "https://assets.epicurious.com/photos/5b843bce1abfc56568396369/1:1/w_2560%2Cc_limit/Grilled-Chicken-with-Mustard-Sauce-and-Tomato-Salad-recipe-2-22082018.jpg"
    },
    {
        itemName: "Grilled Beef",
        category: "Proteins",
        price: 4000,
        stockQuantity: 15,
        description: "Tender cuts of beef seasoned with herbs and spices, grilled for a juicy texture and smoky finish.",
        prepTime: 25,
        isAvailable: true,
        imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80"
    },

    // =========================================================
    // SIDES
    // =========================================================
    {
        itemName: "French Fries",
        category: "Sides",
        price: 1500,
        stockQuantity: 50,
        description: "Crispy golden French fries lightly salted and served hot.",
        prepTime: 10,
        isAvailable: true,
        imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSbU4Uk5o4A3mvL--R4Ok6jFzeI0SkJOhn5Ky_LP8uTZA&s=10"
    },
    {
        itemName: "Fried Plantain",
        category: "Sides",
        price: 1500,
        stockQuantity: 50,
        description: "Sweet, ripe plantain slices fried until golden brown and slightly caramelised.",
        prepTime: 10,
        isAvailable: true,
        imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSzGwvpsmG3zNuH82eWKXnwfHJAvDLfpgCbvC3xbgvN_A&s=10"
    },

    // =========================================================
    // DRINKS
    // =========================================================
    {
        itemName: "Bottled Water",
        category: "Drinks",
        price: 500,
        stockQuantity: 100,
        description: "Chilled bottled drinking water.",
        prepTime: 0,
        isAvailable: true,
        imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQjlg_d_xEQGXw10CPghwloFQ5XFu6WSbalxpFsBGfiFg&s=10"
    },
    {
        itemName: "Sprite",
        category: "Drinks",
        price: 1000,
        stockQuantity: 60,
        description: "Chilled lemon-lime carbonated soft drink.",
        prepTime: 0,
        isAvailable: true,
        imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTvoLI9pYQVkVC7l-s78LoPjXH_JwpVYj6hbXgGCTBYxA&s=10"
    },
    {
        itemName: "Pepsi",
        category: "Drinks",
        price: 1000,
        stockQuantity: 60,
        description: "Chilled Pepsi soft drink.",
        prepTime: 0,
        isAvailable: true,
        imageUrl: "https://images.unsplash.com/photo-1629203849820-fdd70d49c38e?w=800&auto=format&fit=crop&q=80"
    },
    {
        itemName: "Ribena Blackcurrant",
        category: "Drinks",
        price: 1200,
        stockQuantity: 45,
        description: "Refreshing blackcurrant fruit drink with a rich fruity taste.",
        prepTime: 0,
        isAvailable: true,
        imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbTlFZmNd1RxKw4hWAkieYCAzG9WoU2aByt17_bJkp8w&s=10"
    },
    {
        itemName: "5 alive Orange Juice",
        category: "Drinks",
        price: 1500,
        stockQuantity: 45,
        description: "Refreshing chilled orange fruit drink with a bright citrus flavour.",
        prepTime: 0,
        isAvailable: true,
        imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjB0Ec7OQfCbLbMOb8rTkUZb3SwX3xA9KOe_nZafipGg&s=10"
    },

    // =========================================================
    // SNACKS
    // =========================================================
    {
        itemName: "Vanilla Cupcake",
        category: "Snacks",
        price: 1500,
        stockQuantity: 30,
        description: "Soft and fluffy vanilla cupcake topped with smooth buttercream frosting.",
        prepTime: 0,
        isAvailable: true,
        imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSatCd8Sx9lv00uP71E9o87hIpHKfPn9gyX5GpDfk8KVA&s=10"
    },
    {
        itemName: "Glazed Doughnut",
        category: "Snacks",
        price: 1000,
        stockQuantity: 40,
        description: "Soft doughnut finished with a smooth sweet glaze.",
        prepTime: 0,
        isAvailable: true,
        imageUrl: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&auto=format&fit=crop&q=80"
    }
];

const seedDatabase = async () => {
    try {
        await mongoose.connect(MONGO_URI);

        console.log("=======================================");
        console.log("   SMART DINE DATABASE SEEDING");
        console.log("=======================================");
        console.log("Connected to MongoDB...");

        await Inventory.deleteMany({});
        console.log("Existing inventory cleared.");

        await Inventory.insertMany(seedItems);
        console.log(`${seedItems.length} menu items successfully added to the database.`);

        const categorySummary = {};
        seedItems.forEach((item) => {
            categorySummary[item.category] = (categorySummary[item.category] || 0) + 1;
        });

        console.log("\nMenu Category Summary:");
        Object.entries(categorySummary).forEach(([category, count]) => {
            console.log(`- ${category}: ${count} items`);
        });

        console.log("\nDatabase seeding completed successfully.");
        console.log("=======================================");
    } catch (err) {
        console.error("Error seeding database:", err);
    } finally {
        await mongoose.connection.close();
        console.log("MongoDB connection closed.");
    }
};

seedDatabase();