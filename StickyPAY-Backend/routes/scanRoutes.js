import express from "express";
import supabase from "../config/supabase.js";

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('scans')
            .insert([req.body])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        res.status(400).json({ message: error.message || 'Error creating scan record' });
    }
});

export default router;