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

router.post("/checkout", async (req, res) => {
  try {
    const { user_id, store_id } = req.body;

    // Get cart items with product info for pricing
    const { data: cartItems, error: cartError } = await supabase
      .from("cart")
      .select(`
          *,
          product:products (price)
      `)
      .eq("user_id", user_id)
      .eq("store_id", store_id);

    if (cartError) throw cartError;

    if (!cartItems || !cartItems.length) {
      return res.status(400).json({ message: "Cart is empty for this store" });
    }

    let totalAmount = 0;

    // Calculate Total and build order items array
    const orderItemsToInsert = cartItems.map((item) => {
      const itemTotal = item.product.price * item.quantity;
      totalAmount += itemTotal;
      return {
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.product.price,
      };
    });

    // 1. Create order
    const qrCode = crypto.randomUUID();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id,
        store_id,
        total_amount: totalAmount,
        status: "paid",
        qr_code: qrCode
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Insert order items
    const orderItemsWithOrderId = orderItemsToInsert.map(item => ({
      ...item,
      order_id: order.order_id
    }));

    const { error: insertOrderItemsError } = await supabase
      .from("order_items")
      .insert(orderItemsWithOrderId);

    // ✅ FIX — Throw the error so the entire checkout rolls back
    if (insertOrderItemsError) throw insertOrderItemsError;

    // 3. Deduct Inventory (from store_products)
    for (const item of cartItems) {
      // Step A: Fetch current stock value
      const { data: stockRow, error: stockFetchError } = await supabase
        .from("store_products")
        .select("stock")
        .eq("store_id", store_id)
        .eq("product_id", item.product_id)
        .single();

      if (stockFetchError) throw stockFetchError;

      if (!stockRow || stockRow.stock < item.quantity) {
        return res.status(400).json({
          error: "Insufficient stock for product"
        });
      }

      // Step B: Update to stock - quantity
      const { error: stockUpdateError } = await supabase
        .from("store_products")
        .update({ stock: stockRow.stock - item.quantity })
        .eq("store_id", store_id)
        .eq("product_id", item.product_id);

      if (stockUpdateError) throw stockUpdateError;
    }

    // 4. Clear cart for this store
    await supabase
      .from("cart")
      .delete()
      .eq("user_id", user_id)
      .eq("store_id", store_id);

    res.json({
      message: "Order created",
      order,
      qr_code: qrCode
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Checkout failed" });
  }
});

export default router;
