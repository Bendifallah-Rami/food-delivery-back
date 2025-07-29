const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MenuItem = sequelize.define('MenuItem', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    preparationTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Preparation time in minutes'
    },
    ingredients: {
      type: DataTypes.JSON,
      allowNull: true
    },
    nutritionalInfo: {
      type: DataTypes.JSON,
      allowNull: true
    },
    allergens: {
      type: DataTypes.JSON,
      allowNull: true
    },
    isVegetarian: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isVegan: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isSpicy: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'menu_items',
    timestamps: true,
    indexes: [
      {
        fields: ['categoryId']
      },
      {
        fields: ['isAvailable']
      },
      {
        fields: ['price']
      },
      {
        fields: ['isVegetarian']
      },
      {
        fields: ['isVegan']
      }
    ]
  });

  MenuItem.associate = (models) => {
    MenuItem.belongsTo(models.Category, { 
      foreignKey: 'categoryId',
      as: 'category'
    });
    MenuItem.hasMany(models.OrderItem, { 
      foreignKey: 'menuItemId',
      as: 'orderItems'
    });
    MenuItem.hasMany(models.Stock, { 
      foreignKey: 'menuItemId',
      as: 'stock'
    });
  };

  return MenuItem;
};