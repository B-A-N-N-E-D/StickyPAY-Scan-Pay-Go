import express from "express";
import { supabase } from "../config/supabase.js";

const router = express.Router();

// GET cart items for a user
router.get("/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    const { data: cartItems, error } = await supabase
      .from("cart")
      .select(`
        *,
        product:products (*),
        store:stores (*)
      `)
      .eq("user_id", user_id);

    if (error) {
      console.error("❌ SUPABASE ERROR:", error);
      return res.status(500).json({
        message: error.message,
        details: error.details,
        hint: error.hint
      });
}

    res.json({ cartItems });
  } catch (err) {
    console.error("Cart fetch error:", err);
    res.status(500).json({ error: "Failed to fetch cart items" });
  }
});

// Add, update, or remove item from cart
router.post("/", async (req, res) => {
  try {
    const { user_id, product_id, store_id, quantity, action = "add" } = req.body;

    if (!user_id || !product_id) {
      return res.status(400).json({ error: "user_id and product_id are required" });
    }

    if (action === "remove" || Number(quantity) <= 0) {
      const { error } = await supabase
        .from("cart")
        .delete()
        .eq("user_id", user_id)
        .eq("product_id", product_id)
        .eq("store_id", store_id);

      if (error) {
        console.error("❌ SUPABASE ERROR:", error);
        return res.status(500).json({
          message: error.message,
          details: error.details,
          hint: error.hint
        });
      }

      return res.json({ message: "Item removed from cart" });
    }

    const payload = {
      user_id,
      product_id,
      store_id,
      quantity: Number(quantity) || 1,
    };

    const { data: existingItem, error: fetchError } = await supabase
      .from("cart")
      .select("*")
      .eq("user_id", user_id)
      .eq("product_id", product_id)
      .eq("store_id", store_id)
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
        .eq("store_id", store_id)
        .select());
    } else {
      ({ data, error } = await supabase
        .from("cart")
        .insert([payload])
        .select());
    }

    if (error) {
      console.error("❌ SUPABASE ERROR:", error);
      return res.status(500).json({
        message: error.message,
        details: error.details,
        hint: error.hint
      });
}

    const message = action === "update" || existingItem ? "Cart updated" : "Item added to cart";
    res.json({ message, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Cart error", details: err.message });
  }
});

export default router;
