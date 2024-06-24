

const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config(); 

const sequelize = new Sequelize({
  database: process.env.DB_DATABASE,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306, 
  dialect: 'mysql',
  logging: false, 
  pool: {
    max:10, 
    min: 0, // Minimum number of connections in the pool
    acquire: 30000, // The maximum time, in milliseconds, that a connection can be idle before being released
    idle: 10000 // The maximum time, in milliseconds, that a connection can be idle before being released
  }
});




const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone_number: {
    type: DataTypes.STRING
  },
  email_address: {
    type: DataTypes.STRING
  },
  gender: {
    type: DataTypes.STRING
  },
  job_role_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  employment_date: {
    type: DataTypes.DATE
  },
  termination_date: {
    type: DataTypes.DATE
  },
  emp_status_code: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'employees',
  timestamps: false
});

const Payroll = sequelize.define('Payroll', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  employee_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  payment_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  monthly_bonus: {
    type: DataTypes.FLOAT
  },
  gross_pay: {
    type: DataTypes.FLOAT,
    allowNull: false
  }
}, {
  tableName: 'payroll',
  timestamps: false
});
  

  async function testConnection() {
    try {
      await sequelize.authenticate();
      console.log('Connection to the database has been established successfully.');
  
      // Sync the models with the database
      await Employee.sync({ force: true });
    await Payroll.sync({ force: true });
      console.log('Tables created successfully.');
    } catch (error) {
      console.error('Unable to connect to the database:', error);
    }
  }
  
  // console.log(Payroll.bulkCreate());
  

  module.exports = {
    Employee,
    Payroll,
    sequelize, 
    testConnection
  };