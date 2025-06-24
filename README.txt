This is a full-stack sample Airbnb-style property listing and booking system built using:
- MongoDB (Atlas) for the NoSQL database
- Node.js + Express for the backend API
- HTML, CSS, JavaScript for the frontend
- Render for deployment
- Accessible at: https://sample-airbnb.onrender.com/

Key Features:
- Searchable Listings: Users can search properties by location, type, and number of bedrooms
- Live Dropdowns: Dynamic filtering via dropdowns populated from MongoDB fields (e.g., property types, cities)
- Booking System: Each listing has a booking form with date pickers and client input
- Validation:
	- Prevents double bookings for overlapping dates
	- Ensures bookings meet minimum/maximum night requirements
	- Validates against past dates
- Client Management:
	- Unique client IDs and emails enforced
	- New clients are inserted into a registeredClient collection
- Confirmation Page: Displays booking ID, check-in/out, nights, estimated cost, and client email

Hosted Live using Render and GitHub auto-deploy (NOTE: Takes around a minute to load given its a free option) 

