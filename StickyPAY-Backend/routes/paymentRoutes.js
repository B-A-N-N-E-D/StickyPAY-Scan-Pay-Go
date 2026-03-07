import express from "express";
import { supabase } from "../config/supabase.js";

const router = express.Router();

// Confirm payment
router.post("/confirm", async (req, res) => {
  try {
    const { order_id, user_id, store_id, amount } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: "order_id required" });
    }

    // Insert payment record
    const { data, error } = await supabase
      .from("payments")
      .insert({
        order_id,
        user_id,
        store_id,
        amount,
        payment_method: "UPI",
        status: "success"
      })
      .select()
      .single();

    if (error) throw error;

    // Update order status
    await supabase
      .from("orders")
      .update({ status: "paid" })
      .eq("order_id", order_id);

    res.json({
      message: "Payment successful",
      payment: data
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Payment failed" });
  }
});

export default router;