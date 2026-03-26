// admin.js

const adminBody = document.getElementById('adminBody');

// Protect route
supabase.auth.getSession().then(async ({ data: { session } }) => {
    if (!session || !session.user) {
        window.location.href = 'login.html';
        return;
    }
    
    const { data: userDoc, error } = await supabase.from('users').select('*').eq('id', session.user.id).single();
    
    if (error || !userDoc || !userDoc.role) {
        await supabase.auth.signOut();
        window.location.href = 'login.html';
    } else {
        adminBody.style.display = 'block';
    }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
});

// Cloudinary constants
const CLOUDINARY_UPLOAD_PRESET = 'vista-real-estate'; 
const CLOUDINARY_CLOUD_NAME = 'djcnrlyee';

const uploadForm = document.getElementById('uploadForm');
const uploadBtn = document.getElementById('uploadBtn');
const imageInput = document.getElementById('image');

uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = imageInput.files[0];
    if (!file) return;

    uploadBtn.textContent = 'Uploading Image...';
    uploadBtn.disabled = true;

    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        // 1. Upload to Cloudinary
        const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        });

        if (!cloudinaryRes.ok) {
            throw new Error('Image upload failed');
        }
        
        const cloudinaryData = await cloudinaryRes.json();
        const secureUrl = cloudinaryData.secure_url;

        uploadBtn.textContent = 'Saving Property...';

        // 2. Save Property to Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if(!session) throw new Error('Not authenticated');

        const isNewCheckbox = document.getElementById('isNew');

        const propertyData = {
            user_id: session.user.id,
            title: document.getElementById('title').value.trim(),
            price: Number(document.getElementById('price').value),
            address: document.getElementById('address').value.trim(),
            beds: Number(document.getElementById('beds').value),
            baths: Number(document.getElementById('baths').value),
            sqft: Number(document.getElementById('sqft').value),
            type: document.getElementById('type').value,
            status: document.getElementById('status').value,
            is_new: isNewCheckbox ? isNewCheckbox.checked : false,
            image: secureUrl
        };

        const { error } = await supabase.from('properties').insert([propertyData]);
        if(error) throw error;

        showToast('Property successfully uploaded!', 'success');
        uploadForm.reset();

    } catch (error) {
        showToast('Error uploading property: ' + error.message, 'error');
        console.error(error);
    } finally {
        uploadBtn.textContent = 'Upload Listing';
        uploadBtn.disabled = false;
    }
});
