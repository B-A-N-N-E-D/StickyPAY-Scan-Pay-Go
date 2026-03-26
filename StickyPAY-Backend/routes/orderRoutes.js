import express from "express";
import { supabase } from "../config/supabase.js";

const router = express.Router();


// ==========================
// GET ALL ORDERS
// ==========================
router.get("/:user_id", async (req, res) => {
  try {
    const { user_id } = req.params;

    console.log("🔥 FETCHING ORDERS FOR:", user_id);

    const { data: orders, error } = await supabase
      .from("orders")
      .select(`
        order_id,
        total_amount,
        created_at,
        store_name,
        transaction_id,
        payment_method,
        verified,
        payment:payments (
          payment_method,
          status
        ),
        order_items (
          quantity,
          price,
          product:products ( name )
        )
      `)
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ SUPABASE ERROR:", error);
      return res.status(500).json({
        message: error.message,
        details: error.details,
        hint: error.hint
      });
    }

    // ✅ ENSURE created_at always exists
    const safeOrders = (orders || []).map(order => ({
      ...order,
      created_at: order.created_at || new Date().toISOString()
    }));

    res.json({ orders: safeOrders });

  } catch (err) {
    console.error("Orders fetch error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});


// ==========================
// CHECKOUT
// ==========================
router.post("/checkout", async (req, res) => {
  try {
    const { user_id, store_id, items, payment_method = "UPI", store_name = "Store" } = req.body;

    if (!user_id || !store_id) {
      return res.status(400).json({ message: "user_id and store_id are required" });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items in cart" });
    }

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

    const transaction_id = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const qrCode = transaction_id;

    console.log("🔥 INSERTING ORDER:", {
      user_id,
      store_id,
      totalAmount,
      payment_method
    });

    // ==========================
    // CREATE ORDER
    // ==========================
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          user_id,
          store_id,
          total_amount: totalAmount,
          payment_status: "paid",
          payment_method,
          qr_code: qrCode,
          transaction_id,
          verified: false,
          store_name: store_name,
          created_at: new Date().toISOString() // ✅ FORCE DATE
        },
      ])
      .select()
      .single();

    if (orderError) {
      console.error("❌ INSERT ERROR:", orderError);
      return res.status(500).json({
        error: "Insert failed",
        detail: orderError.message
      });
    }

    if (!order) {
      return res.status(500).json({
        error: "Order creation failed"
      });
    }

    // ==========================
    // INSERT ITEMS
    // ==========================
    const validItems = orderItemsToInsert.map(item => ({
      ...item,
      order_id: order.order_id
    }));

    if (validItems.length > 0) {
      const { error } = await supabase
        .from("order_items")
        .insert(validItems);

      if (error) {
        console.error("❌ ITEMS INSERT ERROR:", error);
      }
    }

    // ==========================
    // RETURN SAFE ORDER
    // ==========================
    const safeOrder = {
      ...order,
      created_at: order.created_at || new Date().toISOString()
    };

    res.json({
      message: "Order created",
      order: safeOrder,
      qr_code: qrCode,
    });

  } catch (err) {
    console.error("🔥 FULL CHECKOUT ERROR:", err);
    res.status(500).json({
      error: "Checkout failed",
      detail: err?.message || err,
    });
  }
});

export default router;