const express = require('express');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let listings;

async function start() {
  await client.connect();
  const db = client.db('sample_airbnb');
  listings = db.collection('listingsAndReviews');

  app.use(bodyParser.json());
  app.use(express.static(path.join(__dirname, './public')));

  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './public/form3.html'));
  });

  app.get('/api/options', async (req, res) => {
    const propertyTypes = await listings.distinct('property_type');
    const bedroomCounts = await listings.distinct('bedrooms');
    const locations = await listings.distinct('address.market');
    res.json({
      locations: locations.filter(Boolean).sort(),
      propertyTypes: propertyTypes.filter(Boolean).sort(),
      bedroomCounts: bedroomCounts.filter(n => n !== null).sort((a, b) => a - b)
    });
  });

  app.get('/api/random-listings', async (req, res) => {
    const results = await listings.aggregate([
      { $match: { name: { $exists: true }, summary: { $exists: true } } },
      { $sample: { size: 5 } },
      {
        $project: {
          _id: 1,
          name: 1,
          summary: 1,
          price: 1,
          'review_scores.review_scores_rating': 1
        }
      }
    ]).toArray();

    res.json(results.map(r => ({
      _id: r._id,
      name: r.name,
      summary: r.summary,
      price: formatPrice(r.price),
      review_scores_rating: r.review_scores?.review_scores_rating
    })));
  });

  app.post('/api/search', async (req, res) => {
    const { location, property_type, bedrooms } = req.body;
    const query = { 'address.market': { $regex: new RegExp(location, 'i') } };
    if (property_type) query.property_type = property_type;
    if (bedrooms) query.bedrooms = parseInt(bedrooms);

    const results = await listings.find(query, {
      projection: {
        _id: 1,
        name: 1,
        summary: 1,
        price: 1,
        'review_scores.review_scores_rating': 1
      }
    }).limit(10).toArray();

    res.json(results.map(r => ({
      _id: r._id,
      name: r.name,
      summary: r.summary,
      price: formatPrice(r.price),
      review_scores_rating: r.review_scores?.review_scores_rating
    })));
  });

  app.post('/api/bookings', async (req, res) => {
    try {
      const {
        listingID, listingName, listingURL,
        startDate, endDate,
        name, email, phone, mobile,
        postalAddress, homeAddress
      } = req.body;

      const db = client.db('sample_airbnb');
      const checkIn = new Date(startDate);
      const checkOut = new Date(endDate);
      const duration = (checkOut - checkIn) / (1000 * 60 * 60 * 24);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (checkIn < today) {
        return res.status(400).json({
          success: false,
          message: "Check-in date must be today or later."
        });
      }

      const listing = await listings.findOne({ _id: listingID });
      if (!listing) {
        return res.status(400).json({ success: false, message: "Listing not found." });
      }

      const minNights = parseInt(listing.minimum_nights) || 1;
      const maxNights = parseInt(listing.maximum_nights) || 30;

      if (duration < minNights || duration > maxNights) {
        return res.status(400).json({
          success: false,
          message: `Booking must be between ${minNights} and ${maxNights} nights.`
        });
      }

      const conflicting = await db.collection('bookings').findOne({
        'listing.listingID': listingID,
        $or: [
          { startDate: { $lte: checkOut }, endDate: { $gte: checkIn } }
        ]
      });

      if (conflicting) {
        return res.status(400).json({
          success: false,
          message: "This property is already booked for the selected dates."
        });
      }

      let clientDoc = await db.collection('registeredClient').findOne({ emailAddress: email });

      let clientID;
      if (clientDoc) {
        clientID = clientDoc.clientID;
      } else {
        clientID = `C${Date.now()}`;
        await db.collection('registeredClient').insertOne({
          clientID,
          name,
          emailAddress: email,
          daytimePhoneNumber: phone,
          mobileNumber: mobile,
          postalAddress,
          homeAddress
        });
      }

      const bookingID = `B${Date.now()}`;
      const bookingData = {
        bookingID,
        clientID,
        startDate: checkIn,
        endDate: checkOut,
        depositPaid: 200,
        balanceAmountDue: 500,
        balanceDueDate: checkIn,
        numGuests: 1,
        guestList: [{ name, age: 30 }],
        listing: {
          listingID,
          name: listingName,
          listingURL
        }
      };

      await db.collection('bookings').insertOne(bookingData);
      res.json({ success: true, bookingID });

    } catch (err) {
      console.error("Booking error:", err);
      res.status(500).json({ success: false, message: "An error occurred." });
    }
  });

  app.get('/api/listing/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const listing = await listings.findOne({ _id: id });
      if (!listing) {
        return res.status(404).json({});
      }
      res.json(listing);
    } catch (err) {
      console.error("Listing fetch error:", err);
      res.status(500).json({ error: "Failed to fetch listing" });
    }
  });

  // ✅ Fixed: Booking summary by ID
  app.get('/api/booking/:id', async (req, res) => {
    try {
      const db = client.db('sample_airbnb');
      const booking = await db.collection('bookings').findOne({ bookingID: req.params.id });
      if (!booking) return res.json({});

      const clientDoc = await db.collection('registeredClient').findOne({ clientID: booking.clientID });
      const listing = await db.collection('listingsAndReviews').findOne({ _id: booking.listing.listingID });

      res.json({
        ...booking,
        clientEmail: clientDoc?.emailAddress,
        listing: {
          name: booking.listing.name,
          price: listing?.price || 100
        }
      });
    } catch (err) {
      console.error("Fetch booking error:", err);
      res.status(500).json({ error: "Failed to load booking summary" });
    }
  });

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

function formatPrice(price) {
  if (!price) return 'N/A';
  if (typeof price === 'object' && price.$numberDecimal) return price.$numberDecimal;
  if (typeof price === 'number') return price.toFixed(2);
  return price.toString();
}

start();
