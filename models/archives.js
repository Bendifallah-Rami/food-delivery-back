const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Archives = sequelize.define('Archives', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    entityType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    entityId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    data: {
      type: DataTypes.JSON,
      allowNull: false
    },
    archivedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true
    },
    archivedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'archives',
    timestamps: true,
    indexes: [
      {
        fields: ['entityType']
      },
      {
        fields: ['entityId']
      },
      {
        fields: ['archivedBy']
      },
      {
        fields: ['archivedAt']
      },
      {
        fields: ['entityType', 'entityId']
      }
    ]
  });

  Archives.associate = (models) => {
    Archives.belongsTo(models.User, { 
      foreignKey: 'archivedBy',
      as: 'archivedByUser'
    });
  };

  return Archives;
};