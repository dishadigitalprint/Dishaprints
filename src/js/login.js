/**
 * Login Page with WhatsApp OTP Verification
 */

// Debug logging (set to false to disable detailed logs)
const DEBUG_MODE = true;
// DEMO MODE: Use test OTP "123456" for any phone number (disable for production)
const DEMO_MODE = true;
const DEMO_OTP = '123456';

function debugLog(message, data = null) {
    if (DEBUG_MODE) {
        if (data) {
            console.log(`🔍 [LOGIN] ${message}`, data);
        } else {
            console.log(`🔍 [LOGIN] ${message}`);
        }
    }
}

let currentPhone = '';
let currentName = '';
let currentEmail = '';
let generatedOTP = '';
let resendTimeout;
let resendCounter = 30;
let isSignUpMode = false;

document.addEventListener('DOMContentLoaded', function() {
    checkAuthMode();
    attachEventListeners();
    setupOTPInputs();
});

function checkAuthMode() {
    const urlParams = new URLSearchParams(window.location.search);
    isSignUpMode = urlParams.get('mode') === 'signup';
    
    updateAuthModeUI();
}

function updateAuthModeUI() {
    const authModeText = document.getElementById('authModeText');
    const authToggleText = document.getElementById('authToggleText');
    const authToggleBtn = document.getElementById('authToggleBtn');
    const nameField = document.getElementById('nameField');
    const fullNameInput = document.getElementById('fullName');
    
    if (isSignUpMode) {
        authModeText.textContent = 'Create your account';
        authToggleText.textContent = 'Already have an account?';
        authToggleBtn.textContent = 'Sign In';
        nameField.style.display = 'block';
        fullNameInput.required = true;
    } else {
        authModeText.textContent = 'Sign in to your account';
        authToggleText.textContent = 'New user?';
        authToggleBtn.textContent = 'Create an account';
        nameField.style.display = 'none';
        fullNameInput.required = false;
    }
}

function attachEventListeners() {
    // Phone form submission
    document.getElementById('phoneForm').addEventListener('submit', handlePhoneSubmit);
    
    // OTP form submission
    document.getElementById('otpForm').addEventListener('submit', handleOTPSubmit);
    
    // Resend OTP
    document.getElementById('resendOtpBtn').addEventListener('click', resendOTP);
    
    // Change number
    document.getElementById('changeNumberBtn').addEventListener('click', () => {
        document.getElementById('otpStep').classList.add('hidden');
        document.getElementById('phoneStep').classList.remove('hidden');
        clearOTPInputs();
    });
    
    // Auth mode toggle
    document.getElementById('authToggleBtn').addEventListener('click', () => {
        isSignUpMode = !isSignUpMode;
        const newUrl = isSignUpMode 
            ? 'login.html?mode=signup'
            : 'login.html';
        window.history.pushState({}, '', newUrl);
        updateAuthModeUI();
    });
}

