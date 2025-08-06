const { MenuItem, Category, Stock } = require('../models');
const { Op } = require('sequelize');

// Get all menu items with filtering and pagination
const getAllMenuItems = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      categoryId, 
      isAvailable, 
      isVegetarian, 
      isVegan, 
      isSpicy,
      priceMin, 
      priceMax, 
      search 
    } = req.query;
    
    const offset = (page - 1) * limit;
    const whereConditions = {};

    // Filter by category
    if (categoryId) {
      whereConditions.categoryId = categoryId;
    }

    // Filter by availability
    if (isAvailable !== undefined) {
      whereConditions.isAvailable = isAvailable === 'true';
    }

    // Filter by dietary preferences
    if (isVegetarian !== undefined) {
      whereConditions.isVegetarian = isVegetarian === 'true';
    }
    if (isVegan !== undefined) {
      whereConditions.isVegan = isVegan === 'true';
    }
    if (isSpicy !== undefined) {
      whereConditions.isSpicy = isSpicy === 'true';
    }

    // Filter by price range
    if (priceMin || priceMax) {
      whereConditions.price = {};
      if (priceMin) whereConditions.price[Op.gte] = parseFloat(priceMin);
      if (priceMax) whereConditions.price[Op.lte] = parseFloat(priceMax);
    }

    // Search by name or description
    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const menuItems = await MenuItem.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'description', 'isActive']
        },
        {
          model: Stock,
          as: 'stock',
          attributes: ['id', 'currentStock', 'minimumStock', 'unit', 'lastUpdated']
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: menuItems.count,
      totalPages: Math.ceil(menuItems.count / limit),
      currentPage: parseInt(page),
      data: menuItems.rows
    });
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching menu items'
    });
  }
};

// Get menu items by category (public endpoint)
const getMenuItemsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { includeUnavailable = false } = req.query;

    const whereConditions = { categoryId };
    
    // By default, only show available items for public endpoint
    if (!includeUnavailable) {
      whereConditions.isAvailable = true;
    }

    const menuItems = await MenuItem.findAll({
      where: whereConditions,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'description']
        },
        {
          model: Stock,
          as: 'stock',
          attributes: ['currentStock', 'unit']
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      count: menuItems.length,
      data: menuItems
    });
  } catch (error) {
    console.error('Error fetching menu items by category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching menu items by category'
    });
  }
};

// Get menu item by ID
const getMenuItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const menuItem = await MenuItem.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'description', 'isActive']
        },
        {
          model: Stock,
          as: 'stock',
          attributes: ['id', 'currentStock', 'minimumStock', 'maximumStock', 'unit', 'supplier', 'cost', 'lastUpdated']
        }
      ]
    });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.json({
      success: true,
      data: menuItem
    });
  } catch (error) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching menu item'
    });
  }
};

// Create new menu item (Staff/Admin only)
const createMenuItem = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      image,
      categoryId,
      preparationTime,
      ingredients,
      nutritionalInfo,
      allergens,
      isVegetarian = false,
      isVegan = false,
      isSpicy = false,
      // Stock information
      initialStock = 0,
      minimumStock = 5,
      maximumStock,
      unit = 'pieces',
      supplier,
      cost
    } = req.body; 

    // Validate required fields
    if (!name || !price || !categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, and category are required'
      });
    }

    // Check if category exists
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if menu item name already exists in this category
    const existingItem = await MenuItem.findOne({
      where: { name, categoryId }
    });
    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: 'Menu item with this name already exists in this category'
      });
    }

    // Create menu item
    const menuItem = await MenuItem.create({
      name,
      description,
      price,
      image,
      categoryId,
      preparationTime,
      ingredients,
      nutritionalInfo,
      allergens,
      isVegetarian,
      isVegan,
      isSpicy,
      isAvailable: true
    });

    // Create initial stock record
    await Stock.create({
      menuItemId: menuItem.id,
      currentStock: initialStock,
      minimumStock,
      maximumStock,
      unit,
      supplier,
      cost,
      lastUpdated: new Date()
    });

    // Fetch the created item with associations
    const createdMenuItem = await MenuItem.findByPk(menuItem.id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'description']
        },
        {
          model: Stock,
          as: 'stock',
          attributes: ['id', 'currentStock', 'minimumStock', 'unit']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: createdMenuItem
    });
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating menu item'
    });
  }
};

