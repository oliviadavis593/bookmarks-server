require('dotenv').config();

//Postgrator-cli => command that accepts on argument => destination 
//We run each of our migrations when we create them so "destination" step number will corres. to a migration #
//Postgrator-cli => connects to db by reading config file containing db URL
//as the valie for a connectionString setting
//then we put environmental var in .env file 
module.exports = {
    "migrationsDirectory": "migrations",
    "driver": "pg",
    //ternary condition checks the NODE_ENV & either uses DB_URL or TEST_DB_URL
    "connectionString": (process.env.NODE_ENV === 'test')
        ? process.env.TEST_DB_URL
        : process.env.DB_URL
}

