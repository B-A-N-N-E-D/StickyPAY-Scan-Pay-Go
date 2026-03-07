import express from "express";
import { supabase } from "../config/supabase.js";

const router = express.Router();

const normalizeProduct = (product) => ({
  ...product,
  id: product.product_id ?? product.id ?? product.barcode,
  name: product.product_name ?? product.name ?? "Unknown Product",
  brand: product.brand ?? product.company ?? "",
  category: product.category ?? product.type ?? "",
  store_id: product.store_id ?? product.storeId ?? null,
});

// GET product by barcode
router.get("/:barcode", async (req, res) => {
  try {
    const { barcode } = req.params;

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("barcode", barcode)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(normalizeProduct(data));
  } catch (err) {
    console.error("Product fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
