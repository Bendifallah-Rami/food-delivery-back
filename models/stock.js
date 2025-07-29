const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Stock = sequelize.define('Stock', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    menuItemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'menu_items',
        key: 'id'
      }
    },
    currentStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    minimumStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    maximumStock: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    unit: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pieces'
    },
    lastUpdated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    supplier: {
      type: DataTypes.STRING,
      allowNull: true
    },
    cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    }
  }, {
    tableName: 'stock',
    timestamps: true,
    indexes: [
      {
        fields: ['menuItemId']
      },
      {
        fields: ['currentStock']
      },
      {
        fields: ['minimumStock']
      }
    ]
  });

  Stock.associate = (models) => {
    Stock.belongsTo(models.MenuItem, { 
      foreignKey: 'menuItemId',
      as: 'menuItem'
    });
  };

  return Stock;
};