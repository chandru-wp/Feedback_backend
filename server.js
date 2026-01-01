 require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

console.log("✅ Prisma initialized successfully");

// POST
app.post("/api/feedback", async (req, res) => {
  try {
    const feedback = await prisma.Feedback.create({
      data: { answers: req.body },
    });
    res.status(201).json(feedback);
  } catch (error) {
    console.error("❌ Error saving feedback:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET ALL
app.get("/api/feedback", async (req, res) => {
  try {
    const feedbacks = await prisma.Feedback.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch feedback" });
  }
});

// GET BY ID
app.get("/api/feedback/:id", async (req, res) => {
  try {
    const feedback = await prisma.Feedback.findUnique({
      where: { id: req.params.id },
    });
    if (!feedback) return res.status(404).json({ message: "Not found" });
    res.json(feedback);
  } catch {
    res.status(500).json({ error: "Failed to fetch feedback" });
  }
});

// UPDATE
app.put("/api/feedback/:id", async (req, res) => {
  try {
    const updated = await prisma.Feedback.update({
      where: { id: req.params.id },
      data: { answers: req.body },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Failed to update feedback" });
  }
});

// DELETE
app.delete("/api/feedback/:id", async (req, res) => {
  try {
    await prisma.Feedback.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted successfully" });
  } catch {
    res.status(500).json({ error: "Failed to delete feedback" });
  }
});

app.get("/", (req, res) => res.send("🚀 FeedbackForm API running!"));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));