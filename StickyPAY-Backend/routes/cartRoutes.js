import express from "express";
import { supabase } from "../config/supabase.js";

const router = express.Router();

// Add, update, or remove item from cart
router.post("/", async (req, res) => {
  try {
    const { user_id, product_id, quantity, action = "add" } = req.body;

    if (!user_id || !product_id) {
      return res.status(400).json({ error: "user_id and product_id are required" });
    }

    if (action === "remove" || Number(quantity) <= 0) {
      const { error } = await supabase
        .from("cart")
        .delete()
        .eq("user_id", user_id)
        .eq("product_id", product_id);

      if (error) throw error;

      return res.json({ message: "Item removed from cart" });
    }

    const payload = {
      user_id,
      product_id,
      quantity: Number(quantity) || 1,
    };

    const { data: existingItem, error: fetchError } = await supabase
      .from("cart")
      .select("*")
      .eq("user_id", user_id)
      .eq("product_id", product_id)
      .maybeSingle();

    if (fetchError) throw fetchError;

    let data;
    let error;

    if (existingItem) {
      ({ data, error } = await supabase
        .from("cart")
        .update({ quantity: payload.quantity })
        .eq("user_id", user_id)
        .eq("product_id", product_id)
        .select());
    } else {
      ({ data, error } = await supabase
        .from("cart")
        .insert([payload])
        .select());
    }

    if (error) throw error;

    const message = action === "update" || existingItem ? "Cart updated" : "Item added to cart";
    res.json({ message, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cart error", details: err.message });
  }
});

export default router;
