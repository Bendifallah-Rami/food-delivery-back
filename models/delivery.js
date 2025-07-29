const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Delivery = sequelize.define('Delivery', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'orders',
        key: 'id'
      }
    },
    deliveryPersonId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'staff',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('assigned', 'picked_up', 'in_transit', 'delivered', 'failed'),
      allowNull: false,
      defaultValue: 'assigned'
    },
    estimatedDeliveryTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    actualDeliveryTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    deliveryFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    distance: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Distance in kilometers'
    },
    deliveryNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    customerRating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      }
    },
    customerFeedback: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'deliveries',
    timestamps: true,
    indexes: [
      {
        fields: ['orderId']
      },
      {
        fields: ['deliveryPersonId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['estimatedDeliveryTime']
      }
    ]
  });

  Delivery.associate = (models) => {
    Delivery.belongsTo(models.Order, { 
      foreignKey: 'orderId',
      as: 'order'
    });
    Delivery.belongsTo(models.Staff, { 
      foreignKey: 'deliveryPersonId',
      as: 'deliveryPerson'
    });
  };

  return Delivery;
};