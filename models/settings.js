const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Settings = sequelize.define('Settings', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
      allowNull: false,
      defaultValue: 'string'
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'general'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'settings',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['key']
      },
      {
        fields: ['category']
      },
      {
        fields: ['isPublic']
      }
    ]
  });

  return Settings;
};