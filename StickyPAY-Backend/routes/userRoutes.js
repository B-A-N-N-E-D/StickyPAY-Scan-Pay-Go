import express from "express";
import { supabase } from "../config/supabase.js";

const router = express.Router();

// Login / Register endpoint
router.post("/login", async (req, res) => {
    try {
        const { full_name, phone, email, address } = req.body;

        if (!phone) {
            return res.status(400).json({ message: "Phone number is required." });
        }

        // Check if user exists by phone
        const { data: existingUser, error: fetchError } = await supabase
            .from('users')
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
            full_name,
            phone,
            email: email || null,
            address: address || null
        };

        const { data: insertedUser, error: insertError } = await supabase
            .from('users')
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