async function handlePhoneSubmit(e) {
    e.preventDefault();
    
    const phoneInput = document.getElementById('phoneNumber');
    const nameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('emailAddress');
    const phone = phoneInput.value.trim();
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    
    // Validate phone number
    if (!whatsappService.validatePhoneNumber(phone)) {
        showToast('Please enter a valid 10-digit mobile number', 'error');
        phoneInput.focus();
        return;
    }
    
    if (!email || !email.includes('@')) {
        showToast('Please enter a valid email address', 'error');
        emailInput.focus();
        return;
    }
    
    // Only require name for sign up mode
    if (isSignUpMode && !name) {
        showToast('Please enter your full name', 'error');
        nameInput.focus();
        return;
    }
    
    currentPhone = phone;
    currentName = name || 'User'; // Default name for sign in
    currentEmail = email;
    
    debugLog('Starting OTP flow', { phone, name: currentName, email, mode: isSignUpMode ? 'signup' : 'signin' });
    
    // Show loading
    const btn = document.getElementById('sendOtpBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Sending OTP...';
    btn.disabled = true;
    
    try {
        // Generate OTP
        generatedOTP = DEMO_MODE ? DEMO_OTP : whatsappService.generateOTP();
        debugLog('OTP generated', { otp: generatedOTP, demoMode: DEMO_MODE });
        
        // Save OTP to Supabase database
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry
        
        const { data: otpData, error: otpError } = await supabaseClient
            .from('otp_verification')
            .insert([{
                phone: phone,
                otp: generatedOTP,
                expires_at: expiresAt.toISOString(),
                verified: false,
                attempts: 0
            }])
            .select();
        
        if (otpError) {
            debugLog('Error saving OTP to database', otpError);
            // Continue anyway - fallback to memory-based OTP
        } else {
            debugLog('OTP saved to database', otpData);
        }
        
        // Format phone for WhatsApp
        const formattedPhone = whatsappService.formatPhoneNumber(phone);
        
        // Send OTP via WhatsApp (skip in demo mode)
        let result = { success: true };
        if (!DEMO_MODE) {
            result = await whatsappService.sendOTP(formattedPhone, generatedOTP);
        } else {
            debugLog('⚠️ DEMO MODE: Skipping WhatsApp API call. Use OTP: ' + DEMO_OTP);
        }
        
        btn.innerHTML = originalText;
        btn.disabled = false;
        
        if (result.success) {
            debugLog('OTP sent successfully' + (DEMO_MODE ? ' (DEMO MODE)' : ' via WhatsApp'));
            
            // Show OTP step
            document.getElementById('phoneStep').classList.add('hidden');
            document.getElementById('otpStep').classList.remove('hidden');
            document.getElementById('sentToPhone').textContent = `+91 ${phone}`;
            
            // Show demo mode message
            if (DEMO_MODE) {
                const demoMsg = document.createElement('div');
                demoMsg.className = 'bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm mb-4';
                demoMsg.innerHTML = `<strong>Demo Mode:</strong> Use OTP <strong>${DEMO_OTP}</strong> to login`;
                document.querySelector('#otpStep .space-y-6').insertBefore(demoMsg, document.querySelector('.otp-inputs'));
            }
            
            // Focus first OTP input
            document.querySelector('.otp-input').focus();
            
            // Start resend timer
            startResendTimer();
            
            showToast(DEMO_MODE ? `Demo Mode: Use OTP ${DEMO_OTP}` : 'OTP sent to your WhatsApp!', 'success');
            
            // In development/testing, show OTP in console
            debugLog('OTP for testing', generatedOTP);
            
        } else {
            debugLog('Failed to send OTP via WhatsApp', result.error);
            showToast('Failed to send OTP. Please try again.', 'error');
            
            // Fallback: Show OTP on screen for development
            if (confirm(`Failed to send OTP via WhatsApp.\n\nFor testing, your OTP is: ${generatedOTP}\n\nClick OK to continue with verification.`)) {
                document.getElementById('phoneStep').classList.add('hidden');
                document.getElementById('otpStep').classList.remove('hidden');
                document.getElementById('sentToPhone').textContent = `+91 ${phone}`;
                document.querySelector('.otp-input').focus();
                startResendTimer();
            }
        }
    } catch (error) {
        debugLog('Error in handlePhoneSubmit', error);
        btn.innerHTML = originalText;
        btn.disabled = false;
        showToast('An error occurred. Please try again.', 'error');
    }
}

async function handleOTPSubmit(e) {
    e.preventDefault();
    
    // Get OTP from inputs
    const otpInputs = document.querySelectorAll('.otp-input');
    const enteredOTP = Array.from(otpInputs).map(input => input.value).join('');
    
    debugLog('OTP verification started', { enteredOTP, expectedOTP: generatedOTP });
    
    if (enteredOTP.length !== 6) {
        showToast('Please enter complete 6-digit OTP', 'error');
        return;
    }
    
    const btn = document.getElementById('verifyOtpBtn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Verifying...';
    btn.disabled = true;
    
    try {
        let isValidOTP = false;
        
        // In DEMO_MODE, always accept the demo OTP
        if (DEMO_MODE && enteredOTP === DEMO_OTP) {
            isValidOTP = true;
            debugLog('✅ DEMO MODE: OTP accepted', { enteredOTP });
        } else {
            // Verify OTP from Supabase database
            const { data: otpRecords, error: otpError } = await supabaseClient
                .from('otp_verification')
                .select('*')
                .eq('phone', currentPhone)
                .eq('otp', enteredOTP)
                .eq('verified', false)
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false })
                .limit(1);
            
            if (otpError) {
                debugLog('Error verifying OTP from database', otpError);
            } else {
                debugLog('OTP database check', { found: otpRecords?.length > 0 });
            }
            
            // Verify OTP (database or memory fallback)
            isValidOTP = (otpRecords && otpRecords.length > 0) || (enteredOTP === generatedOTP);
            
            debugLog('OTP validation result', { isValid: isValidOTP });
            
            // Mark OTP as verified in database
            if (isValidOTP && otpRecords && otpRecords.length > 0) {
                await supabaseClient
                    .from('otp_verification')
                    .update({ verified: true })
                    .eq('id', otpRecords[0].id);
                debugLog('OTP marked as verified in database');
            }
        }
        
        if (isValidOTP) {
            // ✅ SIMPLIFIED: Just check/create user in public.users table
            // Skip Supabase Auth for now - we'll use database sessions
            debugLog('Checking user in database', { email: currentEmail, phone: currentPhone });
            
            let existingUser = null;
            let userError = null;
            
            try {
                const result = await supabaseClient
                    .from('users')
                    .select('*')
                    .eq('email', currentEmail)
                    .eq('phone', currentPhone)
                    .maybeSingle(); // Use maybeSingle() instead of single() to avoid error if not found
                
                existingUser = result.data;
                userError = result.error;
                
                debugLog('User lookup result', { found: !!existingUser, error: userError });
            } catch (err) {
                debugLog('Error looking up user', err);
                userError = err;
            }
            
            let userId, userRole, userName;
            
            if (existingUser) {
                // User exists - sign in
                userId = existingUser.id;
                userRole = existingUser.role;
                userName = existingUser.name;
                
                // Update last login
                await supabaseClient
                    .from('users')
                    .update({ last_login: new Date().toISOString() })
                    .eq('id', userId);
                
                debugLog('✅ Existing user logged in', { userId, role: userRole });
            } else if (isSignUpMode) {
                // Create new user
                const { data: newUser, error: insertError } = await supabaseClient
                    .from('users')
                    .insert([{
                        phone: currentPhone,
                        name: currentName,
                        email: currentEmail,
                        phone_verified: true,
                        role: 'user',
                        last_login: new Date().toISOString()
                    }])
                    .select()
                    .single();
                
                if (insertError) {
                    debugLog('ERROR: Failed to create user', insertError);
                    throw new Error('Failed to create account. Please try again.');
                }
                
                userId = newUser.id;
                userRole = newUser.role;
                userName = newUser.name;
                
                debugLog('✅ New user created', { userId, role: userRole });
            } else {
                // Sign in mode but user doesn't exist
                throw new Error('No account found. Please create an account first.');
            }
            
            // Create session in localStorage (temporary approach)
            const userSession = {
                id: userId,
                phone: currentPhone,
                name: userName,
                email: currentEmail,
                role: userRole,
                loggedIn: true,
                phoneVerified: true,
                loginTime: new Date().toISOString()
            };
            
            localStorage.setItem('userSession', JSON.stringify(userSession));
            debugLog('✅ Session created in localStorage');
            
            // Log activity to database
            await supabaseClient
                .from('activity_log')
                .insert([{
                    user_id: userId,
                    phone: currentPhone,
                    name: userName,
                    action: 'User logged in',
                    page: 'login.html'
                }]);
            
            debugLog('Activity logged');
            
            // Log via activity logger (for WhatsApp notification)
            if (typeof activityLogger !== 'undefined') {
                await activityLogger.logLogin();
                debugLog('WhatsApp notification triggered');
            }
            
            // Show success
            showToast('Login successful!', 'success');
            debugLog('✅ Login complete, redirecting...');
            
            // Redirect based on user role
            setTimeout(() => {
                const returnUrl = new URLSearchParams(window.location.search).get('return');
                let redirectUrl;
                
                if (returnUrl) {
                    redirectUrl = returnUrl;
                } else if (userRole === 'admin') {
                    redirectUrl = 'admin-dashboard.html';
                    debugLog('Admin user detected, redirecting to admin dashboard');
                } else {
                    redirectUrl = 'order.html';
                }
                
                debugLog('Redirecting to', redirectUrl);
                window.location.href = redirectUrl;
            }, 1000);
            
        } else {
            // Wrong OTP
            debugLog('❌ Invalid OTP entered');
            btn.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Verify OTP';
            btn.disabled = false;
            showToast('Invalid OTP. Please try again.', 'error');
            clearOTPInputs();
            document.querySelector('.otp-input').focus();
        }
    } catch (error) {
        debugLog('ERROR in OTP verification', error);
        btn.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Verify OTP';
        btn.disabled = false;
        showToast('Verification failed. Please try again.', 'error');
    }
}

