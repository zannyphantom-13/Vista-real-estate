// login.js

let isSignUpMode = false;
let pendingUser = null; // Store user while they complete the missing fields modal

// DOM Elements
const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');
const authForm = document.getElementById('authForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const togglePasswordBtn = document.getElementById('togglePasswordBtn');
const togglePasswordIcon = document.getElementById('togglePasswordIcon');
const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
const submitBtn = document.getElementById('submitBtn');
const toggleBtn = document.getElementById('toggleBtn');
const toggleText = document.getElementById('toggleText');
const signupFields = document.getElementById('signupFields');
const fullNameInput = document.getElementById('fullName');
const phoneInput = document.getElementById('phone');
const roleSelect = document.getElementById('role');

const googleBtn = document.getElementById('googleBtn');
const profileModal = document.getElementById('profileModal');
const profileForm = document.getElementById('profileForm');
const modalPhone = document.getElementById('modalPhone');
const modalRole = document.getElementById('modalRole');
const modalSubmitBtn = document.getElementById('modalSubmitBtn');

// Handle Full-Page Redirect Results (Google Auth)
auth.getRedirectResult().then(async (result) => {
    if (result && result.user) {
        await handleSuccessfulAuth(result.user);
    }
}).catch(error => {
    if (error.code !== 'auth/redirect-cancelled-by-user' && error.code !== 'auth/popup-closed-by-user') {
        showToast('Google Sign-In caught an error: ' + error.message, 'error');
    }
});

// Observer - Only let them through if their profile is complete
auth.onAuthStateChanged(async user => {
    if (user && !pendingUser) {
        // Check if profile is complete
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists && userDoc.data().phone && userDoc.data().role) {
            window.location.href = 'admin.html';
        } else {
            // Unfinished profile - trigger modal
            pendingUser = user;
            profileModal.style.display = 'flex';
        }
    }
});

// Toggle Modes
toggleBtn.addEventListener('click', () => {
    isSignUpMode = !isSignUpMode;
    if (isSignUpMode) {
        signupFields.style.display = 'block';
        forgotPasswordBtn.style.display = 'none';
        authTitle.textContent = 'Create Account';
        authSubtitle.textContent = 'Join Vista to list properties and manage saves.';
        submitBtn.textContent = 'Sign Up';
        toggleText.textContent = 'Already have an account?';
        toggleBtn.textContent = 'Sign In';
    } else {
        signupFields.style.display = 'none';
        forgotPasswordBtn.style.display = 'block';
        authTitle.textContent = 'Welcome Back';
        authSubtitle.textContent = 'Sign in to list properties or save homes.';
        submitBtn.textContent = 'Sign In';
        toggleText.textContent = "Don't have an account?";
        toggleBtn.textContent = 'Sign Up';
    }
});

// Password Toggle
togglePasswordBtn.addEventListener('click', () => {
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    if (isPassword) {
        togglePasswordIcon.classList.replace('ph-eye', 'ph-eye-slash');
    } else {
        togglePasswordIcon.classList.replace('ph-eye-slash', 'ph-eye');
    }
});

// Forgot Password
forgotPasswordBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    if (!email) {
        showToast('Please enter your email address first.', 'info');
        return;
    }
    try {
        await auth.sendPasswordResetEmail(email);
        showToast('Password reset link sent! Check your inbox.', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
});

// Google Sign In
googleBtn.addEventListener('click', () => {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithRedirect(provider);
    } catch (error) {
        showToast('Google Sign-In Initialization Failed: ' + error.message, 'error');
    }
});

// Complete Profile Form Submission (Missing Fields Interceptor)
profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!pendingUser) return;
    
    modalSubmitBtn.disabled = true;
    modalSubmitBtn.textContent = 'Saving...';
    
    try {
        await db.collection('users').doc(pendingUser.uid).set({
            phone: modalPhone.value.trim(),
            role: modalRole.value,
            // Fallbacks if they originally didn't have these
            fullName: pendingUser.displayName || 'Vista User',
            email: pendingUser.email,
            createdAt: new Date().toISOString()
        }, { merge: true });
        
        showToast('Profile completed! Welcome to Vista.', 'success');
        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 1000);
    } catch (error) {
        showToast('Failed to save profile: ' + error.message, 'error');
        modalSubmitBtn.disabled = false;
        modalSubmitBtn.textContent = 'Save and Continue';
    }
});

// Handle Auth Success / Routing
async function handleSuccessfulAuth(user, explicitData = null) {
    try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists || !userDoc.data().phone || !userDoc.data().role) {
            // If they provided explicit data via Email Sign Up form, save it directly
            if (explicitData) {
                await db.collection('users').doc(user.uid).set(explicitData, { merge: true });
                showToast('Account created successfully!', 'success');
                setTimeout(() => window.location.href = 'admin.html', 1000);
            } else {
                // Otherwise (e.g. Google Auth), intercept and pop modal
                pendingUser = user;
                profileModal.style.display = 'flex';
                showToast('Please complete your profile to continue.', 'info');
            }
        } else {
            // Exists and has fields
            showToast('Welcome back!', 'success');
            setTimeout(() => window.location.href = 'admin.html', 1000);
        }
    } catch (error) {
        console.warn('Handling auth data error:', error);
    }
}

// Email/Password Submit
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';

    try {
        if (isSignUpMode) {
            const fullName = fullNameInput.value.trim();
            const phone = phoneInput.value.trim();
            const role = roleSelect.value;
            
            if (!fullName) {
                showToast('Please enter your full name.', 'error');
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                return;
            }

            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            await userCredential.user.updateProfile({ displayName: fullName });
            
            // Go straight to handle profile setup & redirect (NO OTP!)
            await handleSuccessfulAuth(userCredential.user, {
                fullName, phone, role, email, createdAt: new Date().toISOString()
            });

        } else {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            // Sign in successfully -> check if fields missing
            await handleSuccessfulAuth(userCredential.user);
        }
    } catch (error) {
        let msg = error.message;
        if (error.code === 'auth/email-already-in-use') msg = 'Email is already in use.';
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') msg = 'Invalid email or password.';
        showToast(msg, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
    }
});
