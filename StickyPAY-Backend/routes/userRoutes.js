import express from "express";
import { supabase } from "../config/supabase.js";
import crypto from "crypto";

const router = express.Router();

// Debug endpoint — verify env vars are loaded (safe: no secrets exposed)
router.get("/debug-env", (req, res) => {
    res.json({
        SUPABASE_URL_set: !!process.env.SUPABASE_URL,
        SUPABASE_KEY_set: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        SUPABASE_URL_prefix: process.env.SUPABASE_URL?.slice(0, 30) || "NOT SET",
        KEY_prefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10) || "NOT SET",
    });
});

// Get User Profile
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { data: user, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ user });
    } catch (err) {
        console.error("Profile Fetch Error:", err);
        res.status(500).json({ message: "Internal Server Error", detail: err?.message });
    }
});

// Login / Register endpoint
router.post("/login", async (req, res) => {
    try {
        const { full_name, phone, email, address } = req.body;

        if (!phone) {
            return res.status(400).json({ message: "Phone number is required." });
        }

        // Check if user exists by phone
        const { data: existingUser, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('phone', phone)
            .maybeSingle();

        if (fetchError) {
            console.error("Fetch DB Error:", fetchError);
            return res.status(500).json({
                message: "Database error while looking up user",
                detail: fetchError.message,
                hint: fetchError.hint || null,
                code: fetchError.code || null,
            });
        }

        if (existingUser) {
            return res.status(200).json({
                message: "Welcome back!",
                user: existingUser
            });
        }

        // New user, insert data
        const newUser = {
            id: crypto.randomUUID(),
            full_name,
            phone,
            email: email || null,
            address: address || null,
        };

        const { data: insertedUser, error: insertError } = await supabase
            .from('profiles')
            .insert([newUser])
            .select()
            .single();

        if (insertError) {
            console.error("Insert DB Error:", insertError);
            return res.status(500).json({
                message: "Database error while creating user",
                detail: insertError.message,
                hint: insertError.hint || null,
                code: insertError.code || null,
            });
        }

        res.status(201).json({
            message: "Account created successfully!",
            user: insertedUser
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Internal Server Error", detail: error?.message });
    }
});

export default router;