async function resendOTP() {
    if (resendCounter > 0) {
        showToast(`Please wait ${resendCounter} seconds before resending`, 'warning');
        return;
    }
    
    const btn = document.getElementById('resendOtpBtn');
    btn.disabled = true;
    
    // Generate new OTP
    generatedOTP = whatsappService.generateOTP();
    
    // Format phone for WhatsApp
    const formattedPhone = whatsappService.formatPhoneNumber(currentPhone);
    
    // Send OTP via WhatsApp
    const result = await whatsappService.sendOTP(formattedPhone, generatedOTP);
    
    btn.disabled = false;
    
    if (result.success) {
        showToast('New OTP sent to your WhatsApp!', 'success');
        debugLog('New OTP sent', generatedOTP);
        clearOTPInputs();
        startResendTimer();
    } else {
        showToast('Failed to resend OTP. Please try again.', 'error');
        debugLog('Failed to resend OTP', result.error);
        // Show OTP in alert for development
        alert(`Failed to send OTP via WhatsApp.\n\nFor testing, your new OTP is: ${generatedOTP}`);
        clearOTPInputs();
        startResendTimer();
    }
}

function setupOTPInputs() {
    const inputs = document.querySelectorAll('.otp-input');
    
    inputs.forEach((input, index) => {
        // Auto-focus next input
        input.addEventListener('input', function(e) {
            if (this.value.length === 1) {
                if (index < inputs.length - 1) {
                    inputs[index + 1].focus();
                } else {
                    // All inputs filled, auto-submit
                    document.getElementById('otpForm').dispatchEvent(new Event('submit'));
                }
            }
        });
        
        // Handle backspace
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !this.value && index > 0) {
                inputs[index - 1].focus();
            }
        });
        
        // Only allow numbers
        input.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
        
        // Handle paste
        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text').trim();
            if (/^\d{6}$/.test(pastedData)) {
                pastedData.split('').forEach((char, i) => {
                    if (inputs[i]) inputs[i].value = char;
                });
                inputs[5].focus();
            }
        });
    });
}

