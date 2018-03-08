export const production = false; // change to true when deployment to server
export const jwtSecret = 'tabvn'; // Json webtoken Secret key for encoding and decoding
export const appPort = 3001;
export const rootUser = {
    firstName: 'Admin',
    lastName: 'Mr',
    email: 'toan@tabvn.com',
    password: '$2a$10$90jY811.WpnWOoL62XKzUeyLp.eNvYvetPBL4qcY13s2ooHAKsa6C'
};
export const database = {
	dbName: 'tabvn',
	dbUrl: 'mongodb://localhost:27017'
}