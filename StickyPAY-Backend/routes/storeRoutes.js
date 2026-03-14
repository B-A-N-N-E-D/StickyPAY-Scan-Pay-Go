import express from "express";
import { supabase } from "../config/supabase.js";

const router = express.Router();

const normalizeStore = (store) => ({
  ...store,
  id: store.store_id ?? store.id ?? null,
  name: store.store_name ?? store.name ?? null,
});

const normalizeLookupValue = (value = "") =>
  value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();

// Get all stores
router.get("/", async (req, res) => {
  try {
    const { data: stores, error } = await supabase
      .from("stores")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(stores.map(normalizeStore));
  } catch (err) {
    console.error("Stores fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get store using store_name from QR
router.get("/:storeName", async (req, res) => {
  try {
    const rawStoreName = decodeURIComponent(req.params.storeName || "").trim();
    const normalizedLookup = normalizeLookupValue(rawStoreName);

    if (!rawStoreName) {
      return res.status(400).json({ message: "Store name is required" });
    }

    const { data: stores, error } = await supabase
      .from("stores")
      .select("*");

    if (error) {
      throw error;
    }

    const matchedStore = (stores || []).find((store) => {
      const candidateValues = [
        store.store_name,
        store.store_qr_code,
        store.name,
        store.store_id,
        store.id,
      ].filter(Boolean);

      return candidateValues.some((candidate) => {
        const normalizedCandidate = normalizeLookupValue(String(candidate));
        return (
          normalizedCandidate === normalizedLookup ||
          normalizedCandidate.includes(normalizedLookup) ||
          normalizedLookup.includes(normalizedCandidate)
        );
      });
    });

    if (!matchedStore) {
      return res.status(404).json({ message: "Store not found" });
    }

    res.json(normalizeStore(matchedStore));

  } catch (err) {
    console.error("Store fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
