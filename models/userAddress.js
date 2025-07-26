const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserAddress = sequelize.define('UserAddress', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    label: {
      type: DataTypes.STRING,
      allowNull: false
    },
    street: {
      type: DataTypes.STRING,
      allowNull: false
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false
    },
    zipCode: {
      type: DataTypes.STRING,
      allowNull: false
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    }
  }, {
    tableName: 'user_addresses',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['userId', 'isDefault']
      }
    ]
  });

  UserAddress.associate = (models) => {
    UserAddress.belongsTo(models.User, { 
      foreignKey: 'userId',
      as: 'user'
    });
    UserAddress.hasMany(models.Order, { 
      foreignKey: 'deliveryAddressId',
      as: 'orders'
    });
  };

  return UserAddress;
};