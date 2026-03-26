// admin.js

const adminBody = document.getElementById('adminBody');
const ownerPortal = document.getElementById('ownerPortal');
const uploadPortal = document.getElementById('uploadPortal');
const pendingPortal = document.getElementById('pendingPortal');
const profilePortal = document.getElementById('profilePortal');

// Security Core: Protect route and Route heavily based on RBAC Profile
supabase.auth.getSession().then(async ({ data: { session } }) => {
    if (!session || !session.user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Fetch user profile natively
    const { data: userDoc, error } = await supabase.from('users').select('*').eq('id', session.user.id).single();
    
    if (error || !userDoc || !userDoc.role) {
        await supabase.auth.signOut();
        window.location.href = 'login.html';
        return;
    } 
    
    // Unhide the main body so styling flashes properly
    adminBody.style.display = 'block';

    // ==========================================
    // ROLE BASED ACCESS CONTROL (RBAC) ROUTING
    // ==========================================
    if (userDoc.is_owner === true) {
        // Supreme Admin Level
        ownerPortal.style.display = 'block';
        loadUserManagement();

    } else if (userDoc.role === 'agent') {
        // Agent Uploading Level
        if (userDoc.is_approved === true) {
            uploadPortal.style.display = 'block';
        } else {
            // Locked out pending explicit verification
            pendingPortal.style.display = 'block';
        }

    } else {
        // Consumer / Standard User Level (Buyer, Renter, Seller)
        profilePortal.style.display = 'block';
        
        // Hydrate profile data
        document.getElementById('profName').textContent = userDoc.full_name || 'Anonymous';
        document.getElementById('profEmail').textContent = userDoc.email || 'N/A';
        document.getElementById('profPhone').textContent = userDoc.phone || 'N/A';
        document.getElementById('profRole').textContent = userDoc.role;
    }
});

// Logout Helper
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
});


// ==========================================
// 1. OWNER PORTAL LOGIC
// ==========================================
async function loadUserManagement() {
    // Fetch all users actively traversing the platform, except other supreme owners
    const { data: users, error } = await supabase.from('users').select('*').neq('is_owner', true).order('created_at', { ascending: false });
    if(error) return showToast('Failed to load platform users: ' + error.message, 'error');

    const tbody = document.getElementById('userTableBody');
    tbody.innerHTML = '';

    users.forEach(u => {
        const isApproved = u.is_approved === true;
        const badgeColor = isApproved ? '#10b981' : '#f59e0b';
        const badgeText = isApproved ? 'Approved' : 'Pending';
        
        // Owner conditionally rendering Action triggers depending on exact user state
        let actionBtn = '';
        if (u.role === 'agent') {
             actionBtn = isApproved 
                ? `<button class="btn btn-secondary" style="padding: 6px 16px; font-size: 0.85rem; border-color: #ef4444; color: #ef4444;" onclick="toggleApproval('${u.id}', false)">Revoke Access</button>`
                : `<button class="btn btn-primary" style="padding: 6px 16px; font-size: 0.85rem;" onclick="toggleApproval('${u.id}', true)">Approve Access</button>`;
        } else {
             actionBtn = `<span style="color: var(--text-muted); font-size: 0.85rem;">Consumer Access</span>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 16px; border-bottom: 1px solid var(--border); font-weight: 500;">${u.full_name || 'N/A'}</td>
            <td style="padding: 16px; border-bottom: 1px solid var(--border); text-transform: capitalize; color: var(--text-muted);">${u.role}</td>
            <td style="padding: 16px; border-bottom: 1px solid var(--border); font-family: monospace;">${u.phone || 'N/A'}</td>
            <td style="padding: 16px; border-bottom: 1px solid var(--border);">
                <span style="background: ${badgeColor}20; color: ${badgeColor}; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 600;">${badgeText}</span>
            </td>
            <td style="padding: 16px; border-bottom: 1px solid var(--border);">${actionBtn}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Global scope function manually callable from the inline HTML tables
window.toggleApproval = async function(userId, status) {
    const { error } = await supabase.from('users').update({ is_approved: status }).eq('id', userId);
    
    if (error) {
        showToast('Error modifying access: ' + error.message, 'error');
    } else {
        showToast(`Agent successfully ${status ? 'approved' : 'revoked'} on pipeline!`, 'success');
        loadUserManagement(); // Hydrate dynamic DOM updates
    }
};


// ==========================================
// 2. AUTHORIZED AGENT PROPERTY UPLOAD LOGIC
// ==========================================
const CLOUDINARY_UPLOAD_PRESET = 'vista-real-estate'; 
const CLOUDINARY_CLOUD_NAME = 'djcnrlyee';

const uploadForm = document.getElementById('uploadForm');
if (uploadForm) {
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

            // 1. Upload to Cloudinary safely
            const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: 'POST',
                body: formData
            });

            if (!cloudinaryRes.ok) {
                throw new Error('Image upload forcefully failed on Cloudinary bounds.');
            }
            
            const cloudinaryData = await cloudinaryRes.json();
            const secureUrl = cloudinaryData.secure_url;

            uploadBtn.textContent = 'Saving Property...';

            // 2. Transmit Object safely into Supabase Pipeline
            const { data: { session } } = await supabase.auth.getSession();
            if(!session) throw new Error('Not authenticated pipeline error');

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

            showToast('Property successfully uploaded and publicized!', 'success');
            uploadForm.reset();

        } catch (error) {
            showToast('Error uploading property: ' + error.message, 'error');
            console.error(error);
        } finally {
            uploadBtn.textContent = 'Publish Listing';
            uploadBtn.disabled = false;
        }
    });
}
