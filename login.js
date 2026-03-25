// login.js

// STATE
let isSignUpMode = false;
let unverifiedUser = null; // Store user reference temporarily if they need to resend email

// DOM Elements
const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');
const authForm = document.getElementById('authForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const submitBtn = document.getElementById('submitBtn');
const toggleBtn = document.getElementById('toggleBtn');
const toggleText = document.getElementById('toggleText');
const resendContainer = document.getElementById('resendContainer');
const resendBtn = document.getElementById('resendBtn');
const signupFields = document.getElementById('signupFields');
const fullNameInput = document.getElementById('fullName');
const phoneInput = document.getElementById('phone');
const roleSelect = document.getElementById('role');

// Auth State Observer - Redirect to admin if already logged in and verified
auth.onAuthStateChanged(user => {
    if (user && user.emailVerified) {
        window.location.href = 'admin.html';
    }
});

// Toggle Modes
toggleBtn.addEventListener('click', () => {
    isSignUpMode = !isSignUpMode;
    resendContainer.style.display = 'none';
    if (isSignUpMode) {
        signupFields.style.display = 'block';
        authTitle.textContent = 'Create Account';
        authSubtitle.textContent = 'Join Vista to list properties and manage saves.';
        submitBtn.textContent = 'Sign Up';
        toggleText.textContent = 'Already have an account?';
        toggleBtn.textContent = 'Sign In';
    } else {
        signupFields.style.display = 'none';
        authTitle.textContent = 'Welcome Back';
        authSubtitle.textContent = 'Sign in to list properties or save homes.';
        submitBtn.textContent = 'Sign In';
        toggleText.textContent = "Don't have an account?";
        toggleBtn.textContent = 'Sign Up';
    }
});

// Submit Form
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // Disable button during req
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';

    try {
        if (isSignUpMode) {
            // SIGN UP
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
            
            // Save extra info
            await userCredential.user.updateProfile({ displayName: fullName });
            
            await db.collection('users').doc(userCredential.user.uid).set({
                fullName,
                phone,
                role,
                email,
                createdAt: new Date().toISOString()
            });

            await userCredential.user.sendEmailVerification();
            showToast('Account created! Please check your email for the verification link.', 'success');
            await auth.signOut(); // Force them to verify before they can truly log in
            
            // Switch back to sign in
            toggleBtn.click();
            emailInput.value = '';
            passwordInput.value = '';
            fullNameInput.value = '';
            phoneInput.value = '';
        } else {
            // SIGN IN
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            
            if (!userCredential.user.emailVerified) {
                unverifiedUser = userCredential.user;
                await auth.signOut(); // Sign out right away if unverified
                showToast('Please verify your email before logging in.', 'error');
                resendContainer.style.display = 'block';
            } else {
                showToast('Welcome back!', 'success');
                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 1000);
            }
        }
    } catch (error) {
        let msg = error.message;
        if (error.code === 'auth/email-already-in-use') msg = 'Email is already in use.';
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') msg = 'Invalid email or password.';
        if (error.code === 'auth/weak-password') msg = 'Password should be at least 6 characters.';
        showToast(msg, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
    }
});

// Resend Verification Email
resendBtn.addEventListener('click', async () => {
    if (!unverifiedUser) return;
    try {
        // Unfortunately, if they are signed out, we can't send email verification easily without signing them in.
        // But since we signed them out, we need them to re-authenticate or we intercept the unverifiedUser before signing out.
        // Hack for UX: re-login temporarily if we stored password, but we don't.
        // Instead, we can just show a prompt to try signing up again or logging in again to trigger it.
        // For security, to resend email verification, the user MUST be signed in.
        // So we will silently sign them back in with current inputs just to send the email, then sign out.
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const res = await auth.signInWithEmailAndPassword(email, password);
        await res.user.sendEmailVerification();
        await auth.signOut();
        showToast('Verification email sent again. Please check your inbox.', 'success');
        resendContainer.style.display = 'none';
        unverifiedUser = null;
    } catch (error) {
        showToast('Session expired. Please sign in again to resend.', 'error');
    }
});
