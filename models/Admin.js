const User = require("./User");

/**
 * Admin model - extends User (Mongoose discriminator = Java inheritance).
 * No extra fields needed for admin.
 */
const Admin = User.discriminator("Admin", new (require("mongoose").Schema)({}));

module.exports = Admin;
