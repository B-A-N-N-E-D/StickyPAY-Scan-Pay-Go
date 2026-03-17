import express from "express";
import { supabase } from "../config/supabase.js";

const router = express.Router();

router.get("/:qr", async (req, res) => {
  try {

    const { qr } = req.params;

    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("qr_code", qr)
      .single();

    // QR not found
    if (error || !order) {
      return res.json({
        valid: false,
        message: "Invalid receipt"
      });
    }

    // 🚨 Already used QR
    if (order.verified) {
      return res.json({
        valid: false,
        message: "Receipt already verified"
      });
    }

    // ✅ Mark order as verified
    await supabase
      .from("orders")
      .update({
        verified: true,
        verified_at: new Date().toISOString()
      })
      .eq("order_id", order.order_id);

    res.json({
      valid: true,
      order_id: order.order_id,
      total: order.total_amount,
      time: order.created_at
    });

  } catch (err) {
    res.status(500).json({ error: "Verification failed" });
  }
});

export default router;