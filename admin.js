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

    // UI/UX Dynamic Top Logo Rendering
    const dynamicLogo = document.getElementById('dynamicLogo');
    if (dynamicLogo) {
        let logoText = 'Vista User';
        let logoIcon = 'ph-user';

        if (userDoc.is_owner === true) {
            logoText = 'Vista Admin';
            logoIcon = 'ph-shield-check';
        } else if (userDoc.role === 'agent') {
            logoText = 'Vista Agent';
            logoIcon = 'ph-briefcase';
        }

        dynamicLogo.innerHTML = `<i class="ph ${logoIcon}"></i> ${logoText}`;
    }

    // UNIVERSAL: Render Profile UI for EVERYONE natively
    document.getElementById('profilePortal').style.display = 'block';
    document.getElementById('profName').textContent = userDoc.full_name || 'Anonymous';
    document.getElementById('profEmail').textContent = userDoc.email || 'N/A';
    document.getElementById('profPhone').textContent = userDoc.phone || 'N/A';
    document.getElementById('profRole').textContent = userDoc.role;

    // ACCOUNT UPGRADE ROUTING
    const upgradeSection = document.getElementById('upgradeSection');
    if (upgradeSection) {
        if (userDoc.role === 'buyer' || userDoc.role === 'renter') {
            upgradeSection.style.display = 'block';
            document.getElementById('upgradeDesc').textContent = 'Unlock the capability to violently list your own properties by natively upgrading exclusively to a Seller account.';
            const uBtn = document.getElementById('upgradeBtn');
            uBtn.textContent = 'Upgrade to Seller';
            uBtn.onclick = () => window.triggerAccountUpgrade('seller');
        } else if (userDoc.role === 'seller') {
            upgradeSection.style.display = 'block';
            document.getElementById('upgradeDesc').textContent = 'Are you a licensed real estate professional? Mathematically upgrade to an Agent tier natively to list comprehensive brokerage portfolios.';
            const uBtn = document.getElementById('upgradeBtn');
            uBtn.textContent = 'Upgrade to Agent';
            uBtn.onclick = () => window.triggerAccountUpgrade('agent');
        } else {
            upgradeSection.style.display = 'none';
        }
    }

    // ==========================================
    // HYBRID WORKSPACE ROUTING
    // ==========================================
    if (userDoc.is_owner === true) {
        // Supreme Admin Level
        ownerPortal.style.display = 'block';
        loadUserManagement();

    } else {
        // Consumer / Standard User Level (Buyer, Renter, Seller) always can universally load Saved Homes natively
        const consumerPortal = document.getElementById('consumerPortal');
        if(consumerPortal) consumerPortal.style.display = 'block';

        if (userDoc.role === 'agent' || userDoc.role === 'seller') {
            if (userDoc.is_approved === true) {
                uploadPortal.style.display = 'block';
            } else {
                // Determine verification phase
                const vStatus = userDoc.verification_status || 'unsubmitted';
                
                if (vStatus === 'unsubmitted' || vStatus === 'rejected') {
                    if(!document.getElementById('unverifiedPortal')) return;
                    document.getElementById('unverifiedPortal').style.display = 'block';
                    document.getElementById('agentFields').style.display = (userDoc.role === 'agent') ? 'block' : 'none';
                    if (vStatus === 'rejected') document.getElementById('rejectedWarning').style.display = 'block';
                } else if (vStatus === 'pending') {
                    pendingPortal.style.display = 'block';
                }
            }
        }
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
        const vStatus = u.verification_status || 'unsubmitted';
        const isApproved = u.is_approved === true;
        
        // Compute Label Aesthetics smartly
        let badgeColor = '#94a3b8';
        let badgeText = 'Unsubmitted';
        if (isApproved || vStatus === 'approved') {
            badgeColor = '#10b981'; badgeText = 'Approved';
        } else if (vStatus === 'pending') {
            badgeColor = '#3b82f6'; badgeText = 'Pending Review';
        } else if (vStatus === 'rejected') {
            badgeColor = '#ef4444'; badgeText = 'Rejected';
        }

        // Action button is strictly dynamically routed if they have submitted documentation
        let actionBtn = `<span style="color: var(--border); font-size: 0.85rem;">No File Action</span>`;
        if (u.role === 'agent' || u.role === 'seller') {
            if (vStatus === 'pending') {
                actionBtn = `<button class="btn btn-primary" style="padding: 6px 16px; font-size: 0.85rem;" onclick="openReviewModal('${u.id}', '${u.full_name}', '${u.license_number}', '${u.brokerage_name}', '${u.id_url}')">Review Application</button>`;
            } else if (isApproved) {
                actionBtn = `<button class="btn btn-secondary" style="padding: 6px 16px; font-size: 0.85rem; border-color: #ef4444; color: #ef4444;" onclick="processApplication('${u.id}', false)">Revoke Access</button>`;
            } else if (vStatus === 'rejected') {
                actionBtn = `<span style="color: #ef4444; font-size: 0.85rem; font-weight: 500;">Rejected Status</span>`;
            }
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

// Global scope function for opening securely the Application Review parameters
window.openReviewModal = function(userId, name, license, brokerage, idUrl) {
    document.getElementById('reviewModal').style.display = 'flex';
    document.getElementById('reviewMeta').innerHTML = `
        <span style="display: block; margin-bottom: 8px;"><strong>Applicant Entity:</strong> ${name && name !== 'undefined' ? name : 'Anonymous'}</span>
        <span style="display: block; margin-bottom: 8px;"><strong>Submitted License Number:</strong> ${license && license !== 'undefined' && license !== 'null' ? license : '(Consumer Exemption)'}</span>
        <span style="display: block; margin-bottom: 8px;"><strong>Brokerage Organization:</strong> ${brokerage && brokerage !== 'undefined' && brokerage !== 'null' ? brokerage : '(Consumer Exemption)'}</span>
    `;
    document.getElementById('reviewIdUrl').href = idUrl;
    
    // Inject the exact function triggers instantly to bypass scope
    document.getElementById('confirmApproveBtn').onclick = () => window.processApplication(userId, true);
    document.getElementById('confirmRejectBtn').onclick = () => window.processApplication(userId, false);
};

window.processApplication = async function(userId, isApproved) {
    const status = isApproved ? 'approved' : 'rejected';
    const payload = { verification_status: status, is_approved: isApproved };
    
    const { error } = await supabase.from('users').update(payload).eq('id', userId);
    
    if (error) {
        showToast('Error finalizing verdict: ' + error.message, 'error');
    } else {
        showToast(`Identity manually ${status}!`, 'success');
        document.getElementById('reviewModal').style.display = 'none';
        loadUserManagement(); // Hydrate DOM safely
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

// ==========================================
// 3. SECURE IDENTITY VERIFICATION UPLOAD LOGIC
// ==========================================
const verifyForm = document.getElementById('verifyForm');
if (verifyForm) {
    verifyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('verifySubmitBtn');
        const idInput = document.getElementById('idUpload');
        const file = idInput.files[0];
        if (!file) return;

        btn.textContent = 'Encrypting & Uploading Identification...';
        btn.disabled = true;

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

            const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: 'POST', body: formData
            });

            if (!cloudinaryRes.ok) throw new Error('Secure document vault structurally rejected the file payload.');
            const data = await cloudinaryRes.json();
            const secureUrl = data.secure_url;

            const { data: { session } } = await supabase.auth.getSession();
            
            const payload = {
                verification_status: 'pending',
                id_url: secureUrl,
                license_number: document.getElementById('licenseNum') ? document.getElementById('licenseNum').value.trim() : null,
                brokerage_name: document.getElementById('brokerageName') ? document.getElementById('brokerageName').value.trim() : null
            };

            const { error } = await supabase.from('users').update(payload).eq('id', session.user.id);
            if(error) throw error;

            showToast('Identity explicitly submitted to the Supreme Admin!', 'success');
            setTimeout(() => window.location.reload(), 2000);

        } catch (error) {
            showToast('Error uploading identity payload: ' + error.message, 'error');
            console.error(error);
        } finally {
            btn.textContent = 'Submit Verification File';
            btn.disabled = false;
        }
    });
}

// Global scope function systematically orchestrating structural Role Tiers
window.triggerAccountUpgrade = async function(targetRole) {
    const btn = document.getElementById('upgradeBtn');
    btn.textContent = 'Securing Upgrade...';
    btn.disabled = true;

    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // When upgrading, strictly violently rip out verification variables to securely force re-submission of higher-tier paperwork limits
        const payload = { 
            role: targetRole,
            verification_status: 'unsubmitted',
            is_approved: false
        };

        const { error } = await supabase.from('users').update(payload).eq('id', session.user.id);
        if (error) throw error;

        showToast(`Flawlessly upgraded to ${targetRole}! Restarting bounds...`, 'success');
        setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
        showToast('Structural upgrade failed: ' + err.message, 'error');
        btn.textContent = 'Retry Integration';
        btn.disabled = false;
    }
};
