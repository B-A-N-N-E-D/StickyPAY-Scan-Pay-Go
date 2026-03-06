import express from "express";
import { supabase } from "../config/supabase.js";

const router = express.Router();

// GET product by barcode
router.get("/:barcode", async (req, res) => {
  const { barcode } = req.params;

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("barcode", barcode)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: "Product not found" });
  }

  res.json(data);
});

export default router;