var express = require("express");
var ejs = require("ejs");
var mysql = require("mysql");
var session = require("express-session");
var dotenv = require('dotenv')
dotenv.config();
var con = mysql.createConnection({
  host:process.env.HOST,
  user:process.env.USER,
  password:process.env.PASSWORD,
  database:process.env.DATABASE,
}); // Recommended to use pool

var bodyParser = require("body-parser");
var app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.listen(8080);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: "secret" }));
console.log("Server is running on http://localhost:8080");
function isProductInCart(cart, id) {
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].id == id) {
      return true;
    }
  }
  return false;
}


function calculateTotal(cart, req) {
  if (!cart || !Array.isArray(cart)) {
    cart = []; // Ensure cart is always an array
  }

  let total = 0;
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].sale_price) {
      total += cart[i].sale_price * cart[i].quantity;
    } else {
      total += cart[i].price * cart[i].quantity;
    }
  }

  req.session.total = total; // Store the total in the session
  return total;
}

app.get("/", function (req, res) {
  var con =  mysql.createConnection({
    host:process.env.HOST,
    user:process.env.USER,
    password:process.env.PASSWORD,
    database:process.env.DATABASE,
  });

  con.query("SELECT * FROM products", (err, result) => {
    res.render("pages/index", { result: result });
  });
});

app.post("/add_to_cart", function (req, res) {
  var id = req.body.id;
  var name = req.body.name;
  var price = req.body.price;
  var sale_price = req.body.sale_price;
  var quantity = req.body.quantity;
  var image = req.body.image;

  var product = {
    id: id,
    name: name,
    price: price,
    sale_price: sale_price,
    quantity: quantity,
    image: image,
  };

  // Ensure the cart exists
  if (!req.session.cart) {
    req.session.cart = [];
  }

  var cart = req.session.cart;

  if (!isProductInCart(cart, id)) {
    cart.push(product); // Add product to cart
  } else {
    // Update product quantity if it already exists in cart
    for (let i = 0; i < cart.length; i++) {
      if (cart[i].id == id) {
        cart[i].quantity += quantity;
      }
    }
  }

  calculateTotal(cart, req); // Recalculate the total
  res.redirect("/cart");
});

app.get("/cart", function (req, res) {
  var cart = req.session.cart || []; // Ensure cart is always an array
  var total = req.session.total || 0; // Ensure total is defined
  res.render("pages/cart", { cart: cart, total: total });
});

app.post("/remove_product", function (req, res) {
  var id = req.body.id;
  var cart = req.session.cart;

  for (let i = 0; i < cart.length; i++) {
    if (cart[i].id == id) {
      cart.splice(i, 1); // Remove product from cart
      break;
    }
  }

  calculateTotal(cart, req); // Recalculate the total
  res.redirect("/cart");
});
app.post("/edit_product_quantity", function (req, res) {
  var id = req.body.id;
  var quantity = req.body.quantity;
  var increase = req.body.increase;
  var decrease = req.body.decrease;
  var cart = req.session.cart;

  if (increase) {
    for (let i = 0; i < cart.length; i++) {
      if (cart[i].id == id) {
        cart[i].quantity++; // Increase quantity
      }
    }
  } else if (decrease) {
    for (let i = 0; i < cart.length; i++) {
      if (cart[i].id == id && cart[i].quantity > 1) {
        cart[i].quantity--; // Decrease quantity
      }
    }
  } else {
    // If just the quantity was updated without increase/decrease
    for (let i = 0; i < cart.length; i++) {
      if (cart[i].id == id) {
        cart[i].quantity = quantity; // Update to new quantity
      }
    }
  }

  calculateTotal(cart, req); // Recalculate the total
  res.send({ status: 'success' }); // Send success response
});


app.post("/place_order", function (req, res) {
  
  var email = req.body.email;
  var phone = req.body.phone;
 
  var address = req.body.address;
  var cost = req.session.total;
 
  var date = new Date();
  var products_ids = "";

  var cart = req.session.cart || [];  // Ensure cart is an empty array if undefined

  if (cart.length === 0) {
      return res.status(400).send("Your cart is empty. Please add products before placing an order.");
  }

  // Loop through the cart to collect product IDs
  for (let i = 0; i < cart.length; i++) {
      products_ids += "," + cart[i].id;
  }

  // Remove leading comma
  products_ids = products_ids.substring(1);

  var con = mysql.createConnection({
      host: process.env.HOST,
      user: process.env.USER,
      password: process.env.PASSWORD,
      database: process.env.DATABASE,
  });

  con.connect((err) => {
      if (err) {
          console.log(err);
          res.status(500).send("Error connecting to the database.");
          return;
      }

      var query =
          "INSERT INTO clientOrders ( email, phone, address, totalAmount, date) VALUES ?";
      var values = [
          [ email, phone,address, cost, date],
      ];

      con.query(query, [values], (err, result) => {
          if (err) {
              console.error("Error executing order query:", err);
              res.status(500).send("Error placing the order.");
              return;
          }

          // Insert order details into clientOrderDetails table
          var orderId = result.insertId;  // Get the last inserted order ID
          var orderDetails = [];

          for (let i = 0; i < cart.length; i++) {
              orderDetails.push([
                  orderId, 
                  cart[i].id, 
                  cart[i].image, 
                  (cart[i].sale_price || cart[i].price) * cart[i].quantity, 
                  cart[i].quantity
              ]);
          }

          var queryDetails = 
              "INSERT INTO clientOrderDetails (orderId, productId, image, total, quantity) VALUES ?";

          con.query(queryDetails, [orderDetails], (err, result) => {
              if (err) {
                  console.error("Error inserting order details:", err);
                  res.status(500).send("Error inserting order details.");
                  return;
              }
              res.redirect("/payment");  // Redirect to payment page
          });
      });
  });
});



app.get("/checkout", function (req, res) {
  // Ensure cart exists in session
  const cart = req.session.cart || [];

  // Calculate total price for the cart
  const total = cart.reduce((sum, item) => {
    return sum + (item.sale_price || item.price) * item.quantity;
  }, 0);

  // Render the checkout page with cart and total
  res.render("pages/checkout", { cart: cart, total: total });
});

// Route to clear the cart and redirect to home
app.post('/reset_cart', (req, res) => {
  req.session.cart = [];  // Clear the cart in session
  res.redirect('/');  // Redirect to home page
});
app.post("/payment_success", function (req, res) {
  const orderId = req.body.orderId;  // The order ID from the session or frontend
  const paymentStatus = 'paid'; // Update status to 'paid'
  const paymentDate = new Date(); // Current date as payment date

  // Update order status in the database
  var con = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
  });

  con.connect((err) => {
    if (err) {
      console.log(err);
      res.status(500).send("Error processing payment");
    } else {
      var query = "UPDATE orders SET status = ?, payment_date = ? WHERE id = ?";
      con.query(query, [paymentStatus, paymentDate, orderId], (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send("Error updating order status");
        } else {
          // After updating the order, redirect to the confirmation page
          res.redirect("/order_confirmation");
        }
      });
    }
  });
});
app.get("/order_confirmation", function (req, res) {
  
  res.render("pages/order_confirmation");
});
app.get('/payment', (req, res) => {
  // Assuming cart is stored in session
  const cart = req.session.cart || [];
  const total = req.session.total || 0;

  res.render('pages/payment', {
      cart: cart,
      total: total
  });
});
app.get('/payment_failed', function (req, res) {
    res.render('pages/payment_failed');
});

