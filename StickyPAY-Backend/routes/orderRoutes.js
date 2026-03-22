import express from "express";
import { supabase } from "../config/supabase.js";
import crypto from 'crypto';

const router = express.Router();

// GET all orders for a user
router.get("/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    const { data: orders, error } = await supabase
      .from("orders")
      .select(`
        *,
        store:stores (*),
        order_items (
            *,
            product:products (*)
        )
      `)
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ orders });
  } catch (err) {
    console.error("Orders fetch error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// POST /checkout
// Accepts items directly from the frontend (cart is localStorage-based,
// so we never read from a Supabase cart table here)
router.post("/checkout", async (req, res) => {
  try {
    const { user_id, store_id, items } = req.body;

    // items: [{ product_id, quantity, price }]
    if (!user_id || !store_id) {
      return res.status(400).json({ message: "user_id and store_id are required" });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items in cart" });
    }

    // Calculate total from frontend-provided items
    let totalAmount = 0;
    const orderItemsToInsert = items.map((item) => {
      const itemTotal = item.price * item.quantity;
      totalAmount += itemTotal;
      return {
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      };
    });

    // 1. Create order
    const transaction_id = `TXN-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    const qrCode = transaction_id;

    console.log("🔥 INSERTING ORDER:", {
      user_id,
      store_id,
      totalAmount,
      qrCode,
      transaction_id
    });

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          user_id,
          store_id,
          total_amount: totalAmount,
          payment_status: "paid",
          qr_code: qrCode,
          transaction_id: transaction_id,
          verified: false,
          store_name: "Store" // ✅ ADD THIS
        }
      ])
      .select()
      .single();

    if (orderError) {
      console.error("❌ SUPABASE ERROR:", orderError);
      return res.status(500).json({
        error: "Insert failed",
        detail: orderError.message
      });
    }

    // 2. Insert order items
    const orderItemsWithOrderId = orderItemsToInsert.map(item => ({
      ...item,
      order_id: order.order_id
    }));

    const { error: insertOrderItemsError } = await supabase
      .from("order_items")
      .insert(orderItemsWithOrderId);

    if (insertOrderItemsError) throw insertOrderItemsError;

    // 3. Deduct inventory from store_products
    for (const item of items) {
      try {
        const { data: stockRow } = await supabase
          .from("store_products")
          .select("stock")
          .eq("store_id", store_id)
          .eq("product_id", item.product_id)
          .single();

        if (stockRow && stockRow.stock >= item.quantity) {
          await supabase
            .from("store_products")
            .update({ stock: stockRow.stock - item.quantity })
            .eq("store_id", store_id)
            .eq("product_id", item.product_id);
        }
      } catch (_) {
        // ignore
      }
    }

    res.json({
      message: "Order created",
      order,
      qr_code: qrCode
    });

  } catch (err) {
      console.error("🔥 FULL CHECKOUT ERROR:", err);
      res.status(500).json({
        error: "Checkout failed",
        detail: err?.message || err
      });
    }
});

export default router;
