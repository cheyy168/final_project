const { isProductInCart, calculateTotal } = require("../utils/cartUtils");

exports.addToCart = (req, res) => {
  const { id, name, price, sale_price, quantity, image } = req.body;
  const product = { id, name, price, sale_price, quantity, image };

  req.session.cart = req.session.cart || [];
  const cart = req.session.cart;

  if (!isProductInCart(cart, id)) {
    cart.push(product);
  } else {
    for (let i = 0; i < cart.length; i++) {
      if (cart[i].id == id) {
        cart[i].quantity += quantity;
      }
    }
  }

  calculateTotal(cart, req);
  res.redirect("/cart");
};

exports.viewCart = (req, res) => {
  const cart = req.session.cart || [];
  const total = req.session.total || 0;
  res.render("pages/cart", { cart, total });
};

exports.removeProduct = (req, res) => {
  const id = req.body.id;
  const cart = req.session.cart;

  for (let i = 0; i < cart.length; i++) {
    if (cart[i].id == id) {
      cart.splice(i, 1);
      break;
    }
  }

  calculateTotal(cart, req);
  res.redirect("/cart");
};

exports.editProductQuantity = (req, res) => {
  const { id, quantity, increase, decrease } = req.body;
  const cart = req.session.cart;

  if (increase) {
    for (let i = 0; i < cart.length; i++) {
      if (cart[i].id == id) cart[i].quantity++;
    }
  } else if (decrease) {
    for (let i = 0; i < cart.length; i++) {
      if (cart[i].id == id && cart[i].quantity > 1) cart[i].quantity--;
    }
  } else {
    for (let i = 0; i < cart.length; i++) {
      if (cart[i].id == id) cart[i].quantity = quantity;
    }
  }

  calculateTotal(cart, req);
  res.send({ status: "success" });
};

exports.resetCart = (req, res) => {
  req.session.cart = [];
  res.redirect("/");
};
