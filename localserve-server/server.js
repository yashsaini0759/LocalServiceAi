require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_localserve_jwt_key_123";

// Middleware to protect routes
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid token" });
  }
};

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password, location, role } = req.body;
    
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        location,
        role,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`
      }
    });

    // If provider, create an empty profile
    if (role === 'provider') {
      await prisma.providerProfile.create({
        data: {
          userId: user.id,
          service: "Specific Service Name",
          serviceIcon: "handyman",
        }
      });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    // Don't send password back
    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser, token });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;
    
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrPhone },
          { phone: emailOrPhone }
        ]
      }
    });

    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser, token });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Get Current User
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });
    if (!user) return res.status(404).json({ error: "User not found" });

    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});


// ==========================================
// PROVIDER ROUTES
// ==========================================

// Get all providers (for Search and Home Page)
app.get('/api/providers', async (req, res) => {
  try {
    const providers = await prisma.providerProfile.findMany({
      include: {
        user: { select: { name: true, avatar: true } },
        reviews: { select: { rating: true } },
        servicesOffered: true,
      }
    });

    // Format to match frontend structure
    const formatted = providers.map(p => {
      const avgRating = p.reviews.length 
        ? (p.reviews.reduce((a, b) => a + b.rating, 0) / p.reviews.length).toFixed(1)
        : 5.0; // Default if no reviews
      
      return {
        id: p.id,
        userId: p.userId,
        name: p.user.name,
        avatar: p.user.avatar,
        service: p.service,
        serviceIcon: p.serviceIcon,
        description: p.description,
        experience: p.experience,
        price: p.basePrice,
        distance: p.distance,
        available: p.available,
        verified: p.verified,
        tags: JSON.parse(p.tags || "[]"),
        rating: Number(avgRating),
        reviews: p.reviews.length,
        servicesOffered: p.servicesOffered
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch providers" });
  }
});

// Update Provider Profile (Dashboard feature)
app.put('/api/providers/profile', authMiddleware, async (req, res) => {
  if (req.user.role !== 'provider') return res.status(403).json({ error: "Only providers can update profiles" });

  try {
    const { service, description, experience, basePrice, available, tags } = req.body;
    
    // Find profile using the authenticated user's ID
    let profile = await prisma.providerProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ error: "Provider profile not found" });

    // Update profile
    const updated = await prisma.providerProfile.update({
      where: { userId: req.user.id },
      data: {
        service: service || profile.service,
        description: description || profile.description,
        experience: experience || profile.experience,
        basePrice: basePrice !== undefined ? Number(basePrice) : profile.basePrice,
        available: available !== undefined ? available : profile.available,
        tags: tags ? JSON.stringify(tags) : profile.tags
      }
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Get Provider Services
app.get('/api/providers/services', authMiddleware, async (req, res) => {
  if (req.user.role !== 'provider') return res.status(403).json({ error: "Only providers can view their services" });
  try {
    const profile = await prisma.providerProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.json([]);
    const services = await prisma.providerService.findMany({ where: { providerProfileId: profile.id }, orderBy: { createdAt: 'desc' } });
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch services" });
  }
});

// Create Provider Service
app.post('/api/providers/services', authMiddleware, async (req, res) => {
  if (req.user.role !== 'provider') return res.status(403).json({ error: "Only providers can create services" });
  try {
    const profile = await prisma.providerProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ error: "Provider profile not found" });

    const { category, experience, price, description } = req.body;
    const newService = await prisma.providerService.create({
      data: {
        providerProfileId: profile.id,
        category,
        experience: experience || "0 years",
        price: Number(price) || 0,
        description: description || ""
      }
    });
    res.status(201).json(newService);
  } catch (err) {
    res.status(500).json({ error: "Failed to create service" });
  }
});

// Update Provider Service
app.put('/api/providers/services/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'provider') return res.status(403).json({ error: "Only providers can update services" });
  try {
    const profile = await prisma.providerProfile.findUnique({ where: { userId: req.user.id } });
    const serviceId = req.params.id;
    
    const existing = await prisma.providerService.findUnique({ where: { id: serviceId } });
    if (!existing || existing.providerProfileId !== profile.id) {
      return res.status(404).json({ error: "Service not found or unauthorized" });
    }

    const { category, experience, price, description } = req.body;
    const updatedService = await prisma.providerService.update({
      where: { id: serviceId },
      data: {
        category: category || existing.category,
        experience: experience || existing.experience,
        price: price !== undefined ? Number(price) : existing.price,
        description: description || existing.description
      }
    });
    res.json(updatedService);
  } catch (err) {
    res.status(500).json({ error: "Failed to update service" });
  }
});

// Delete Provider Service
app.delete('/api/providers/services/:id', authMiddleware, async (req, res) => {
  if (req.user.role !== 'provider') return res.status(403).json({ error: "Only providers can delete services" });
  try {
    const profile = await prisma.providerProfile.findUnique({ where: { userId: req.user.id } });
    const serviceId = req.params.id;
    
    const existing = await prisma.providerService.findUnique({ where: { id: serviceId } });
    if (!existing || existing.providerProfileId !== profile.id) {
      return res.status(404).json({ error: "Service not found or unauthorized" });
    }

    await prisma.providerService.delete({ where: { id: serviceId } });
    res.json({ message: "Service deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete service" });
  }
});


// ==========================================
// BOOKING ROUTES
// ==========================================

// Create booking
app.post('/api/bookings', authMiddleware, async (req, res) => {
  try {
    const { providerProfileId, date, time, price, notes } = req.body;
    
    const booking = await prisma.booking.create({
      data: {
        userId: req.user.id,
        providerProfileId,
        date,
        time,
        price,
        notes,
        status: "Pending"
      }
    });

    res.status(201).json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

// Get User's Bookings
app.get('/api/bookings/my', authMiddleware, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: req.user.role === 'user' ? { userId: req.user.id } : { providerProfile: { userId: req.user.id } },
      include: {
        providerProfile: { select: { user: { select: { name: true } }, service: true } },
        user: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format for frontend
    const formatted = bookings.map(b => ({
      ...b,
      providerName: req.user.role === 'user' ? b.providerProfile.user.name : b.user.name,
      service: b.providerProfile.service
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// Update booking status
app.put('/api/bookings/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const bookingId = req.params.id;

    // Ensure the booking exists and the user is either the provider or the user
    const existing = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { providerProfile: true }
    });

    if (!existing) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (req.user.role === 'provider' && existing.providerProfile.userId !== req.user.id) {
       return res.status(403).json({ error: "Unauthorized" });
    }

    if (req.user.role === 'user' && existing.userId !== req.user.id) {
       return res.status(403).json({ error: "Unauthorized" });
    }

    let dataUpdate = { status };
    if (status === "Upcoming" && req.user.role === "provider") {
      dataUpdate.confirmedAt = new Date();
    }

    if (status === "Cancelled" && req.user.role === 'user' && existing.status === "Upcoming") {
       if (existing.confirmedAt) {
          const diffMins = (new Date() - new Date(existing.confirmedAt)) / 60000;
          if (diffMins > 5) {
             return res.status(400).json({ error: "Cannot cancel booking after 5 minutes of confirmation" });
          }
       }
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: dataUpdate,
      include: {
        providerProfile: { select: { user: { select: { name: true } }, service: true } },
        user: { select: { name: true } }
      }
    });

    if (status === "Upcoming" || (status === "Cancelled" && req.user.role === "provider")) {
      await prisma.notification.create({
        data: {
          userId: updated.userId,
          message: `Your booking request with ${updated.providerProfile.user.name} has been ${status === "Upcoming" ? "confirmed" : "rejected"}.`
        }
      });
    } else if (status === "Cancelled" && req.user.role === "user") {
      await prisma.notification.create({
        data: {
          userId: existing.providerProfile.userId,
          message: `${updated.user.name} has cancelled their booking request.`
        }
      });
    } else if (status === "Completed" && req.user.role === "user") {
      await prisma.notification.create({
        data: {
          userId: existing.providerProfile.userId,
          message: `${updated.user.name} has marked your service as completed!`
        }
      });
    }

    // Match frontend mapping
    res.json({
      ...updated,
      providerName: req.user.role === 'user' ? updated.providerProfile.user.name : updated.user.name,
      service: updated.providerProfile.service
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update booking status" });
  }
});


// ==========================================
// NOTIFICATION ROUTES
// ==========================================

app.get('/api/notifications', authMiddleware, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

app.put('/api/notifications/read-all', authMiddleware, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true }
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update notifications" });
  }
});

// ==========================================
// REVIEW ROUTES
// ==========================================

// Get all reviews
app.get('/api/reviews', async (req, res) => {
  try {
    const allReviews = await prisma.review.findMany({
      include: {
        providerProfile: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' }
    });

    const mapped = allReviews.map(r => ({
      id: r.id,
      userId: r.userId,
      providerId: r.providerProfileId,
      providerUserId: r.providerProfile.userId,
      providerName: r.providerProfile.user.name,
      rating: r.rating,
      comment: r.comment,
      date: r.createdAt.toISOString().split('T')[0]
    }));

    res.json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// Create review
app.post('/api/reviews', authMiddleware, async (req, res) => {
  try {
    const { providerProfileId, rating, comment } = req.body;
    
    const review = await prisma.review.create({
      data: {
        userId: req.user.id,
        providerProfileId,
        rating,
        comment
      },
      include: {
        providerProfile: { include: { user: { select: { name: true } } } },
      }
    });

    const mapped = {
      id: review.id,
      userId: review.userId,
      providerId: review.providerProfileId,
      providerUserId: review.providerProfile.userId,
      providerName: review.providerProfile.user.name,
      rating: review.rating,
      comment: review.comment,
      date: review.createdAt.toISOString().split('T')[0]
    };

    res.status(201).json(mapped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit review" });
  }
});

// START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
