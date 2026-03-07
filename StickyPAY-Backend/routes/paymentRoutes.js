import express from "express";
import { supabase } from "../config/supabase.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { order_id, user_id, store_id, amount } = req.body;

    const { data, error } = await supabase
      .from("payments")
      .insert({
        order_id,
        user_id,
        store_id,
        amount,
        payment_method: "UPI",
        status: "success"
      });

    if (error) throw error;

    res.json({
      message: "Payment successful"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Payment failed" });
  }
});

export default router;