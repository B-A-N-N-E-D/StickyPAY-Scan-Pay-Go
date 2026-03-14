import express from "express";
import { supabase } from "../config/supabase.js";
import crypto from "crypto";

const router = express.Router();

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

        res.json({
            user
        });
    } catch (err) {
        console.error("Profile Fetch Error:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// Login / Register endpoint
router.post("/login", async (req, res) => {
    try {
        const { full_name, phone } = req.body;

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
            throw fetchError;
        }

        if (existingUser) {
            // User exists, return their data
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
        };

        const { data: insertedUser, error: insertError } = await supabase
            .from('profiles')
            .insert([newUser])
            .select()
            .single();

        if (insertError) {
            console.error("Insert DB Error:", insertError);
            throw insertError;
        }

        res.status(201).json({
            message: "Account created successfully!",
            user: insertedUser
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

export default router;
