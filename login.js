// login.js

let isSignUpMode = false;
let pendingUser = null;
let isAuthProcessed = false;

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
const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
const confirmPasswordInput = document.getElementById('confirmPassword');
const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPasswordBtn');
const toggleConfirmPasswordIcon = document.getElementById('toggleConfirmPasswordIcon');

const googleBtn = document.getElementById('googleBtn');
const profileModal = document.getElementById('profileModal');
const profileForm = document.getElementById('profileForm');
const modalPhone = document.getElementById('modalPhone');
const modalSubmitBtn = document.getElementById('modalSubmitBtn');

// Supabase Auth State Observer
supabase.auth.onAuthStateChange(async (event, session) => {
    // We essentially care strictly about SIGNED_IN or INITIAL_SESSION events
    if (session && session.user && !pendingUser) {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            await handleSuccessfulAuth(session.user);
        }
    }
});

// Implement Native Forgot Password Link explicitly
document.getElementById('forgotPasswordBtn')?.addEventListener('click', async () => {
    const email = document.getElementById('email').value.trim();
    if (!email) {
        return showToast('Please type your email address physically into the Email box first!', 'error');
    }

    // Explicitly command Supabase to emit the custom Recovery token physically to the inbox
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password.html'
    });

    if (error) {
        showToast('System Reset failed: ' + error.message, 'error');
    } else {
        showToast('Password reset link brutally deployed! Please flawlessly check your email inbox.', 'success');
    }
});

// Toggle Modes
toggleBtn.addEventListener('click', () => {
    isSignUpMode = !isSignUpMode;
    if (isSignUpMode) {
        signupFields.style.display = 'block';
        confirmPasswordGroup.style.display = 'block';
        confirmPasswordInput.setAttribute('required', 'true');
        forgotPasswordBtn.style.display = 'none';
        authTitle.textContent = 'Create Account';
        authSubtitle.textContent = 'Join Vista to list properties and manage saves.';
        submitBtn.textContent = 'Sign Up';
        toggleText.textContent = 'Already have an account?';
        toggleBtn.textContent = 'Sign In';
    } else {
        signupFields.style.display = 'none';
        confirmPasswordGroup.style.display = 'none';
        confirmPasswordInput.removeAttribute('required');
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
toggleConfirmPasswordBtn.addEventListener('click', () => {
    const isPass = confirmPasswordInput.getAttribute('type') === 'password';
    confirmPasswordInput.setAttribute('type', isPass ? 'text' : 'password');
    if (isPass) {
        toggleConfirmPasswordIcon.classList.replace('ph-eye', 'ph-eye-slash');
    } else {
        toggleConfirmPasswordIcon.classList.replace('ph-eye-slash', 'ph-eye');
    }
});

// Google Sign In
googleBtn.addEventListener('click', async () => {
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/login.html'
            }
        });
        if (error) throw error;
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
        const { error } = await supabase.from('users').upsert({
            id: pendingUser.id,
            phone: modalPhone.value.trim(),
            role: 'buyer',
            full_name: pendingUser.user_metadata?.full_name || 'Vista User',
            email: pendingUser.email
        });

        if (error) throw error;

        showToast('Profile completed! Welcome to Vista.', 'success');
        setTimeout(() => {
            window.location.href = 'profile.html';
        }, 1000);
    } catch (error) {
        showToast('Failed to save profile: ' + error.message, 'error');
        modalSubmitBtn.disabled = false;
        modalSubmitBtn.textContent = 'Save and Continue';
    }
});

// Handle Auth Success / Routing
async function handleSuccessfulAuth(user, explicitData = null) {
    if (isAuthProcessed) return;
    isAuthProcessed = true;

    try {
        // Did they use the email form to explicitly provide sign up data just now?
        if (explicitData) {
            const { error: upsertError } = await supabase.from('users').upsert(explicitData);
            if (upsertError) throw upsertError;

            showToast('Account created successfully!', 'success');
            setTimeout(() => window.location.href = explicitData.is_owner ? 'admin.html' : 'profile.html', 1000);
            return;
        }

        // Fetch their public user profile
        const { data: userDoc, error } = await supabase.from('users').select('*').eq('id', user.id).single();

        if (error || !userDoc || !userDoc.phone || !userDoc.role) {
            // Unfinished profile -> Intercept and pop modal
            pendingUser = user;
            profileModal.style.display = 'flex';
            showToast('Please complete your profile strictly to continue.', 'info');
        } else {
            // Profile is fully complete
            showToast('Welcome back to your dashboard!', 'success');
            setTimeout(() => window.location.href = userDoc.is_owner ? 'admin.html' : 'profile.html', 1000);
        }
    } catch (error) {
        console.error('Handling auth data error:', error);
        alert('CRASH LOG: ' + (error.message || JSON.stringify(error)));
        showToast('System Error: ' + error.message, 'error');
        isAuthProcessed = false;
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
            const confPass = confirmPasswordInput.value;

            if (password !== confPass) {
                showToast('Passwords do not match. Please blindly confirm your payload dynamically.', 'error');
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                return;
            }

            if (!fullName) {
                showToast('Please enter your full name natively.', 'error');
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                return;
            }

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: fullName },
                    emailRedirectTo: window.location.origin + '/login.html'
                }
            });

            if (error) {
                throw error;
            }

            if (data.user) {
                // Immediately save the real estate fields before they lose context into Postgres securely
                const { error: upsertError } = await supabase.from('users').upsert({
                    id: data.user.id,
                    full_name: fullName,
                    phone: phone,
                    role: 'buyer',
                    email: email
                });

                if (upsertError) {
                    throw upsertError;
                }

                // If Confirm Email is ON, Native Supabase natively traps the session issuance explicitly returning null
                if (!data.session) {
                    showToast('Success! Please securely check your email inbox to perfectly verify your account via Magic Link.', 'success');
                    authForm.reset();
                    document.getElementById('toggleBtn').click(); // Swap visually
                    submitBtn.disabled = false;
                    submitBtn.style.opacity = '1';
                    return;
                }

                // If confirmations are explicitly disabled, log them effortlessly in completely
                await handleSuccessfulAuth(data.user);
            }

        } else {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            // observer natively catches this and processes brilliantly
        }
    } catch (error) {
        let msg = error.message;
        if (error.status === 400 && error.message.includes('Invalid login')) {
            msg = 'Invalid email or password.';
        }
        if (error.message.includes('Email not confirmed')) {
            msg = 'Please check your email and click the confirmation link before attempting to sign in here.';
        }
        showToast(msg, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
    }
});
