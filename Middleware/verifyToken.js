const JWT = require("jsonwebtoken");

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(400).send({ errorMessage: "Unauthorized access" });
    }
    const decode = JWT.verify(token, process.env.SECRET_KEY);
    req.creator = decode.userId;
    next();
  } catch (error) {
    return res.status(401).send({
      error,
      isUnauthorized: true,
      errorMessage: "Unauthorized access! Invalid token",
    });
  }
};

module.exports = {
  verifyToken,
};
