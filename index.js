const dotenv = require("dotenv");
const express = require("express");
const connectDB = require("./config/db");
const morgan = require("morgan");
const cors = require("cors");
const userRoute = require("./routes/user");
const formRoute = require("./routes/form");
const app = express();
dotenv.config();
connectDB();

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

//routes
app.use("/api/v1/auth", userRoute);
app.use("/api/v1/form", formRoute);

PORT = 8080;
app.listen(8080, (req, res) => {
  console.log(`Server is running on port ${PORT}`);
});
