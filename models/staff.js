const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Staff = sequelize.define('Staff', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    employeeId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    position: {
      type: DataTypes.ENUM('kitchen', 'delivery', 'manager'),
      allowNull: false
    },
    department: {
      type: DataTypes.STRING,
      allowNull: true
    },
    hireDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    salary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    workingHours: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'staff',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['employeeId']
      },
      {
        fields: ['position']
      },
      {
        fields: ['isActive']
      }
    ]
  });

  Staff.associate = (models) => {
    Staff.belongsTo(models.User, { 
      foreignKey: 'userId',
      as: 'user'
    });
    Staff.hasMany(models.Delivery, { 
      foreignKey: 'deliveryPersonId',
      as: 'deliveries'
    });
  };

  return Staff;
};