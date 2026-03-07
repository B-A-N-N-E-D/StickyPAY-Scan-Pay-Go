import express from "express";
import { supabase } from "../config/supabase.js";

const router = express.Router();

// 🔍 Verify Store
router.post("/verify-store", async (req, res) => {
  try {
    const { store_id, user_id } = req.body;

    console.log("Received store_id:", store_id);

    if (!store_id) {
      return res.status(400).json({ error: "Store ID required" });
    }

    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .eq("store_id", store_id)
      .single();

    console.log("Supabase result:", data, error);

    if (error || !data) {
      return res.status(400).json({ error: "Invalid Store ID" });
    }

    if (user_id) {
      const { error: scanError } = await supabase
        .from("scan_history")
        .insert([
          {
            user_id,
            store_id: data.store_id,
            scanned_value: data.store_qr_code,
            scan_type: "STORE"
          }
        ]);

      if (scanError) {
        console.error("Scan insert failed:", scanError);
      }
    }

    return res.status(200).json({
      message: "Store Verified",
      store: data
    });

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
