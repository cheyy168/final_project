const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

router.post("/payment_success", paymentController.paymentSuccess);
router.get("/payment", paymentController.paymentPage);
router.get("/payment_failed", paymentController.paymentFailed);

module.exports = router;
