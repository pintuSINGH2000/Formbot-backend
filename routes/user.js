const express = require("express");
const {
  registerController,
  loginController,
  updateController,
} = require("../controllers/user");
const { verifyToken } = require("../Middleware/verifyToken");
const router = express.Router();

router.post("/register", registerController);
router.post("/login", loginController);
router.put("/update-user", verifyToken, updateController);

module.exports = router;
