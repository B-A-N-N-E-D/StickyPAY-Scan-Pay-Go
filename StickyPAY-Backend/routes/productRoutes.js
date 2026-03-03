import express from "express";
import supabase from "../config/supabase.js";

const router = express.Router();

// Add product
router.post("/", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('products')
            .insert([req.body])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        res.status(400).json({ message: error.message || 'Error creating product' });
    }
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