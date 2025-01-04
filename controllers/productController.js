const mysql = require("mysql");

exports.listProducts = (req, res) => {
  const con = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
  });

  con.query("SELECT * FROM products", (err, result) => {
    if (err) return res.status(500).send("Error retrieving products.");
    res.render("pages/index", { result });
  });
};
