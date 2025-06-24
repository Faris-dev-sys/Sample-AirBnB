README - Database Applications Assignment 4

Student Name: Faris Rahman
Student ID: S3657457

Instructions for the Marker:

1. Server Entry Point:
   - Run `app3.js` inside the `A4` folder

2. Port Number:
   - The server runs on http://localhost:3000

3. Folder Structure:
   - A4/
     ├── app3.js
     └── public/
         ├── form3.html
         └── confirmation.html
	 └── bookings.html

4. Required Node.js Libraries:
   Before starting the application, run the following command inside the A4 folder to install dependencies: npm install express ,  mongodb body-parser


5. How to Start the Server:
From inside the `A4` folder, run: node app3.js


6. How to Access the Form:
Open your browser and go to: http://localhost:3000/


7. Notes:
- Ensure you are connected to the internet to allow access to MongoDB Atlas.
- The application connects to the database `sample_airbnb` and inserts into the `bookings` and `registeredClient` collections.
- Bookings will fail if the check-in date is earlier than today, or if the listing is already booked, or if the number of days is less or more than min and max nights. 




