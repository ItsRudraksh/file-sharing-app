const passport = require("passport");

// This middleware protects routes by ensuring a valid JWT is present.
module.exports = passport.authenticate("jwt", { session: false });