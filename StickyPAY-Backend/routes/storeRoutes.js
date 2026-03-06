import express from "express";
import { supabase } from "../config/supabase.js";

const router = express.Router();

// Get store by name
router.get("/:name", async (req, res) => {

  const storeName = decodeURIComponent(req.params.name);

  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("store_name", storeName)
    .single();

  if (error) {
    return res.status(404).json({
      message: "Store not found"
    });
  }

  res.json(data);
});

export default router;