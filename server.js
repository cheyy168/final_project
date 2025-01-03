var express = require("express");
var ejs = require("ejs");
var mysql = require("mysql");
var session = require("express-session");

mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "phone_shop",
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
const paypal = require("@paypal/checkout-server-sdk");

// Configure PayPal environment with your client ID and secret
function environment() {
  return new paypal.core.SandboxEnvironment(
    "YOUR_CLIENT_ID", // Replace with your PayPal sandbox client ID
    "YOUR_CLIENT_SECRET" // Replace with your PayPal sandbox client secret
  );
}

const client = new paypal.core.PayPalHttpClient(environment());

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
  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "phone_shop",
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
  if (increase_btn) {
    for (let i = 0; i < cart.length; i++) {
      if (cart[i].id == id) {
        if (cart[i].quantity > 0) {
          cart[i].quantity = parseInt(cart[i].quantity) + 1;
        }
      }
    }
  }
  if (decrease_btn) {
    for (let i = 0; i < cart.length; i++) {
      if (cart[i].id == id) {
        if (cart[i].quantity > 1) {
          cart[i].quantity = parseInt(cart[i].quantity) - 1;
        }
      }
    }
  }
  calculateTotal(cart, req); // Recalculate the total
  res.redirect("/cart");
});

app.post("/place_order", function (req, res) {
  var name = req.body.name;
  var email = req.body.email;
  var phone = req.body.phone;
  var city = req.body.city;
  var address = req.body.address;
  var cost = req.session.total;
  var status = "not paid";
  var date = new Date();
  var products_ids = "";

  var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "phone_shop",
  });
  var cart = req.session.cart;
  for (let i = 0; i < cart.length; i++) {
    products_ids = products_ids + "," + cart[i].id;
  }
  con.connect((err) => {
    if (err) {
      console.log(err);
    } else {
      var query =
        "INSERT INTO orders (name, email, phone, city, address, cost, status, date,products_ids) VALUES ?";
      var values = [
        [name, email, phone, city, address, cost, status, date, products_ids],
      ];
      con.query(query, [values], (err, result) => {
        res.redirect("/payment");
      });
    }
  });
});
app.get("/payment", function (req, res) {
  res.render("pages/payment");
});
app.get("/checkout", function (req, res) {
  // Ensure cart exists in session
  const cart = req.session.cart || [];

  // Calculate total price for the cart
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Render the checkout page with cart and total
  res.render("pages/checkout", { cart: cart, total: total });
});
