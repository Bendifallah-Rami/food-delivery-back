const { Category } = require('../models');

// Get all categories
const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({
            order: [['sortOrder', 'ASC'], ['name', 'ASC']]
        });

        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// Get active categories only (for public use)
const getActiveCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({
            where: { isActive: true },
            order: [['sortOrder', 'ASC'], ['name', 'ASC']]
        });

        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// Get category by ID
const getCategoryById = async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id);
        const category = await Category.findByPk(categoryId);

        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        res.status(200).json({
            success: true,
            data: category
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// Create new category - Admin only
const createCategory = async (req, res) => {
    try {
        const { name, description, image, isActive, sortOrder } = req.body;

        // Validate required fields
        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Category name is required'
            });
        }

        // Check if category with same name already exists
        const existingCategory = await Category.findOne({
            where: { name: name.trim() }
        });

        if (existingCategory) {
            return res.status(409).json({
                success: false,
                error: 'Category with this name already exists'
            });
        }

        const newCategory = await Category.create({
            name: name.trim(),
            description: description || null,
            image: image || null,
            isActive: isActive !== undefined ? isActive : true,
            sortOrder: sortOrder || 0
        });

        res.status(201).json({
            success: true,
            message: `Category '${newCategory.name}' created successfully`,
            data: newCategory
        });
    } catch (err) {
        // Handle Sequelize validation errors
        if (err.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: err.errors.map(error => ({
                    field: error.path,
                    message: error.message
                }))
            });
        }

        // Handle Sequelize unique constraint errors
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                success: false,
                error: 'Category name must be unique'
            });
        }

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// Update category - Admin only
const updateCategory = async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id);
        const { name, description, image, isActive, sortOrder } = req.body;

        const category = await Category.findByPk(categoryId);
        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        // If name is being updated, check for uniqueness
        if (name && name.trim() !== category.name) {
            const existingCategory = await Category.findOne({
                where: { 
                    name: name.trim(),
                    id: { [require('sequelize').Op.ne]: categoryId }
                }
            });

            if (existingCategory) {
                return res.status(409).json({
                    success: false,
                    error: 'Category with this name already exists'
                });
            }
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name.trim();
        if (description !== undefined) updateData.description = description;
        if (image !== undefined) updateData.image = image;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

        await category.update(updateData);

        res.status(200).json({
            success: true,
            message: `Category '${category.name}' updated successfully`,
            data: category
        });
    } catch (err) {
        // Handle Sequelize validation errors
        if (err.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: err.errors.map(error => ({
                    field: error.path,
                    message: error.message
                }))
            });
        }

        // Handle Sequelize unique constraint errors
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                success: false,
                error: 'Category name must be unique'
            });
        }

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// Delete category - Admin only
const deleteCategory = async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id);

        const category = await Category.findByPk(categoryId);
        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        // Check if category has menu items
        const { MenuItem } = require('../models');
        const menuItemsCount = await MenuItem.count({
            where: { categoryId: categoryId }
        });

        if (menuItemsCount > 0) {
            return res.status(400).json({
                success: false,
                error: `Cannot delete category '${category.name}' because it has ${menuItemsCount} menu item(s). Please reassign or delete the menu items first.`
            });
        }

        await category.destroy();

        res.status(200).json({
            success: true,
            message: `Category '${category.name}' deleted successfully`
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// Toggle category status - Admin only
const toggleCategoryStatus = async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id);

        const category = await Category.findByPk(categoryId);
        if (!category) {
            return res.status(404).json({
                success: false,
                error: 'Category not found'
            });
        }

        await category.update({ isActive: !category.isActive });

        res.status(200).json({
            success: true,
            message: `Category '${category.name}' ${category.isActive ? 'activated' : 'deactivated'} successfully`,
            data: category
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

module.exports = {
    getAllCategories,
    getActiveCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus
};
