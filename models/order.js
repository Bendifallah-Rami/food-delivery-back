const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    orderNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'preparing', 'ready', 'assigned', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled'),
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
    priority: {
      type: DataTypes.ENUM('normal', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'normal'
    },
    driverId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'staff',
        key: 'id'
      }
    },
    statusNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    statusUpdatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    statusUpdatedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    deliveryAddressId: {
      type: DataTypes.INTEGER,
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
    Order.belongsTo(models.Staff, { 
      foreignKey: 'driverId',
      as: 'driver'
    });
    Order.belongsTo(models.User, { 
      foreignKey: 'statusUpdatedBy',
      as: 'statusUpdater'
    });
  };

  return Order;
};