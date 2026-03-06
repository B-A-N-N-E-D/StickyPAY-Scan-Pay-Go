import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import scanRoutes from "./routes/scanRoutes.js";

dotenv.config();

const app = express();

// ── CORS ── Only allow your Vercel frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || "*"  // Set FRONTEND_URL in Render to your Vercel URL
}));

app.use(express.json());

// ── Routes
app.use("/api/profiles", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/scan", scanRoutes);
app.use("/api/users", userRoutes);

// ── Health check
app.get("/", (req, res) => {
  res.send("StickyPay Backend Running");
});

// ── Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});