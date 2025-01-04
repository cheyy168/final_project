const mysql = require("mysql");

exports.placeOrder = (req, res) => {
  const { email, phone, address } = req.body;
  const cost = req.session.total;
  const date = new Date();
  let products_ids = "";

  const cart = req.session.cart || [];
  if (cart.length === 0) {
    return res.status(400).send("Your cart is empty. Please add products before placing an order.");
  }

  for (let i = 0; i < cart.length; i++) {
    products_ids += "," + cart[i].id;
  }
  products_ids = products_ids.substring(1);

  const con = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
  });

  con.connect((err) => {
    if (err) return res.status(500).send("Error connecting to the database.");

    const query = "INSERT INTO clientOrders (email, phone, address, totalAmount, date) VALUES ?";
    const values = [[email, phone, address, cost, date]];

    con.query(query, [values], (err, result) => {
      if (err) return res.status(500).send("Error placing the order.");

      const orderId = result.insertId;
      const orderDetails = cart.map(item => [orderId, item.id, item.image, (item.sale_price || item.price) * item.quantity, item.quantity]);

      const queryDetails = "INSERT INTO clientOrderDetails (orderId, productId, image, total, quantity) VALUES ?";
      con.query(queryDetails, [orderDetails], (err) => {
        if (err) return res.status(500).send("Error inserting order details.");
        res.redirect("/payment");
      });
    });
  });
};

exports.checkout = (req, res) => {
  const cart = req.session.cart || [];
  const total = cart.reduce((sum, item) => sum + (item.sale_price || item.price) * item.quantity, 0);
  res.render("pages/checkout", { cart, total });
};

exports.orderConfirmation = (req, res) => {
  res.render("pages/order_confirmation");
};