// Update menu item (Staff/Admin only)
const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      image,
      categoryId,
      preparationTime,
      ingredients,
      nutritionalInfo,
      allergens,
      isVegetarian,
      isVegan,
      isSpicy,
      isAvailable
    } = req.body;

    const menuItem = await MenuItem.findByPk(id);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    // Check if category exists (if being updated)
    if (categoryId && categoryId !== menuItem.categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
    }

    // Check if name already exists in the category (if being updated)
    if (name && name !== menuItem.name) {
      const existingItem = await MenuItem.findOne({
        where: { 
          name, 
          categoryId: categoryId || menuItem.categoryId,
          id: { [Op.ne]: id }
        }
      });
      if (existingItem) {
        return res.status(400).json({
          success: false,
          message: 'Menu item with this name already exists in this category'
        });
      }
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (image !== undefined) updateData.image = image;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (preparationTime !== undefined) updateData.preparationTime = preparationTime;
    if (ingredients !== undefined) updateData.ingredients = ingredients;
    if (nutritionalInfo !== undefined) updateData.nutritionalInfo = nutritionalInfo;
    if (allergens !== undefined) updateData.allergens = allergens;
    if (isVegetarian !== undefined) updateData.isVegetarian = isVegetarian;
    if (isVegan !== undefined) updateData.isVegan = isVegan;
    if (isSpicy !== undefined) updateData.isSpicy = isSpicy;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;

    await menuItem.update(updateData);

    // Fetch updated item with associations
    const updatedMenuItem = await MenuItem.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'description']
        },
        {
          model: Stock,
          as: 'stock',
          attributes: ['id', 'currentStock', 'minimumStock', 'unit']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Menu item updated successfully',
      data: updatedMenuItem
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating menu item'
    });
  }
};

// Toggle menu item availability (Staff/Admin only)
const toggleAvailability = async (req, res) => {
  try {
    const { id } = req.params;

    const menuItem = await MenuItem.findByPk(id);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    await menuItem.update({ isAvailable: !menuItem.isAvailable });

    res.json({
      success: true,
      message: `Menu item ${menuItem.isAvailable ? 'enabled' : 'disabled'} successfully`,
      data: { id: menuItem.id, isAvailable: menuItem.isAvailable }
    });
  } catch (error) {
    console.error('Error toggling menu item availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling menu item availability'
    });
  }
};

// Delete menu item (Admin only)
const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    const menuItem = await MenuItem.findByPk(id, {
      include: [
        {
          model: Stock,
          as: 'stock'
        }
      ]
    });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    // Check if item has been ordered (you'll need to implement this when you have orders)
    // For now, we'll allow deletion but in production you might want to soft delete

    // Delete associated stock records first
    if (menuItem.stock && menuItem.stock.length > 0) {
      await Stock.destroy({ where: { menuItemId: id } });
    }

    await menuItem.destroy();

    res.json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting menu item'
    });
  }
};

// Get menu items with low stock (Staff/Admin only)
const getLowStockItems = async (req, res) => {
  try {
    const menuItems = await MenuItem.findAll({
      include: [
        {
          model: Stock,
          as: 'stock',
          where: {
            currentStock: {
              [Op.lte]: Stock.sequelize.col('minimumStock')
            }
          },
          attributes: ['id', 'currentStock', 'minimumStock', 'unit', 'supplier', 'lastUpdated']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ],
      order: [['stock', 'currentStock', 'ASC']]
    });

    res.json({
      success: true,
      count: menuItems.length,
      data: menuItems
    });
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching low stock items'
    });
  }
};

// Get popular menu items (based on orders - placeholder for now)
const getPopularItems = async (req, res) => {
  try {
    // This is a placeholder - you'll implement this when you have order data
    const popularItems = await MenuItem.findAll({
      where: { isAvailable: true },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ],
      limit: 10,
      order: [['createdAt', 'DESC']] // For now, show newest items
    });

    res.json({
      success: true,
      message: 'Popular items (currently showing newest items)',
      count: popularItems.length,
      data: popularItems
    });
  } catch (error) {
    console.error('Error fetching popular items:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching popular items'
    });
  }
};

module.exports = {
  getAllMenuItems,
  getMenuItemsByCategory,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  toggleAvailability,
  deleteMenuItem,
  getLowStockItems,
  getPopularItems
};
