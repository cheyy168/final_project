const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");

router.post("/add_to_cart", cartController.addToCart);
router.get("/cart", cartController.viewCart);
router.post("/remove_product", cartController.removeProduct);
router.post("/edit_product_quantity", cartController.editProductQuantity);
router.post("/reset_cart", cartController.resetCart);

module.exports = router;
