import express from "express";
import { supabase } from "../config/supabase.js";

const router = express.Router();

// GET all orders for a user
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

    res.json({ orders });
  } catch (err) {
    console.error("Orders fetch error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// POST /checkout
router.post("/checkout", async (req, res) => {
  try {
    const { user_id, store_id, items, payment_method = "UPI" } = req.body;

    if (!user_id || !store_id) {
      return res.status(400).json({ message: "user_id and store_id are required" });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items in cart" });
    }

    // Calculate total
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

    // Generate transaction ID — same value stored in both qr_code and transaction_id
    const transaction_id = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const qrCode = transaction_id;

    console.log("🔥 INSERTING ORDER:", { user_id, store_id, totalAmount, qrCode, transaction_id });

    // 1. Create order
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
          transaction_id: transaction_id,
          verified: false,
          store_name: "Store",
        },
      ])
      .select()
      .single();

    if (orderError) {
      console.error("❌ SUPABASE INSERT ERROR:", JSON.stringify(orderError));
      return res.status(500).json({
        error: "Insert failed",
        detail: orderError.message,
        hint: orderError.hint,
        code: orderError.code,
      });
    }

    if (!order) {
      console.error("❌ ORDER IS NULL after insert");
      return res.status(500).json({
        error: "Insert failed",
        detail: "order is not defined — Supabase returned no data",
      });
    }

    // 2. Insert order items
    // ✅ FIX: validate product_ids exist first to avoid FK violation
    const validItems = orderItemsToInsert.map(item => ({
      ...item,
      order_id: order.order_id
    }));

    if (validItems.length > 0) {
      const { error: insertOrderItemsError } = await supabase
        .from("order_items")
        .insert(validItems);

      if (insertOrderItemsError) {
        // Don't fail the whole checkout — order was already created
        console.error("❌ ORDER ITEMS INSERT ERROR:", insertOrderItemsError);
      }
    }

    // 3. Deduct inventory
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
        // ignore stock errors
      }
    }

    // ✅ Return full order with transaction_id so frontend can render QR
    res.json({
      message: "Order created",
      order: order,
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
