const express = require("express");
const cartController = require("../controllers/cartController");
const { authenticate } = require("../middleware/authentication");

const router = express.Router();

router.use(authenticate);

router.get("/", cartController.getCart);
router.post("/add", cartController.addToCart);
router.put("/update/:itemId", cartController.updateCartItem);
router.delete("/remove/:itemId", cartController.removeCartItem);
router.delete("/clear", cartController.clearCart);

module.exports = router;

