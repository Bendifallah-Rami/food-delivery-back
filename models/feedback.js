const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Feedback = sequelize.define('Feedback', {
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
    type: {
      type: DataTypes.ENUM('order', 'delivery', 'general', 'complaint', 'suggestion'),
      allowNull: false
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      }
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'reviewed', 'resolved', 'closed'),
      allowNull: false,
      defaultValue: 'pending'
    },
    reviewedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    response: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'feedback',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['rating']
      },
      {
        fields: ['isPublic']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  Feedback.associate = (models) => {
    Feedback.belongsTo(models.User, { 
      foreignKey: 'userId',
      as: 'user'
    });
    Feedback.belongsTo(models.User, { 
      foreignKey: 'reviewedBy',
      as: 'reviewer'
    });
  };

  return Feedback;
};