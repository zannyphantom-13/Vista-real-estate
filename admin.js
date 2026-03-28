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
    
    if (userDoc.is_owner !== true) {
        window.location.href = 'profile.html';
        return;
    }

    // Unhide the main body so styling flashes properly
    adminBody.style.display = 'block';
    
    // Supreme Owner Dashboard Initialization
    ownerPortal.style.display = 'block';
    loadUserManagement();
});

// Logout Helper
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
});


// ==========================================
// 1. OWNER PORTAL LOGIC
// ==========================================
window.pendingUsersMap = {};

async function loadUserManagement() {
    // Fetch explicit seller/agent users actively traversing the platform, except other supreme owners
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .in('role', ['agent', 'seller'])
        .neq('is_owner', true)
        .order('created_at', { ascending: false });
    if(error) return showToast('Failed to load platform users: ' + error.message, 'error');

    const tbody = document.getElementById('userTableBody');
    tbody.innerHTML = '';

    let pendingCount = 0;
    let sellerCount = 0;
    let agentCount = 0;

    users.forEach(u => {
        const vStatus = u.verification_status || 'unsubmitted';
        const isApproved = u.is_approved === true;
        
        if (vStatus === 'pending') pendingCount++;
        if (isApproved && u.role === 'seller') sellerCount++;
        if (isApproved && u.role === 'agent') agentCount++;
        
        // Compute Label Aesthetics smartly
        let badgeColor = '#64748b'; // darker gray for dark mode
        let badgeText = 'Unsubmitted';
        if (isApproved || vStatus === 'approved') {
            badgeColor = '#10b981'; badgeText = 'Approved';
        } else if (vStatus === 'pending') {
            badgeColor = '#3b82f6'; badgeText = 'Pending Review';
        } else if (vStatus === 'rejected') {
            badgeColor = '#ef4444'; badgeText = 'Rejected';
        }

        // Action button is strictly dynamically routed if they have submitted documentation
        let actionBtn = `<span style="color: #64748b; font-size: 0.85rem;">No File Action</span>`;
        if (u.role === 'agent' || u.role === 'seller') {
            window.pendingUsersMap[u.id] = u;
            if (vStatus === 'pending') {
                actionBtn = `<button class="btn btn-primary" style="padding: 6px 16px; font-size: 0.85rem;" onclick="openReviewModal('${u.id}')">Review Application</button>`;
            } else if (isApproved) {
                actionBtn = `<button class="btn btn-secondary" style="padding: 6px 16px; font-size: 0.85rem; border-color: #ef4444; color: #ef4444;" onclick="processApplication('${u.id}', false)">Revoke Access</button>`;
            } else if (vStatus === 'rejected') {
                actionBtn = `<span style="color: #ef4444; font-size: 0.85rem; font-weight: 500;">Rejected Status</span>`;
            }
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 16px; border-bottom: 1px solid #334155; font-weight: 500;">${u.full_name || 'N/A'}</td>
            <td style="padding: 16px; border-bottom: 1px solid #334155; text-transform: capitalize; color: #94a3b8;">${u.role}</td>
            <td style="padding: 16px; border-bottom: 1px solid #334155; font-family: monospace;">${u.phone || 'N/A'}</td>
            <td style="padding: 16px; border-bottom: 1px solid #334155;">
                <span style="background: ${badgeColor}20; color: ${badgeColor}; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 600;">${badgeText}</span>
            </td>
            <td style="padding: 16px; border-bottom: 1px solid #334155;">${actionBtn}</td>
        `;
        tbody.appendChild(tr);
    });

    // Hydrate HUD Stats physically
    document.getElementById('statPending').textContent = pendingCount;
    document.getElementById('statSellers').textContent = sellerCount;
    document.getElementById('statAgents').textContent = agentCount;
}

// Global scope function for opening securely the Application Review parameters
window.openReviewModal = function(userId) {
    const u = window.pendingUsersMap[userId];
    if(!u) return;

    document.getElementById('reviewModal').style.display = 'flex';
    document.getElementById('reviewMeta').innerHTML = `
        <span style="display: block; margin-bottom: 8px;"><strong>Account Entity Profile:</strong> ${u.full_name || 'Anonymous Platform Identifier'}</span>
        <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin-bottom: 16px; border: 1px dashed #cbd5e1;">
            <span style="display: block; margin-bottom: 8px; color: var(--secondary); font-size: 1.05rem;"><strong>Formal Legal ID Name:</strong> ${u.id_name || '<span style="color:#ef4444; font-weight:700;">NOT PROVIDED</span>'}</span>
            <span style="display: block; color: var(--text-main);"><strong>Issuing ID Sovereign Country:</strong> ${u.id_country || '<span style="color:#ef4444;">NOT PROVIDED</span>'}</span>
        </div>
        <span style="display: block; margin-bottom: 8px;"><strong>Real Estate License:</strong> ${u.license_number || '<span style="color:#64748b; font-style:italic;">(Consumer Upload Exemption)</span>'}</span>
        <span style="display: block; margin-bottom: 8px;"><strong>Brokerage Organization:</strong> ${u.brokerage_name || '<span style="color:#64748b; font-style:italic;">(Consumer Upload Exemption)</span>'}</span>
    `;
    document.getElementById('reviewIdUrl').href = u.id_url || '#';
    
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


 
