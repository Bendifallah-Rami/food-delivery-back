const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Reports = sequelize.define('Reports', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    reportType: {
      type: DataTypes.ENUM('sales', 'orders', 'delivery', 'inventory', 'staff', 'customer'),
      allowNull: false
    },
    reportName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    parameters: {
      type: DataTypes.JSON,
      allowNull: true
    },
    data: {
      type: DataTypes.JSON,
      allowNull: false
    },
    generatedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('generating', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'generating'
    },
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'reports',
    timestamps: true,
    indexes: [
      {
        fields: ['reportType']
      },
      {
        fields: ['generatedBy']
      },
      {
        fields: ['status']
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['startDate', 'endDate']
      }
    ]
  });

  Reports.associate = (models) => {
    Reports.belongsTo(models.User, { 
      foreignKey: 'generatedBy',
      as: 'generator'
    });
  };

  return Reports;
};