# Vista Real Estate

Vista Real Estate is a modern, premium property listing platform built with vanilla HTML, CSS, and JavaScript. It serves as a fully functional, cloud-connected real estate application ready for production deployment.

## Key Features

- **Full-Stack Firebase Integration:** Replaces static mock data with live Firestore cloud database rendering.
- **Secure Authentication:** Complete login and registration system with Firebase Auth, featuring mandatory email verification.
- **Unsigned Image Uploads:** Direct-to-cloud property image uploads powered by Cloudinary, completely bypassing the need for a custom backend server.
- **Secure Admin Dashboard:** A protected route (`admin.html`) that allows verified real estate agents to effortlessly list new properties with customized details (price, beds, baths, sqft, property type).
- **Dynamic Filtering Engine:** Advanced client-side filtering logic that smoothly handles the live Firestore data—allowing users to search actively by keyword, property type, price range, and room count.
- **Modern UI/UX:** Built with sleek CSS variables, smooth micro-animations, Phosphor icons, and a highly responsive grid layout to ensure a premium browsing experience on any device.

## Tech Stack
- Frontend: HTML5, CSS3, Vanilla JavaScript (ES6)
- Backend & Database: Firebase (Firestore Native)
- Authentication: Firebase Auth
- Media Storage: Cloudinary (Unsigned Presets)
- Notifications: Custom animated Toast UI system

## Getting Started
To spin this up locally or deploy to a live environment (like Vercel or Netlify):
1. **Configure Firebase:** Update the config object in `firebase-config.js` with your Firebase project keys. Ensure Firestore and Authentication (Email/Password) are enabled in your console.
2. **Configure Cloudinary:** Ensure your Unsigned Upload Preset and Cloud Name are set in `admin.js` for image uploads.
3. **Launch:** Open `index.html` in your browser. No `npm install` or Node.js server required!
