const mysql = require("mysql");

exports.paymentSuccess = (req, res) => {
  const { orderId } = req.body;
  const paymentStatus = "paid";
  const paymentDate = new Date();

  const con = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
  });

  con.connect((err) => {
    if (err) return res.status(500).send("Error processing payment.");

    const query = "UPDATE orders SET status = ?, payment_date = ? WHERE id = ?";
    con.query(query, [paymentStatus, paymentDate, orderId], (err) => {
      if (err) return res.status(500).send("Error updating order status.");
      res.redirect("/order_confirmation");
    });
  });
};

exports.paymentPage = (req, res) => {
  const cart = req.session.cart || [];
  const total = req.session.total || 0;
  res.render("pages/payment", { cart, total });
};

exports.paymentFailed = (req, res) => {
  res.render("pages/payment_failed");
};
