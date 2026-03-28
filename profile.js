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

    if (userDoc.is_owner === true) {
        window.location.href = 'admin.html';
        return;
    }
    
    // Unhide the main body so styling flashes properly
    adminBody.style.display = 'block';

    // UI/UX Dynamic Top Logo Rendering
    const dynamicLogo = document.getElementById('dynamicLogo');
    if (dynamicLogo) {
        let logoText = 'Vista User';
        let logoIcon = 'ph-user';

        if (userDoc.role === 'agent') {
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
    
    // Build Explicit Structural Badge based strictly on native Identity Tiers
    let rbColor = '#64748b'; let rbBg = '#f1f5f9'; let rIcon = 'ph-user';
    if(userDoc.role === 'agent') { rbColor = '#d97706'; rbBg = '#fef3c7'; rIcon = 'ph-briefcase'; }
    else if (userDoc.role === 'seller') { rbColor = '#059669'; rbBg = '#d1fae5'; rIcon = 'ph-storefront'; }
    else if (userDoc.role === 'buyer') { rbColor = '#2563eb'; rbBg = '#dbeafe'; rIcon = 'ph-shopping-cart'; }
    else if (userDoc.role === 'renter') { rbColor = '#7c3aed'; rbBg = '#ede9fe'; rIcon = 'ph-key'; }

    document.getElementById('profRole').innerHTML = `<span style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; background: ${rbBg}; color: ${rbColor}; border-radius: 9999px; font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid ${rbColor}30;"><i class="ph ${rIcon}"></i> ${userDoc.role}</span>`;

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

    // IDENTITY NAME SYNCHRONIZATION AND EDITING LOCK
    const editNameBtn = document.getElementById('editNameBtn');
    const idNameField = document.getElementById('idName');
    
    if (idNameField) {
        idNameField.value = userDoc.full_name || ''; 
    }

    // Only allow editing if the user is completely unverified conceptually natively
    if (userDoc.is_approved !== true && (userDoc.verification_status !== 'pending')) {
        if(editNameBtn) editNameBtn.style.display = 'block';
        if(editNameBtn) editNameBtn.onclick = async () => {
            const newName = prompt('Enter your strictly legal Full Name natively synced with your physical ID docs:', userDoc.full_name);
            if(newName && newName.trim().length > 0) {
                const { error } = await supabase.from('users').update({ full_name: newName.trim() }).eq('id', userDoc.id);
                if(error) return showToast('Failed Name Refactor: ' + error.message, 'error');
                showToast('Legal Name brilliantly refactored globally!', 'success');
                setTimeout(() => window.location.reload(), 1000);
            }
        };
    }

    // ORGANIC SEARCHABLE COUNTRY LEDGER GENERATION
    const countryList = document.getElementById('countryList');
    if (countryList) {
        const baseCountries = ["United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Japan", "Brazil", "China", "India"];
        
        // Dynamically scavenge all historically verified custom countries across the global platform explicitly
        const { data: verifiedNodes } = await supabase.from('users').select('id_country').eq('is_approved', true);
        const dynamicVars = verifiedNodes ? verifiedNodes.map(u => u.id_country).filter(c => c && c.trim() !== '') : [];
        
        // Aggressively format uniquely distinct variables seamlessly and organize rigorously alphabetically securely
        const distinctMatrix = [...new Set([...baseCountries, ...dynamicVars])].sort((a, b) => a.localeCompare(b));
        countryList.innerHTML = distinctMatrix.map(c => `<option value="${c}">`).join('');
    }

    // ==========================================
    // HYBRID WORKSPACE ROUTING
    // ==========================================

    // Consumer / Standard User Level (Buyer, Renter, Seller) always can universally load Saved Homes natively
    const consumerPortal = document.getElementById('consumerPortal');
    if(consumerPortal) consumerPortal.style.display = 'block';

        if (userDoc.role === 'agent' || userDoc.role === 'seller') {
            if (userDoc.is_approved === true) {
                uploadPortal.style.display = 'block';
                
                // Inject the Explicit Tiered Visual Verification Badges directly linked logically natively
                const badgeContainer = document.getElementById('verificationBadges');
                if (badgeContainer) {
                    if (userDoc.role === 'seller') {
                        badgeContainer.innerHTML = `<i class="ph-fill ph-seal-check" style="color: #3b82f6;" title="Verified Identity"></i>`;
                    } else if (userDoc.role === 'agent') {
                        badgeContainer.innerHTML = `<i class="ph-fill ph-seal-check" style="color: #3b82f6;" title="Verified Identity"></i><i class="ph-fill ph-seal-check" style="color: #f59e0b;" title="Verified Real Estate License"></i>`;
                    }
                }
            } else {
                // Determine verification phase
                const vStatus = userDoc.verification_status || 'unsubmitted';
                
                if (vStatus === 'unsubmitted' || vStatus === 'rejected') {
                    if(!document.getElementById('unverifiedPortal')) return;
                    document.getElementById('unverifiedPortal').style.display = 'block';
                    document.getElementById('agentFields').style.display = (userDoc.role === 'agent') ? 'block' : 'none';
                    if (vStatus === 'rejected') document.getElementById('rejectedWarning').style.display = 'block';

                    // DYNAMIC TIERED UPLOAD BYPASS: Upgrading Sellers don't resubmit ID cards natively
                    if (userDoc.role === 'agent' && userDoc.id_url) {
                        const idUploadGroup = document.getElementById('idUpload').parentElement;
                        if(idUploadGroup) idUploadGroup.style.display = 'none';
                        document.getElementById('idUpload').required = false;
                        
                        const titleEl = document.querySelector('#unverifiedPortal h2');
                        const pEl = document.querySelector('#unverifiedPortal p');
                        if(titleEl) titleEl.textContent = 'Agent License Required';
                        if(pEl) pEl.textContent = 'You have already verified your identity securely as a Seller. Please supply your physical Real Estate credentials below to formally unlock full Agent capabilities.';
                    }
                } else if (vStatus === 'pending') {
                    pendingPortal.style.display = 'block';
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
// 2. AUTHORIZED AGENT PROPERTY UPLOAD LOGIC
// ==========================================
const CLOUDINARY_UPLOAD_PRESET = 'vista-real-estate'; 
const CLOUDINARY_CLOUD_NAME = 'di8lafe60';

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
        
        // Block explicitly only if the input demands a payload rigidly
        if (!file && idInput.required) return;

        btn.textContent = 'Encrypting & Submitting Credentials...';
        btn.disabled = true;

        try {
            let secureUrl = null;
            
            // Bypass Cloudinary payload constraint if file was optionally structurally omitted
            if (file) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

                const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
                    method: 'POST', body: formData
                });

                if (!cloudinaryRes.ok) throw new Error('Secure document vault structurally rejected the file payload.');
                const data = await cloudinaryRes.json();
                secureUrl = data.secure_url;
            }

            const { data: { session } } = await supabase.auth.getSession();
            
            const payload = {
                verification_status: 'pending',
                id_name: document.getElementById('idName') ? document.getElementById('idName').value.trim() : null,
                id_country: document.getElementById('idCountry') ? document.getElementById('idCountry').value : null,
                license_number: document.getElementById('licenseNum') ? document.getElementById('licenseNum').value.trim() : null,
                brokerage_name: document.getElementById('brokerageName') ? document.getElementById('brokerageName').value.trim() : null
            };
            
            if (secureUrl) {
                payload.id_url = secureUrl;
            }

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