function clearOTPInputs() {
    document.querySelectorAll('.otp-input').forEach(input => input.value = '');
}

function startResendTimer() {
    resendCounter = 30;
    const timerEl = document.getElementById('resendTimer');
    const resendBtn = document.getElementById('resendOtpBtn');
    
    resendBtn.disabled = true;
    
    resendTimeout = setInterval(() => {
        resendCounter--;
        timerEl.textContent = resendCounter;
        
        if (resendCounter <= 0) {
            clearInterval(resendTimeout);
            resendBtn.disabled = false;
            timerEl.parentElement.style.display = 'none';
        }
    }, 1000);
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-6 right-6 z-50 px-6 py-4 rounded-lg shadow-lg text-white font-medium transition-all duration-300`;
    
    const colors = {
        'info': 'bg-info-600',
        'success': 'bg-accentA-600',
        'error': 'bg-danger-600',
        'warning': 'bg-accentB-600'
    };
    
    toast.classList.add(colors[type] || colors.info);
    
    const icons = {
        'info': 'fa-info-circle',
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'warning': 'fa-exclamation-triangle'
    };
    
    toast.innerHTML = `
        <div class="flex items-center gap-3">
            <i class="fas ${icons[type]} text-xl"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

debugLog('Login page initialized', { debugMode: DEBUG_MODE });

