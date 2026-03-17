import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import scanRoutes from "./routes/scanRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import storeRoutes from "./routes/storeRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

dotenv.config();

const app = express();

// ── CORS ── Only allow your Vercel frontend
// ── CORS ── Allow localhost + production
const allowedOrigins = [
  "http://localhost:5173",
  "https://stickypay-plum.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(express.json());

// ── Routes
app.use("/api/profiles", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/scan", scanRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);

// ── Health check
app.get("/", (req, res) => {
  res.send("StickyPay Backend Running");
});

// ── /api/health — used by frontend to warm up Render on load
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", ts: Date.now() });
});

// ── Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});