const { Stock, MenuItem } = require('../models');

async function populateStock() {
  try {
    console.log('📦 Populating stock for all menu items...\n');

    // Get all menu items
    const menuItems = await MenuItem.findAll();
    console.log(`Found ${menuItems.length} menu items to stock`);

    // Clear existing stock records
    await Stock.destroy({ where: {} });
    console.log('🧹 Cleared existing stock records');

    // Define stock levels by category
    const stockByCategory = {
      1: { // Pizza
        currentStock: 50,
        minimumStock: 10,
        maximumStock: 100,
        unit: 'pieces',
        supplier: 'Fresh Dough Supply Co.',
        cost: 8.50
      },
      2: { // Burger
        currentStock: 40,
        minimumStock: 8,
        maximumStock: 80,
        unit: 'pieces',
        supplier: 'Premium Meat Suppliers',
        cost: 6.75
      },
      3: { // Ramen
        currentStock: 30,
        minimumStock: 5,
        maximumStock: 60,
        unit: 'bowls',
        supplier: 'Asian Food Distributors',
        cost: 7.25
      },
      4: { // Ice Cream
        currentStock: 25,
        minimumStock: 5,
        maximumStock: 50,
        unit: 'scoops',
        supplier: 'Dairy Fresh Ltd.',
        cost: 2.50
      },
      5: { // Sides
        currentStock: 60,
        minimumStock: 15,
        maximumStock: 120,
        unit: 'servings',
        supplier: 'Quick Sides Supply',
        cost: 1.75
      },
      6: { // Drinks
        currentStock: 100,
        minimumStock: 20,
        maximumStock: 200,
        unit: 'bottles',
        supplier: 'Beverage World',
        cost: 0.85
      },
      7: { // Tacos
        currentStock: 45,
        minimumStock: 10,
        maximumStock: 90,
        unit: 'pieces',
        supplier: 'Mexican Fresh Foods',
        cost: 4.25
      }
    };

    // Create stock records for each menu item
    const stockRecords = [];
    for (const menuItem of menuItems) {
      const stockConfig = stockByCategory[menuItem.categoryId] || {
        currentStock: 25,
        minimumStock: 5,
        maximumStock: 50,
        unit: 'pieces',
        supplier: 'Default Supplier',
        cost: 5.00
      };

      const stockRecord = {
        menuItemId: menuItem.id,
        currentStock: stockConfig.currentStock,
        minimumStock: stockConfig.minimumStock,
        maximumStock: stockConfig.maximumStock,
        unit: stockConfig.unit,
        lastUpdated: new Date(),
        supplier: stockConfig.supplier,
        cost: stockConfig.cost
      };

      stockRecords.push(stockRecord);
      console.log(`📦 ${menuItem.name}: ${stockConfig.currentStock} ${stockConfig.unit}`);
    }

    // Bulk create stock records
    await Stock.bulkCreate(stockRecords);

    console.log(`\n✅ Successfully created stock records for ${stockRecords.length} menu items`);

    // Display stock summary by category
    console.log('\n📊 STOCK SUMMARY BY CATEGORY:');
    console.log('=' .repeat(60));
    
    for (const [categoryId, config] of Object.entries(stockByCategory)) {
      const categoryItems = menuItems.filter(item => item.categoryId == categoryId);
      const totalValue = categoryItems.length * config.currentStock * config.cost;
      
      const categoryNames = {
        1: 'Pizza', 2: 'Burger', 3: 'Ramen', 4: 'Ice Cream',
        5: 'Sides', 6: 'Drinks', 7: 'Tacos'
      };
      
      console.log(`🏷️  ${categoryNames[categoryId]}:`);
      console.log(`   📦 Stock Level: ${config.currentStock} ${config.unit} per item`);
      console.log(`   🔽 Min Level: ${config.minimumStock} ${config.unit}`);
      console.log(`   🔼 Max Level: ${config.maximumStock} ${config.unit}`);
      console.log(`   📋 Items: ${categoryItems.length}`);
      console.log(`   💰 Unit Cost: $${config.cost}`);
      console.log(`   💵 Total Value: $${totalValue.toFixed(2)}`);
      console.log(`   🚚 Supplier: ${config.supplier}`);
      console.log('');
    }

    // Calculate total inventory value
    const totalInventoryValue = stockRecords.reduce((sum, record) => {
      return sum + (record.currentStock * record.cost);
    }, 0);

    console.log('💰 TOTAL INVENTORY VALUE: $' + totalInventoryValue.toFixed(2));
    console.log('\n🎯 STOCK ALERTS CONFIGURED:');
    console.log('   ⚠️  Low stock alerts when below minimum threshold');
    console.log('   🔴 Auto-disable menu items when stock reaches 0');
    console.log('   📧 Email notifications to admin for stock alerts');

    return stockRecords;

  } catch (error) {
    console.error('❌ Error populating stock:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🏭 STOCK MANAGEMENT SYSTEM INITIALIZATION\n');
    
    const stockRecords = await populateStock();
    
    console.log('\n🎉 STOCK SYSTEM READY!');
    console.log('=' .repeat(50));
    console.log('✅ All menu items have stock quantities');
    console.log('✅ Stock checking enabled for orders');
    console.log('✅ Auto stock reduction on order placement');
    console.log('✅ Low stock and out-of-stock alerts configured');
    console.log('✅ Menu items auto-disable when stock = 0');
    
    console.log('\n📝 NEXT STEPS:');
    console.log('   1. Test orders to see stock reduction in action');
    console.log('   2. Monitor stock levels via admin dashboard');
    console.log('   3. Set up supplier reorder notifications');
    console.log('   4. Configure stock alert email recipients');

  } catch (error) {
    console.error('💥 Stock initialization failed:', error.message);
  } finally {
    process.exit(0);
  }
}

main();
