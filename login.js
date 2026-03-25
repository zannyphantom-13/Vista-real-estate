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
const togglePasswordBtn = document.getElementById('togglePasswordBtn');
const togglePasswordIcon = document.getElementById('togglePasswordIcon');
const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
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
// Note: We are now using a custom DB flag for verification instead of Firebase's native emailVerified
auth.onAuthStateChanged(async user => {
    if (user) {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists && userDoc.data().emailVerified) {
            window.location.href = 'admin.html';
        }
    }
});

// Toggle Modes
toggleBtn.addEventListener('click', () => {
    isSignUpMode = !isSignUpMode;
    resendContainer.style.display = 'none';
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

// Password Visibility Toggle
togglePasswordBtn.addEventListener('click', () => {
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    
    if (isPassword) {
        togglePasswordIcon.classList.remove('ph-eye');
        togglePasswordIcon.classList.add('ph-eye-slash');
    } else {
        togglePasswordIcon.classList.remove('ph-eye-slash');
        togglePasswordIcon.classList.add('ph-eye');
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
        let msg = error.message;
        if (error.code === 'auth/user-not-found') msg = 'No account found with that email.';
        if (error.code === 'auth/invalid-email') msg = 'Please enter a valid email address.';
        showToast(msg, 'error');
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
            const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
            
            // Save extra info & OTP code
            try {
                await userCredential.user.updateProfile({ displayName: fullName });
                
                await db.collection('users').doc(userCredential.user.uid).set({
                    fullName,
                    phone,
                    role,
                    email,
                    otpCode: randomCode,
                    emailVerified: false,
                    createdAt: new Date().toISOString()
                });
                
                // Trigger EmailJS OTP Message
                await emailjs.send('service_4zp6vha', 'template_tnpxirj', {
                    user_name: fullName,
                    user_email: email,
                    otp_code: randomCode
                });

            } catch (dbError) {
                console.warn('Could not save extended profile data to Firestore:', dbError);
            }

            showToast('Account created! Sending verification code to your email...', 'success');
            await auth.signOut(); // Force them to verify
            
            // Redirect to OTP Verification Screen
            setTimeout(() => {
                window.location.href = `otp.html?uid=${userCredential.user.uid}`;
            }, 1000);

        } else {
            // SIGN IN
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            
            // Re-check our custom OTP verification flag
            const userDoc = await db.collection('users').doc(userCredential.user.uid).get();
            
            if (userDoc.exists && !userDoc.data().emailVerified) {
                unverifiedUser = userCredential.user;
                await auth.signOut(); // Sign out right away if unverified
                showToast('Please verify your email code before logging in.', 'error');
                
                // Generate and send a NEW code
                const newCode = Math.floor(100000 + Math.random() * 900000).toString();
                await db.collection('users').doc(userCredential.user.uid).update({ otpCode: newCode });
                await emailjs.send('service_4zp6vha', 'template_tnpxirj', {
                    user_name: userDoc.data().fullName,
                    user_email: email,
                    otp_code: newCode
                });

                setTimeout(() => {
                    window.location.href = `otp.html?uid=${userCredential.user.uid}`;
                }, 1500);

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
