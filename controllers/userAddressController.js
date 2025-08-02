const { UserAddress, User } = require('../models');

// Get all addresses for a user
const getUserAddresses = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const currentUser = req.user;

        // Check if user is trying to access their own addresses or if they are admin
        if (currentUser.role !== 'admin' && currentUser.id !== userId) {
            return res.status(403).json({
                success: false,
                error: "Access denied. You can only view your own addresses."
            });
        }

        const addresses = await UserAddress.findAll({
            where: { userId: userId },
            order: [
                ['isDefault', 'DESC'], // Default address first
                ['createdAt', 'DESC']   // Then by creation date
            ]
        });

        res.status(200).json({
            success: true,
            count: addresses.length,
            data: addresses
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// Get current user's addresses
const getMyAddresses = async (req, res) => {
    try {
        const userId = req.user.id;

        const addresses = await UserAddress.findAll({
            where: { userId: userId },
            order: [
                ['isDefault', 'DESC'],
                ['createdAt', 'DESC']
            ]
        });

        res.status(200).json({
            success: true,
            count: addresses.length,
            data: addresses
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// Get address by ID
const getAddressById = async (req, res) => {
    try {
        const addressId = parseInt(req.params.id);
        const currentUser = req.user;

        const address = await UserAddress.findByPk(addressId);

        if (!address) {
            return res.status(404).json({
                success: false,
                error: "Address not found"
            });
        }

        // Check if user owns this address or is admin
        if (currentUser.role !== 'admin' && currentUser.id !== address.userId) {
            return res.status(403).json({
                success: false,
                error: "Access denied. You can only view your own addresses."
            });
        }

        res.status(200).json({
            success: true,
            data: address
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// Create new address
const createAddress = async (req, res) => {
    try {
        const { userId, label, street, city, state, zipCode, isDefault, latitude, longitude } = req.body;
        const currentUser = req.user;

        // Determine the target user ID
        const targetUserId = userId || currentUser.id;

        // Check permissions
        if (currentUser.role !== 'admin' && currentUser.id !== targetUserId) {
            return res.status(403).json({
                success: false,
                error: "Access denied. You can only create addresses for yourself."
            });
        }

        // Validate required fields
        if (!label || !street || !city || !state || !zipCode) {
            return res.status(400).json({
                success: false,
                error: "Please provide all required fields: label, street, city, state, zipCode"
            });
        }

        // Verify the target user exists
        const targetUser = await User.findByPk(targetUserId);
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                error: "User not found"
            });
        }

        // If this is being set as default, unset other default addresses
        if (isDefault) {
            await UserAddress.update(
                { isDefault: false },
                { where: { userId: targetUserId, isDefault: true } }
            );
        }

        // If this is the user's first address, make it default
        const existingAddressCount = await UserAddress.count({
            where: { userId: targetUserId }
        });

        const shouldBeDefault = isDefault || existingAddressCount === 0;

        const newAddress = await UserAddress.create({
            userId: targetUserId,
            label: label.trim(),
            street: street.trim(),
            city: city.trim(),
            state: state.trim(),
            zipCode: zipCode.trim(),
            isDefault: shouldBeDefault,
            latitude: latitude || null,
            longitude: longitude || null
        });

        res.status(201).json({
            success: true,
            message: `Address '${newAddress.label}' created successfully`,
            data: newAddress
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

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// Update address
const updateAddress = async (req, res) => {
    try {
        const addressId = parseInt(req.params.id);
        const { label, street, city, state, zipCode, isDefault, latitude, longitude } = req.body;
        const currentUser = req.user;

        const address = await UserAddress.findByPk(addressId);
        if (!address) {
            return res.status(404).json({
                success: false,
                error: "Address not found"
            });
        }

        // Check permissions
        if (currentUser.role !== 'admin' && currentUser.id !== address.userId) {
            return res.status(403).json({
                success: false,
                error: "Access denied. You can only update your own addresses."
            });
        }

        // If setting as default, unset other default addresses for this user
        if (isDefault && !address.isDefault) {
            await UserAddress.update(
                { isDefault: false },
                { where: { userId: address.userId, isDefault: true } }
            );
        }

        // Prepare update data
        const updateData = {};
        if (label !== undefined) updateData.label = label.trim();
        if (street !== undefined) updateData.street = street.trim();
        if (city !== undefined) updateData.city = city.trim();
        if (state !== undefined) updateData.state = state.trim();
        if (zipCode !== undefined) updateData.zipCode = zipCode.trim();
        if (isDefault !== undefined) updateData.isDefault = isDefault;
        if (latitude !== undefined) updateData.latitude = latitude;
        if (longitude !== undefined) updateData.longitude = longitude;

        await address.update(updateData);

        res.status(200).json({
            success: true,
            message: `Address '${address.label}' updated successfully`,
            data: address
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

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// Delete address
const deleteAddress = async (req, res) => {
    try {
        const addressId = parseInt(req.params.id);
        const currentUser = req.user;

        const address = await UserAddress.findByPk(addressId);
        if (!address) {
            return res.status(404).json({
                success: false,
                error: "Address not found"
            });
        }

        // Check permissions
        if (currentUser.role !== 'admin' && currentUser.id !== address.userId) {
            return res.status(403).json({
                success: false,
                error: "Access denied. You can only delete your own addresses."
            });
        }

        const addressLabel = address.label;
        const userId = address.userId;
        const wasDefault = address.isDefault;

        await address.destroy();

        // If the deleted address was default, set another address as default
        if (wasDefault) {
            const nextAddress = await UserAddress.findOne({
                where: { userId: userId },
                order: [['createdAt', 'DESC']]
            });

            if (nextAddress) {
                await nextAddress.update({ isDefault: true });
            }
        }

        res.status(200).json({
            success: true,
            message: `Address '${addressLabel}' deleted successfully`
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// Set address as default
const setDefaultAddress = async (req, res) => {
    try {
        const addressId = parseInt(req.params.id);
        const currentUser = req.user;

        const address = await UserAddress.findByPk(addressId);
        if (!address) {
            return res.status(404).json({
                success: false,
                error: "Address not found"
            });
        }

        // Check permissions
        if (currentUser.role !== 'admin' && currentUser.id !== address.userId) {
            return res.status(403).json({
                success: false,
                error: "Access denied. You can only modify your own addresses."
            });
        }

        // Unset other default addresses for this user
        await UserAddress.update(
            { isDefault: false },
            { where: { userId: address.userId, isDefault: true } }
        );

        // Set this address as default
        await address.update({ isDefault: true });

        res.status(200).json({
            success: true,
            message: `Address '${address.label}' set as default successfully`,
            data: address
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

module.exports = {
    getUserAddresses,
    getMyAddresses,
    getAddressById,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress
};
