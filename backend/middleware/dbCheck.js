const { getDBStatus } = require("../config/db");

const dbCheck = (req, res, next) => {
  if (!getDBStatus()) {
    return res.status(503).json({
      success: false,
      message: "DB not connected",
    });
  }

  next();
};

module.exports = dbCheck;