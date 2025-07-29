const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: { 
      type: DataTypes.STRING,
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('customer', 'staff', 'admin'),
      allowNull: false,
      defaultValue: 'customer'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['email']
      },
      {
        fields: ['role']
      }
    ]
  });

  User.associate = (models) => {
    User.hasMany(models.Order, { 
      foreignKey: 'customerId',
      as: 'orders'
    });
    User.hasMany(models.UserAddress, { 
      foreignKey: 'userId',
      as: 'addresses'
    });
    User.hasMany(models.Notification, { 
      foreignKey: 'userId',
      as: 'notifications'
    });
    User.hasMany(models.Feedback, { 
      foreignKey: 'userId',
      as: 'feedbacks'
    });
    User.hasOne(models.Staff, { 
      foreignKey: 'userId',
      as: 'staffProfile'
    });
  };

  return User;
};