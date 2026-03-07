import express from "express";
import { supabase } from "../config/supabase.js";

const router = express.Router();

router.post("/checkout", async (req, res) => {
  try {
    const { user_id, store_id } = req.body;

    // Get cart items
    const { data: cartItems, error: cartError } = await supabase
      .from("cart")
      .select("*")
      .eq("user_id", user_id);

    if (cartError) throw cartError;

    if (!cartItems.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    let totalAmount = 0;
    // Calculate Total
    for (const item of cartItems) {
      const { data: product } = await supabase
        .from("products")
        .select("*")
        .eq("product_id", item.product_id)
        .single();

      const newQuantity = product.quantity - item.quantity;

      await supabase
        .from("products")
        .update({ quantity: newQuantity })
        .eq("product_id", item.product_id);
      totalAmount += product.price * item.quantity;

      await supabase
        .from("cart")
        .delete()
        .eq("user_id", user_id); 
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id,
        store_id,
        total_amount: totalAmount,
        status: "pending"
      })
      .select()
      .single();

    if (orderError) throw orderError;

    res.json({
      message: "Order created",
      order
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Checkout failed" });
  }
});

export default router;