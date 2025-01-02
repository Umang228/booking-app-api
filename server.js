const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

// Initialize Express
const app = express();
app.use(cors({
    origin: 'http://localhost:3000',
}));

app.use(bodyParser.json());

// MongoDB Connection
mongoose
    .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Define Booking Schema and Model
const bookingSchema = new mongoose.Schema({
    date: { type: String, required: true },
    time: { type: String, required: true },
    guests: { type: Number, required: true },
    name: { type: String, required: true },
    contact: { type: String, required: true },
    about: { type: String }
});

const Booking = mongoose.model('Booking', bookingSchema);

// Create a booking
app.post('/api/bookings', async (req, res) => {
    try {
        const { date, time, guests, name, contact, about } = req.body;

        // Validate required fields
        if (!date || !time || !guests || !name || !contact) {
            return res.status(400).json({ error: "All fields are required." });
        }

        // Check if the booking is in the past
        const bookingDateTime = new Date(`${date}T${time}`);
        if (bookingDateTime < new Date()) {
            return res.status(400).json({ error: "Cannot book in the past." });
        }

        // Check for slot availability
        const existingBooking = await Booking.findOne({ date, time });
        if (existingBooking) {
            return res.status(400).json({ error: "This slot is already booked." });
        }

        // Save the new booking
        const newBooking = new Booking({ date, time, guests, name, contact, about });
        await newBooking.save();

        res.status(200).json({ message: "Booking confirmed!", booking: newBooking });
    } catch (err) {
        console.error('Error creating booking:', err);
        res.status(500).json({ error: 'Failed to create booking' });
    }
});

// Get all bookings
app.get('/api/bookings', async (req, res) => {
    try {
        const bookings = await Booking.find();
        res.status(200).json({ bookings });
    } catch (err) {
        console.error('Error fetching bookings:', err);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// Delete a booking
app.delete('/api/bookings/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Booking.findByIdAndDelete(id);

        res.status(200).json({ message: "Booking deleted!" });
    } catch (err) {
        console.error('Error deleting booking:', err);
        res.status(500).json({ error: 'Failed to delete booking' });
    }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
