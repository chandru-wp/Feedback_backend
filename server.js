require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

console.log("✅ Prisma initialized successfully");

// ========== INITIALIZE DEFAULT ADMIN ==========
async function initializeDefaultAdmin() {
  try {
    const adminCount = await prisma.Admin.count();
    console.log(`📊 Admin count: ${adminCount}`);
    if (adminCount === 0) {
      await prisma.Admin.create({
        data: {
          username: "admin",
          password: "admin123", // In production, use bcrypt for hashing
        },
      });
      console.log("✅ Default admin created (username: admin, password: admin123)");
    } else {
      console.log("✅ Admin already exists");
    }
  } catch (error) {
    console.error("❌ Error initializing admin:", error);
  }
}

// ========== INITIALIZE DEFAULT USER ==========
async function initializeDefaultUser() {
  try {
    const userCount = await prisma.User.count();
    console.log(`📊 User count: ${userCount}`);
    if (userCount === 0) {
      await prisma.User.create({
        data: {
          username: "user",
          password: "user123",
          email: "user@example.com"
        },
      });
      console.log("✅ Default user created (username: user, password: user123)");
    } else {
      console.log("✅ Users already exist");
    }
  } catch (error) {
    console.error("❌ Error initializing user:", error);
  }
}

(async () => {
  await initializeDefaultAdmin();
  await initializeDefaultUser();
})();

// ========== ADMIN AUTHENTICATION ==========

// LOGIN
app.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await prisma.Admin.findUnique({
      where: { username },
    });

    if (!admin || admin.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      success: true,
      message: "Login successful",
      admin: { id: admin.id, username: admin.username }
    });
  } catch (error) {
    console.error("❌ Error during login:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET ALL ADMINS
app.get("/api/admin", async (req, res) => {
  try {
    const admins = await prisma.Admin.findMany({
      select: { id: true, username: true, createdAt: true },
    });
    res.json(admins);
  } catch (error) {
    console.error("❌ Error fetching admins:", error);
    res.status(500).json({ error: "Failed to fetch admins" });
  }
});

// CREATE ADMIN
app.post("/api/admin", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if username already exists
    const existing = await prisma.Admin.findUnique({ where: { username } });
    if (existing) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const admin = await prisma.Admin.create({
      data: { username, password },
    });

    res.status(201).json({
      id: admin.id,
      username: admin.username,
      createdAt: admin.createdAt
    });
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    res.status(500).json({ error: "Failed to create admin" });
  }
});

// UPDATE ADMIN PASSWORD
app.put("/api/admin/:id", async (req, res) => {
  try {
    const { username, password } = req.body;
    const updated = await prisma.Admin.update({
      where: { id: req.params.id },
      data: { username, password },
    });
    res.json({
      id: updated.id,
      username: updated.username
    });
  } catch (error) {
    console.error("❌ Error updating admin:", error);
    res.status(500).json({ error: "Failed to update admin" });
  }
});

// DELETE ADMIN
app.delete("/api/admin/:id", async (req, res) => {
  try {
    await prisma.Admin.delete({ where: { id: req.params.id } });
    res.json({ message: "Admin deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting admin:", error);
    res.status(500).json({ error: "Failed to delete admin" });
  }
});

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

// ========== FEEDBACK FORMS ENDPOINTS ==========

// GET ALL FORMS
app.get("/api/forms", async (req, res) => {
  try {
    const forms = await prisma.FeedbackForm.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(forms);
  } catch (error) {
    console.error("❌ Error fetching forms:", error);
    res.status(500).json({ error: "Failed to fetch forms" });
  }
});

// GET SINGLE FORM
app.get("/api/forms/:id", async (req, res) => {
  try {
    const form = await prisma.FeedbackForm.findUnique({
      where: { id: req.params.id },
    });
    if (!form) return res.status(404).json({ message: "Form not found" });
    res.json(form);
  } catch (error) {
    console.error("❌ Error fetching form:", error);
    res.status(500).json({ error: "Failed to fetch form" });
  }
});

// CREATE FORM
app.post("/api/forms", async (req, res) => {
  try {
    const { title, description, fields } = req.body;
    const form = await prisma.FeedbackForm.create({
      data: {
        title,
        description: description || "",
        fields: fields || []
      },
    });
    res.status(201).json(form);
  } catch (error) {
    console.error("❌ Error creating form:", error);
    res.status(500).json({ error: "Failed to create form" });
  }
});

// UPDATE FORM
app.put("/api/forms/:id", async (req, res) => {
  try {
    const { title, description, fields } = req.body;
    const updated = await prisma.FeedbackForm.update({
      where: { id: req.params.id },
      data: { title, description, fields: fields || [] },
    });
    res.json(updated);
  } catch (error) {
    console.error("❌ Error updating form:", error);
    res.status(500).json({ error: "Failed to update form" });
  }
});

// DELETE FORM
app.delete("/api/forms/:id", async (req, res) => {
  try {
    await prisma.FeedbackForm.delete({ where: { id: req.params.id } });
    res.json({ message: "Form deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting form:", error);
    res.status(500).json({ error: "Failed to delete form" });
  }
});

// ========== USER AUTHENTICATION ==========

// USER REGISTER
app.post("/api/user/register", async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // Check if username already exists
    const existing = await prisma.User.findUnique({ where: { username } });
    if (existing) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const user = await prisma.User.create({
      data: { username, password, email },
    });

    res.status(201).json({
      success: true,
      message: "Registration successful",
      user: { id: user.id, username: user.username }
    });
  } catch (error) {
    console.error("❌ Error registering user:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
});

// USER LOGIN
app.post("/api/user/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.User.findUnique({
      where: { username },
    });

    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      success: true,
      message: "Login successful",
      user: { id: user.id, username: user.username }
    });
  } catch (error) {
    console.error("❌ Error during user login:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET ALL USERS
app.get("/api/user", async (req, res) => {
  try {
    const users = await prisma.User.findMany({});
    
    // Map users to ensure createdAt is handled properly
    const sanitizedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt || null
    }));
    
    res.json(sanitizedUsers);
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// UPDATE USER
app.put("/api/user/:id", async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const updateData = {};
    
    if (username) updateData.username = username;
    if (password) updateData.password = password;
    if (email !== undefined) updateData.email = email;

    const updated = await prisma.User.update({
      where: { id: req.params.id },
      data: updateData,
      select: { id: true, username: true, email: true },
    });
    
    res.json(updated);
  } catch (error) {
    console.error("❌ Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// DELETE USER
app.delete("/api/user/:id", async (req, res) => {
  try {
    await prisma.User.delete({ where: { id: req.params.id } });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

app.get("/", (req, res) => res.send("🚀 FeedbackForm API running!"));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));