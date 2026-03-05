import express from "express";
import { supabase } from "../config/supabase.js";

const router = express.Router();

// Add product
router.get("/:barcode", async (req, res) => {
  const { barcode } = req.params;

  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      store_products (
        stock,
        store_id
      )
    `)
    .eq("barcode", barcode)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: "Product not found" });
  }

  res.json(data);
});

// Get product by barcode
router.get("/:barcode", async (req, res) => {
    try {
        const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('barcode', req.params.barcode)
            .single();

        // .single() throws if 0 rows found in pgrest
        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ message: "Product not found" });
            }
            throw error;
        }

        res.json(product);
    } catch (error) {
        res.status(400).json({ message: error.message || 'Error fetching product' });
    }
});

export default router;