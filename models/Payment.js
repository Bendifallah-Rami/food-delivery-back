const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'orders',
        key: 'id'
      }
    },
    paymentMethod: {
      type: DataTypes.ENUM('cash', 'card', 'digital_wallet', 'bank_transfer'),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
      allowNull: false,
      defaultValue: 'pending'
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    paymentGateway: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    refundedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    refundAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    }
  }, {
    tableName: 'payments',
    timestamps: true,
    indexes: [
      {
        fields: ['orderId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['paymentMethod']
      },
      {
        unique: true,
        fields: ['transactionId']
      }
    ]
  });

  Payment.associate = (models) => {
    Payment.belongsTo(models.Order, { 
      foreignKey: 'orderId',
      as: 'order'
    });
  };

  return Payment;
};