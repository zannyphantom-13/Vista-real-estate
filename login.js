// login.js

let isSignUpMode = false;
let pendingUser = null; 
let blockAuthObserver = false; // Natively blocks the global handler from aggressively bypassing manual OTP
let generatedOtp = null;
let pendingUserCache = null;

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

// Supabase Auth State Observer
supabase.auth.onAuthStateChange(async (event, session) => {
    // We heavily care about SIGNED_IN or INITIAL_SESSION events
    if (session && session.user && !pendingUser && !blockAuthObserver) {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            await handleSuccessfulAuth(session.user);
        }
    }
});

// Resend OTP manually triggered
document.getElementById('resendOtpBtn')?.addEventListener('click', () => {
    if(!pendingUserCache) return;
    generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    emailjs.send("service_4zp6vha", "template_tnpxirj", {
        user_name: pendingUserCache.user_metadata?.full_name || 'Vista User',
        user_email: pendingUserCache.email,
        property_title: "Account Verification Reset",
        property_url: window.location.origin,
        message: `Welcome back to Vista! Your new 6-digit Account Verification Code is: ${generatedOtp}`
    });
    showToast('A new code has been sent to your email.', 'success');
});

// Verify OTP payload locally
document.getElementById('verifyOtpBtn')?.addEventListener('click', async () => {
    const input = document.getElementById('otpInput').value.trim();
    if(input === generatedOtp) {
        showToast('Email verified successfully!', 'success');
        blockAuthObserver = false; // Relinquish UI freeze flag
        document.getElementById('otpSection').style.display = 'none';
        await handleSuccessfulAuth(pendingUserCache);
    } else {
        showToast('Invalid confirmation code. Please check your email.', 'error');
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
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if(error) throw error;
        showToast('Password reset link sent! Check your inbox.', 'success');
    } catch (error) {
        showToast(error.message, 'error');
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
        if(error) throw error;
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
            role: modalRole.value,
            full_name: pendingUser.user_metadata?.full_name || 'Vista User',
            email: pendingUser.email
        });
        
        if (error) throw error;
        
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
        // Did they use the email form to explicitly provide sign up data just now?
        if (explicitData) {
            const { error: upsertError } = await supabase.from('users').upsert(explicitData);
            if(upsertError) throw upsertError;
            
            showToast('Account created successfully!', 'success');
            setTimeout(() => window.location.href = 'admin.html', 1000);
            return;
        }

        // Fetch their public user profile
        const { data: userDoc, error } = await supabase.from('users').select('*').eq('id', user.id).single();
        
        if (error || !userDoc || !userDoc.phone || !userDoc.role) {
            // Unfinished profile -> Intercept and pop modal
            pendingUser = user;
            profileModal.style.display = 'flex';
            showToast('Please complete your profile to continue.', 'info');
        } else {
            // Profile is fully complete
            showToast('Welcome back!', 'success');
            setTimeout(() => window.location.href = 'admin.html', 1000);
        }
    } catch (error) {
        console.error('Handling auth data error:', error);
        alert('CRASH LOG: ' + (error.message || JSON.stringify(error)));
        showToast('System Error: ' + error.message, 'error');
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

            blockAuthObserver = true;

            const { data, error } = await supabase.auth.signUp({ 
                email, 
                password,
                options: { data: { full_name: fullName } } // Supabase magically handles basic creds
            });

            if (error) {
                blockAuthObserver = false;
                throw error;
            }
            
            if(data.user) {
                // Immediately save the real estate fields before they lose context
                const { error: upsertError } = await supabase.from('users').upsert({
                    id: data.user.id,
                    full_name: fullName,
                    phone: phone,
                    role: role,
                    email: email
                });
                
                if(upsertError) {
                    blockAuthObserver = false;
                    throw upsertError;
                }

                // Inject Custom EmailJS OTP System internally bypassing Magic Link rules
                generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
                pendingUserCache = data.user;

                // Transmit physically
                emailjs.send("service_4zp6vha", "template_tnpxirj", {
                    user_name: fullName,
                    user_email: email,
                    property_title: "Account Verification",
                    property_url: window.location.origin,
                    message: `Welcome to Vista! Your 6-digit Account Verification Code is: ${generatedOtp}`
                });

                // Overhaul specific DOM structures dynamically
                authForm.style.display = 'none';
                document.getElementById('googleBtn').style.display = 'none';
                const separators = document.querySelectorAll('.auth-toggle, hr, span');
                separators.forEach(el => {
                    if(el.textContent.includes('OR CONTINUE') || el.classList.contains('auth-toggle')) {
                        el.parentElement.style.display = 'none';
                    }
                });
                const authFooter = document.querySelector('.auth-footer');
                if(authFooter) authFooter.style.display = 'none';
                
                document.getElementById('otpSection').style.display = 'block';
                document.getElementById('otpEmailDisplay').textContent = email;
                
                showToast('Success! Verification code sent to your email.', 'success');
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                return;
            }

        } else {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            // observer catches this
        }
    } catch (error) {
        let msg = error.message;
        if (error.status === 400 && error.message.includes('Invalid login')) {
            msg = 'Invalid email or password.';
        }
        if (error.message.includes('Email not confirmed')) {
            msg = 'Please check your email and click the confirmation link before signing in.';
        }
        showToast(msg, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
    }
});
