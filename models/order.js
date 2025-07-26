const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    orderNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    orderType: {
      type: DataTypes.ENUM('delivery', 'pickup'),
      allowNull: false,
      defaultValue: 'delivery'
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    tax: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    deliveryFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    deliveryAddressId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'user_addresses',
        key: 'id'
      }
    },
    specialInstructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    estimatedDeliveryTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    actualDeliveryTime: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'orders',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['orderNumber']
      },
      {
        fields: ['customerId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['orderType']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  Order.associate = (models) => {
    Order.belongsTo(models.User, { 
      foreignKey: 'customerId',
      as: 'customer'
    });
    Order.belongsTo(models.UserAddress, { 
      foreignKey: 'deliveryAddressId',
      as: 'deliveryAddress'
    });
    Order.hasMany(models.OrderItem, { 
      foreignKey: 'orderId',
      as: 'orderItems'
    });
    Order.hasOne(models.Payment, { 
      foreignKey: 'orderId',
      as: 'payment'
    });
    Order.hasOne(models.Delivery, { 
      foreignKey: 'orderId',
      as: 'delivery'
    });
  };

  return Order;
};