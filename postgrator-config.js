require('dotenv').config();

module.exports = {
    "migrationsDirectory": "migrations",
    "driver": "pg",
    "connectionString": process.env.DB_URL
}

//Postgrator-cli => command that accepts on argument => destination 
//We run each of our migrations when we create them so "destination" step number will corres. to a migration #
//Postgrator-cli => connects to db by reading config file containing db URL
//as the valie for a connectionString setting
//then we put environmental var in .env file 