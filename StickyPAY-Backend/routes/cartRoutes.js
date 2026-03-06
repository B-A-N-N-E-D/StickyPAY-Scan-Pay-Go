import express from "express";
import { supabase } from "../config/supabase.js";

const router = express.Router();

// Add item to cart
router.post("/", async (req, res) => {
  try {
    const { user_id, product_id, quantity } = req.body;

    const { data, error } = await supabase
      .from("cart")
      .insert([{ user_id, product_id, quantity }]);

    if (error) throw error;

    res.json({ message: "Item added to cart", data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cart error" });
  }
});

export default router;