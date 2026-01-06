// --- BACKEND SERVER CODE (server/server.js) ---
// Requires: npm install express mongoose cors jsonwebtoken bcryptjs dotenv

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config(); // Ensure you have a .env file with MONGODB_URI

const app = express();
app.use(express.json());

// Allow CORS for your specific Vercel domain or all (*)
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
    credentials: true
}));

// --- MONGODB SCHEMAS ---

// 1. USER SCHEMA (Efficient Watchlist Storage)
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    watchlist: [{
        slug: String,
        title: String,
        thumbnailUrl: String,
        type: String,
        addedAt: { type: Date, default: Date.now }
    }]
});
const User = mongoose.model('User', userSchema);

// 2. REVIEW SCHEMA (Indexed by movieSlug)
const reviewSchema = new mongoose.Schema({
    movieSlug: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String, // Denormalized for faster read
    rating: { type: Number, required: true },
    comment: String,
    createdAt: { type: Date, default: Date.now }
});
const Review = mongoose.model('Review', reviewSchema);

// 3. NOTIFICATION SCHEMA
const notificationSchema = new mongoose.Schema({
    userId: { type: String, default: 'ALL' }, // 'ALL' or specific UserID
    message: String,
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});
const Notification = mongoose.model('Notification', notificationSchema);


// --- ROUTES ---

// Middleware
const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).send('Access Denied');
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'secretKey');
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).send('Invalid Token');
    }
};

app.get('/', (req, res) => {
    res.send('StreamHulu API is running');
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        const newUser = new User({ username, email, passwordHash: hash });
        await newUser.save();
        res.json({ message: "User registered" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).send("User not found");
        
        const validPass = await bcrypt.compare(password, user.passwordHash);
        if (!validPass) return res.status(400).send("Invalid password");

        const token = jwt.sign({ _id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET || 'secretKey');
        res.json({ token, user: { _id: user._id, username: user.username, email: user.email, isAdmin: user.isAdmin, watchlist: user.watchlist }});
    } catch (e) {
        res.status(500).send(e.message);
    }
});

// Watchlist Routes
app.post('/api/user/watchlist', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        // Prevent duplicates
        if (!user.watchlist.some(w => w.slug === req.body.slug)) {
            user.watchlist.push(req.body);
            await user.save();
        }
        res.json(user.watchlist);
    } catch (e) { res.status(500).send(e.message); }
});

app.delete('/api/user/watchlist/:slug', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.watchlist = user.watchlist.filter(w => w.slug !== req.params.slug);
        await user.save();
        res.json(user.watchlist);
    } catch (e) { res.status(500).send(e.message); }
});

app.get('/api/user/watchlist', auth, async (req, res) => {
    const user = await User.findById(req.user._id);
    res.json(user.watchlist);
});

// Review Routes
app.get('/api/movies/:slug/reviews', async (req, res) => {
    const reviews = await Review.find({ movieSlug: req.params.slug }).sort({ createdAt: -1 });
    res.json(reviews);
});

app.post('/api/movies/:slug/reviews', auth, async (req, res) => {
    const user = await User.findById(req.user._id);
    const newReview = new Review({
        movieSlug: req.params.slug,
        userId: user._id,
        username: user.username,
        rating: req.body.rating,
        comment: req.body.comment
    });
    await newReview.save();
    res.json(newReview);
});

// Notification Routes (Admin Logic)
app.get('/api/notifications', auth, async (req, res) => {
    // Fetch global notifications or user specific
    const notifs = await Notification.find({ 
        $or: [{ userId: 'ALL' }, { userId: req.user._id }] 
    }).sort({ createdAt: -1 }).limit(10);
    res.json(notifs);
});


// Connect to DB
const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/streamhulu';
mongoose.connect(DB_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.error(err));

// EXPORT APP FOR VERCEL
module.exports = app;

// LISTEN ONLY IF RUNNING LOCALLY (Not in Vercel)
if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}