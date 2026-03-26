// admin.js

// PROTECTION
const adminBody = document.getElementById('adminBody');

auth.onAuthStateChanged(async user => {
    if (!user) {
        window.location.href = 'login.html';
    } else {
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if(!userDoc.exists || !userDoc.data().role) {
            // Logged in but profile is wildly incomplete, redirect to login to finish Profile
            await auth.signOut();
            window.location.href = 'login.html';
        } else {
            // Show the page
            adminBody.style.display = 'block';
        }
    }
});

// LOGOUT
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await auth.signOut();
    window.location.href = 'index.html';
});

// UPLOAD LOGIC
const uploadForm = document.getElementById('uploadForm');
const uploadBtn = document.getElementById('uploadBtn');

uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fileInput = document.getElementById('image');
    const file = fileInput.files[0];
    if (!file) {
        showToast('Please select an image', 'error');
        return;
    }

    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Uploading Image...';
    uploadBtn.style.opacity = '0.7';

    try {
        // 1. Upload Image to Cloudinary Instead of Firebase Storage
        // NOTE: Replace these with your actual Cloudinary details
        const CLOUDINARY_CLOUD_NAME = 'di8lafe60'; 
        const CLOUDINARY_UPLOAD_PRESET = 'vista-real-estate';
        
        if (CLOUDINARY_CLOUD_NAME === 'YOUR_CLOUD_NAME') {
            throw new Error('Please configure your Cloudinary Cloud Name and Upload Preset in admin.js');
        }

        const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        const cloudinaryRes = await fetch(CLOUDINARY_URL, {
            method: 'POST',
            body: formData
        });

        if (!cloudinaryRes.ok) {
            throw new Error('Failed to upload image to Cloudinary.');
        }

        const cloudinaryData = await cloudinaryRes.json();
        const downloadURL = cloudinaryData.secure_url;

        uploadBtn.textContent = 'Saving Details...';

        // 2. Save Data to Firestore
        const propertyData = {
            title: document.getElementById('title').value.trim(),
            address: document.getElementById('address').value.trim(),
            price: Number(document.getElementById('price').value),
            beds: Number(document.getElementById('beds').value),
            baths: Number(document.getElementById('baths').value),
            sqft: Number(document.getElementById('sqft').value),
            type: document.getElementById('type').value,
            status: document.getElementById('status').value,
            isNew: document.getElementById('isNew').checked,
            image: downloadURL,
            agent: `https://ui-avatars.com/api/?name=${auth.currentUser.email}&background=random`,
            date: new Date().toISOString(),
            userId: auth.currentUser.uid
        };

        await db.collection('properties').add(propertyData);

        showToast('Listing uploaded successfully!', 'success');
        uploadForm.reset();

    } catch (error) {
        console.error('Error uploading property:', error);
        showToast('Failed to upload property: ' + error.message, 'error');
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Upload Listing';
        uploadBtn.style.opacity = '1';
    }
});
