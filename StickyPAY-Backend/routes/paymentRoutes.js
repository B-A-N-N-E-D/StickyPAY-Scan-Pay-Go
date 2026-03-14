import express from "express";
import { supabase } from "../config/supabase.js";

const router = express.Router();

// GET all payments for a user
router.get("/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    const { data: payments, error } = await supabase
      .from("payments")
      .select(`
        *,
        store:stores (*)
      `)
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ payments });
  } catch (err) {
    console.error("Payments fetch error:", err);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

// Confirm payment
router.post("/confirm", async (req, res) => {
  try {
    const { order_id, user_id, store_id, amount, payment_method = "UPI" } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: "order_id required" });
    }

    // 1. Insert payment record
    const { data: payment, error } = await supabase
      .from("payments")
      .insert({
        order_id,
        user_id,
        store_id,
        total_amount: amount,
        payment_method,
        status: "success"
      })
      .select()
      .single();

    if (error) throw error;

    // 2. Fetch order items to populate payment items
    const { data: orderItems, error: orderItemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order_id);

    // 3. Insert payment items
    if (!orderItemsError && orderItems && orderItems.length > 0) {
      const paymentItemsToInsert = orderItems.map(item => ({
        payment_id: payment.payment_id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: paymentItemsInsertError } = await supabase
        .from("payment_items")
        .insert(paymentItemsToInsert);

      if (paymentItemsInsertError) {
        console.warn("Failed to insert payment items:", paymentItemsInsertError);
      }
    }

    // 4. Update order status
    await supabase
      .from("orders")
      .update({ payment_status: "paid" }) // matched schema 'payment_status'
      .eq("order_id", order_id);

    res.json({
      message: "Payment successful",
      payment
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Payment failed" });
  }
});

export default router;