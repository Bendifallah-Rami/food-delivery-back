const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OrderItem = sequelize.define('OrderItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id'
      }
    },
    menuItemId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'menu_items',
        key: 'id'
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    specialInstructions: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'order_items',
    timestamps: true,
    indexes: [
      {
        fields: ['orderId']
      },
      {
        fields: ['menuItemId']
      }
    ]
  });

  OrderItem.associate = (models) => {
    OrderItem.belongsTo(models.Order, { 
      foreignKey: 'orderId',
      as: 'order'
    });
    OrderItem.belongsTo(models.MenuItem, { 
      foreignKey: 'menuItemId',
      as: 'menuItem'
    });
  };

  return OrderItem;
};