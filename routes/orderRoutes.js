const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

router.post("/place_order", orderController.placeOrder);
router.get("/checkout", orderController.checkout);
router.get("/order_confirmation", orderController.orderConfirmation);

module.exports = router;
