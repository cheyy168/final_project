const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: "secret", resave: false, saveUninitialized: true }));

// Import routes
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

// Use routes
app.use("/", productRoutes);
app.use("/", cartRoutes);
app.use("/", orderRoutes);
app.use("/", paymentRoutes);

// Start the server
app.listen(8080, () => {
  console.log("Server is running on http://localhost:8080");
});
