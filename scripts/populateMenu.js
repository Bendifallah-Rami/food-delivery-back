const { Category, MenuItem } = require('../models');

async function createCategoriesAndMenuItems() {
  try {
    console.log('🏗️ Creating categories and menu items...\n');

    // 1. CREATE CATEGORIES
    console.log('📂 Creating categories...');
    
    const categories = [
      {
        name: 'Pizza',
        description: 'Delicious wood-fired pizzas made with fresh ingredients',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
        sortOrder: 1
      },
      {
        name: 'Burger',
        description: 'Juicy gourmet burgers with premium beef and fresh toppings',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
        sortOrder: 2
      },
      {
        name: 'Ramen',
        description: 'Authentic Japanese ramen bowls with rich broths',
        image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
        sortOrder: 3
      },
      {
        name: 'Ice Cream',
        description: 'Premium ice cream and frozen desserts',
        image: 'https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?w=400',
        sortOrder: 4
      },
      {
        name: 'Sides',
        description: 'Perfect sides to complement your meal',
        image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400',
        sortOrder: 5
      },
      {
        name: 'Drinks',
        description: 'Refreshing beverages and specialty drinks',
        image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400',
        sortOrder: 6
      },
      {
        name: 'Tacos',
        description: 'Authentic Mexican tacos with fresh ingredients',
        image: 'https://images.unsplash.com/photo-1565299585323-38174c58d7f8?w=400',
        sortOrder: 7
      }
    ];

    // Clear existing data first
    console.log('🧹 Clearing existing menu items and categories...');
    await MenuItem.destroy({ where: {} });
    await Category.destroy({ where: {} });

    // Create categories
    const createdCategories = {};
    for (const categoryData of categories) {
      const category = await Category.create(categoryData);
      createdCategories[category.name] = category.id;
      console.log(`✅ Created category: ${category.name} (ID: ${category.id})`);
    }

    console.log('\n🍴 Creating menu items...\n');

    // 2. CREATE MENU ITEMS
    const menuItems = [
      // PIZZA ITEMS
      {
        name: 'Pizza Margherita',
        description: 'Classic pizza with fresh mozzarella, tomato sauce, and basil',
        price: 12.99,
        categoryId: createdCategories['Pizza'],
        preparationTime: 15,
        image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400',
        ingredients: ['Mozzarella', 'Tomato Sauce', 'Fresh Basil', 'Olive Oil']
      },
      {
        name: 'Chicken BBQ Pizza',
        description: 'Grilled chicken with BBQ sauce, red onions, and mozzarella',
        price: 16.99,
        categoryId: createdCategories['Pizza'],
        preparationTime: 18,
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
        ingredients: ['Grilled Chicken', 'BBQ Sauce', 'Red Onions', 'Mozzarella', 'Bell Peppers']
      },
      {
        name: 'Pepperoni Pizza',
        description: 'Classic pepperoni with mozzarella and tomato sauce',
        price: 14.99,
        categoryId: createdCategories['Pizza'],
        preparationTime: 15,
        image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400',
        ingredients: ['Pepperoni', 'Mozzarella', 'Tomato Sauce', 'Oregano']
      },
      {
        name: 'Vegetarian Supreme',
        description: 'Bell peppers, mushrooms, onions, olives, and fresh tomatoes',
        price: 15.99,
        categoryId: createdCategories['Pizza'],
        preparationTime: 16,
        image: 'https://images.unsplash.com/photo-1571066811602-716837d681de?w=400',
        ingredients: ['Bell Peppers', 'Mushrooms', 'Red Onions', 'Black Olives', 'Fresh Tomatoes', 'Mozzarella']
      },
      {
        name: 'Four Cheese Pizza',
        description: 'Mozzarella, parmesan, gorgonzola, and ricotta cheese blend',
        price: 17.99,
        categoryId: createdCategories['Pizza'],
        preparationTime: 17,
        image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
        ingredients: ['Mozzarella', 'Parmesan', 'Gorgonzola', 'Ricotta', 'White Sauce']
      },

      // BURGER ITEMS
      {
        name: 'Classic Beef Burger',
        description: 'Juicy beef patty with lettuce, tomato, onion, and special sauce',
        price: 11.99,
        categoryId: createdCategories['Burger'],
        preparationTime: 12,
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
        ingredients: ['Beef Patty', 'Lettuce', 'Tomato', 'Red Onion', 'Pickles', 'Special Sauce']
      },
      {
        name: 'Chicken Deluxe',
        description: 'Grilled chicken breast with avocado, bacon, and ranch dressing',
        price: 13.99,
        categoryId: createdCategories['Burger'],
        preparationTime: 14,
        image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=400',
        ingredients: ['Grilled Chicken', 'Avocado', 'Bacon', 'Lettuce', 'Tomato', 'Ranch Dressing']
      },
      {
        name: 'Double Cheeseburger',
        description: 'Two beef patties with double cheese, lettuce, and burger sauce',
        price: 15.99,
        categoryId: createdCategories['Burger'],
        preparationTime: 15,
        image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400',
        ingredients: ['2 Beef Patties', 'Double Cheese', 'Lettuce', 'Onion', 'Burger Sauce']
      },
      {
        name: 'Veggie Burger',
        description: 'Plant-based patty with fresh vegetables and herb mayo',
        price: 12.99,
        categoryId: createdCategories['Burger'],
        preparationTime: 13,
        image: 'https://images.unsplash.com/photo-1525059696034-4967a729002e?w=400',
        ingredients: ['Plant-Based Patty', 'Lettuce', 'Tomato', 'Cucumber', 'Herb Mayo']
      },
      {
        name: 'BBQ Bacon Burger',
        description: 'Beef patty with crispy bacon, BBQ sauce, and onion rings',
        price: 16.99,
        categoryId: createdCategories['Burger'],
        preparationTime: 16,
        image: 'https://images.unsplash.com/photo-1572448862527-d3c904757de6?w=400',
        ingredients: ['Beef Patty', 'Crispy Bacon', 'BBQ Sauce', 'Onion Rings', 'Cheddar Cheese']
      },

      // RAMEN ITEMS
      {
        name: 'Tonkotsu Ramen',
        description: 'Rich pork bone broth with chashu, green onions, and soft-boiled egg',
        price: 14.99,
        categoryId: createdCategories['Ramen'],
        preparationTime: 20,
        image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
        ingredients: ['Pork Bone Broth', 'Chashu Pork', 'Soft-Boiled Egg', 'Green Onions', 'Nori', 'Bamboo Shoots']
      },
      {
        name: 'Miso Ramen',
        description: 'Savory miso-based broth with corn, bean sprouts, and pork belly',
        price: 13.99,
        categoryId: createdCategories['Ramen'],
        preparationTime: 18,
        image: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=400',
        ingredients: ['Miso Broth', 'Pork Belly', 'Corn', 'Bean Sprouts', 'Green Onions', 'Sesame Seeds']
      },
      {
        name: 'Shoyu Ramen',
        description: 'Clear soy sauce-based broth with chicken, bamboo shoots, and nori',
        price: 13.49,
        categoryId: createdCategories['Ramen'],
        preparationTime: 19,
        image: 'https://images.unsplash.com/photo-1623341214825-9f4f963727da?w=400',
        ingredients: ['Shoyu Broth', 'Chicken', 'Bamboo Shoots', 'Nori', 'Green Onions', 'Soft-Boiled Egg']
      },
      {
        name: 'Spicy Kimchi Ramen',
        description: 'Spicy Korean-style ramen with kimchi, tofu, and vegetables',
        price: 15.49,
        categoryId: createdCategories['Ramen'],
        preparationTime: 17,
        image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400',
        ingredients: ['Spicy Broth', 'Kimchi', 'Tofu', 'Bean Sprouts', 'Green Onions', 'Chili Oil']
      },
      {
        name: 'Vegetarian Ramen',
        description: 'Vegetable-based broth with mushrooms, corn, and seasonal vegetables',
        price: 12.99,
        categoryId: createdCategories['Ramen'],
        preparationTime: 16,
        image: 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=400',
        ingredients: ['Vegetable Broth', 'Mixed Mushrooms', 'Corn', 'Bok Choy', 'Green Onions', 'Sesame Oil']
      },

      // ICE CREAM ITEMS
      {
        name: 'Vanilla Bean',
        description: 'Classic vanilla ice cream with real vanilla bean specks',
        price: 4.99,
        categoryId: createdCategories['Ice Cream'],
        preparationTime: 2,
        image: 'https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?w=400',
        ingredients: ['Fresh Cream', 'Vanilla Bean', 'Sugar', 'Milk']
      },
      {
        name: 'Chocolate Fudge',
        description: 'Rich chocolate ice cream with fudge chunks',
        price: 5.49,
        categoryId: createdCategories['Ice Cream'],
        preparationTime: 2,
        image: 'https://images.unsplash.com/photo-1488900128323-21503983a07e?w=400',
        ingredients: ['Chocolate', 'Fudge Chunks', 'Fresh Cream', 'Cocoa Powder']
      },
      {
        name: 'Strawberry Cheesecake',
        description: 'Creamy strawberry ice cream with cheesecake pieces',
        price: 5.99,
        categoryId: createdCategories['Ice Cream'],
        preparationTime: 2,
        image: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400',
        ingredients: ['Strawberries', 'Cheesecake Pieces', 'Fresh Cream', 'Graham Crackers']
      },
      {
        name: 'Mint Chocolate Chip',
        description: 'Refreshing mint ice cream with dark chocolate chips',
        price: 5.49,
        categoryId: createdCategories['Ice Cream'],
        preparationTime: 2,
        image: 'https://images.unsplash.com/photo-1560008581-09826d1de69e?w=400',
        ingredients: ['Fresh Mint', 'Dark Chocolate Chips', 'Fresh Cream', 'Peppermint Extract']
      },
      {
        name: 'Cookies & Cream',
        description: 'Vanilla ice cream loaded with chocolate cookie pieces',
        price: 5.49,
        categoryId: createdCategories['Ice Cream'],
        preparationTime: 2,
        image: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=400',
        ingredients: ['Vanilla Base', 'Chocolate Cookies', 'Fresh Cream', 'Cookie Crumbs']
      },

      // SIDES ITEMS
      {
        name: 'French Fries',
        description: 'Crispy golden fries with sea salt',
        price: 3.99,
        categoryId: createdCategories['Sides'],
        preparationTime: 8,
        image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400',
        ingredients: ['Potatoes', 'Sea Salt', 'Vegetable Oil']
      },
      {
        name: 'Onion Rings',
        description: 'Beer-battered onion rings served with ranch dip',
        price: 4.99,
        categoryId: createdCategories['Sides'],
        preparationTime: 10,
        image: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400',
        ingredients: ['Sweet Onions', 'Beer Batter', 'Breadcrumbs', 'Ranch Dip']
      },
      {
        name: 'Mozzarella Sticks',
        description: 'Breaded mozzarella sticks with marinara sauce',
        price: 6.99,
        categoryId: createdCategories['Sides'],
        preparationTime: 12,
        image: 'https://images.unsplash.com/photo-1631452180539-96aca7d48617?w=400',
        ingredients: ['Mozzarella Cheese', 'Breadcrumbs', 'Marinara Sauce', 'Italian Herbs']
      },
      {
        name: 'Buffalo Wings',
        description: '6 pieces of spicy buffalo wings with blue cheese dip',
        price: 8.99,
        categoryId: createdCategories['Sides'],
        preparationTime: 15,
        image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400',
        ingredients: ['Chicken Wings', 'Buffalo Sauce', 'Blue Cheese Dip', 'Celery']
      },
      {
        name: 'Caesar Salad',
        description: 'Fresh romaine lettuce with caesar dressing and croutons',
        price: 7.99,
        categoryId: createdCategories['Sides'],
        preparationTime: 5,
        image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',
        ingredients: ['Romaine Lettuce', 'Caesar Dressing', 'Croutons', 'Parmesan Cheese']
      },

      // DRINKS ITEMS
      {
        name: 'Coca Cola',
        description: 'Classic Coca Cola soft drink',
        price: 2.49,
        categoryId: createdCategories['Drinks'],
        preparationTime: 1,
        image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400',
        ingredients: ['Carbonated Water', 'Cola Syrup', 'Ice']
      },
      {
        name: 'Fresh Orange Juice',
        description: 'Freshly squeezed orange juice',
        price: 3.99,
        categoryId: createdCategories['Drinks'],
        preparationTime: 3,
        image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400',
        ingredients: ['Fresh Oranges', 'Ice']
      },
      {
        name: 'Iced Coffee',
        description: 'Cold brew coffee served over ice',
        price: 3.49,
        categoryId: createdCategories['Drinks'],
        preparationTime: 2,
        image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400',
        ingredients: ['Cold Brew Coffee', 'Ice', 'Sugar', 'Milk']
      },
      {
        name: 'Lemonade',
        description: 'Fresh lemonade with mint leaves',
        price: 2.99,
        categoryId: createdCategories['Drinks'],
        preparationTime: 2,
        image: 'https://images.unsplash.com/photo-1523371683702-95d0adf2d828?w=400',
        ingredients: ['Fresh Lemons', 'Sugar', 'Water', 'Mint Leaves', 'Ice']
      },
      {
        name: 'Green Tea',
        description: 'Hot or iced premium green tea',
        price: 2.79,
        categoryId: createdCategories['Drinks'],
        preparationTime: 3,
        image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400',
        ingredients: ['Green Tea Leaves', 'Hot Water', 'Honey']
      },

      // TACOS ITEMS
      {
        name: 'Beef Carnitas Tacos',
        description: '3 soft tacos with slow-cooked beef, onions, and cilantro',
        price: 9.99,
        categoryId: createdCategories['Tacos'],
        preparationTime: 10,
        image: 'https://images.unsplash.com/photo-1565299585323-38174c58d7f8?w=400',
        ingredients: ['Slow-Cooked Beef', 'Soft Tortillas', 'White Onions', 'Cilantro', 'Lime']
      },
      {
        name: 'Chicken Tacos',
        description: '3 tacos with grilled chicken, lettuce, cheese, and salsa',
        price: 8.99,
        categoryId: createdCategories['Tacos'],
        preparationTime: 8,
        image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400',
        ingredients: ['Grilled Chicken', 'Lettuce', 'Cheddar Cheese', 'Salsa', 'Sour Cream']
      },
      {
        name: 'Fish Tacos',
        description: '3 beer-battered fish tacos with cabbage slaw and chipotle mayo',
        price: 11.99,
        categoryId: createdCategories['Tacos'],
        preparationTime: 12,
        image: 'https://images.unsplash.com/photo-1624300629298-e9de39c13be5?w=400',
        ingredients: ['Beer-Battered Fish', 'Cabbage Slaw', 'Chipotle Mayo', 'Corn Tortillas', 'Lime']
      },
      {
        name: 'Vegetarian Tacos',
        description: '3 tacos with black beans, avocado, and fresh vegetables',
        price: 7.99,
        categoryId: createdCategories['Tacos'],
        preparationTime: 7,
        image: 'https://images.unsplash.com/photo-1512838243191-72b88b88f2fd?w=400',
        ingredients: ['Black Beans', 'Avocado', 'Tomatoes', 'Lettuce', 'Cheese', 'Lime']
      },
      {
        name: 'Shrimp Tacos',
        description: '3 grilled shrimp tacos with mango salsa and cilantro lime sauce',
        price: 12.99,
        categoryId: createdCategories['Tacos'],
        preparationTime: 11,
        image: 'https://images.unsplash.com/photo-1615870216519-2f9fa2fa4b3b?w=400',
        ingredients: ['Grilled Shrimp', 'Mango Salsa', 'Cilantro Lime Sauce', 'Red Cabbage', 'Corn Tortillas']
      }
    ];

    // Create menu items
    let createdCount = 0;
    for (const itemData of menuItems) {
      const menuItem = await MenuItem.create(itemData);
      createdCount++;
      console.log(`✅ Created: ${menuItem.name} - $${menuItem.price} (${menuItem.preparationTime}min)`);
    }

    console.log(`\n🎉 Successfully created ${Object.keys(createdCategories).length} categories and ${createdCount} menu items!`);
    console.log('\n📊 Summary:');
    for (const [categoryName, categoryId] of Object.entries(createdCategories)) {
      const itemCount = menuItems.filter(item => item.categoryId === categoryId).length;
      console.log(`   ${categoryName}: ${itemCount} items`);
    }

    return { categories: createdCategories, menuItemsCount: createdCount };

  } catch (error) {
    console.error('❌ Error creating categories and menu items:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🍽️ Populating database with categories and menu items...\n');

    const result = await createCategoriesAndMenuItems();
    
    console.log('\n🚀 Database populated successfully!');
    console.log('🔥 Ready for testing with comprehensive menu data!');

  } catch (error) {
    console.error('💥 Fatal error:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
main();
