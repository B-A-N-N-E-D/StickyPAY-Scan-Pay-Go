import express from "express";
import { supabase } from "../config/supabase.js";

const router = express.Router();

// Get store using store_name from QR
router.get("/:storeName", async (req, res) => {
  try {
    const storeName = decodeURIComponent(req.params.storeName);

    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .eq("store_name", storeName)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: "Store not found" });
    }

    res.json(data);

  } catch (err) {
    console.error("Store fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;