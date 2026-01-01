// VEXA Digital - Booking System
// Complete booking flow with form validation, calendar, payment integration

class VEXABookingSystem {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.bookingData = {};
        this.selectedSlot = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadAvailableSlots();
    }

    setupEventListeners() {
        // Step navigation
        document.querySelectorAll('[data-next-step]').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleNextStep(e));
        });

        document.querySelectorAll('[data-prev-step]').forEach(btn => {
            btn.addEventListener('click', (e) => this.handlePrevStep(e));
        });

        // Form validation on input
        document.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(input => {
            input.addEventListener('blur', (e) => this.validateField(e.target));
            input.addEventListener('input', (e) => this.clearError(e.target));
        });
    }

    // STEP 1: Pre-Qualification Form
    validateStep1() {
        const requiredFields = [
            'fullName',
            'email',
            'phone',
            'orgName',
            'orgType',
            'teamSize',
            'primaryGame',
            'monthlyRevenue',
            'mainChallenge',
            'referralSource'
        ];

        let isValid = true;

        requiredFields.forEach(fieldName => {
            const field = document.getElementById(fieldName);
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        // Special validation for main challenge (min 200 chars)
        const challengeField = document.getElementById('mainChallenge');
        if (challengeField.value.length < 200) {
            this.showError(challengeField, 'Please provide at least 200 characters describing your challenge');
            isValid = false;
        }

        if (isValid) {
            // Save data
            this.bookingData.step1 = {
                fullName: document.getElementById('fullName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                orgName: document.getElementById('orgName').value,
                orgType: document.getElementById('orgType').value,
                teamSize: document.getElementById('teamSize').value,
                primaryGame: document.getElementById('primaryGame').value,
                monthlyRevenue: document.getElementById('monthlyRevenue').value,
                mainChallenge: document.getElementById('mainChallenge').value,
                referralSource: document.getElementById('referralSource').value
            };
        }

        return isValid;
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name || field.id;

        // Clear previous error
        this.clearError(field);

        // Required field check
        if (field.hasAttribute('required') && !value) {
            this.showError(field, 'This field is required');
            return false;
        }

        // Email validation
        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                this.showError(field, 'Please enter a valid email address');
                return false;
            }
        }

        // Phone validation (Indian format)
        if (fieldName === 'phone' && value) {
            const phoneRegex = /^[+]?[0-9]{10,15}$/;
            if (!phoneRegex.test(value.replace(/\s/g, ''))) {
                this.showError(field, 'Please enter a valid phone number');
                return false;
            }
        }

        return true;
    }

    showError(field, message) {
        field.classList.add('error');
        const errorDiv = field.parentElement.querySelector('.form-error') || document.createElement('div');
        errorDiv.className = 'form-error';
        errorDiv.textContent = message;
        if (!field.parentElement.querySelector('.form-error')) {
            field.parentElement.appendChild(errorDiv);
        }
    }

    clearError(field) {
        field.classList.remove('error');
        const errorDiv = field.parentElement.querySelector('.form-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    // STEP 2: Calendar Selection
    async loadAvailableSlots() {
        // This will be connected to backend
        // For now, generate next 14 days with available slots
        const calendar = document.getElementById('calendar');
        if (!calendar) return;

        const today = new Date();
        const slots = [];

        // Generate slots for next 14 days (skip weekends for demo)
        for (let i = 1; i <= 14; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            
            // Skip weekends
            if (date.getDay() === 0 || date.getDay() === 6) continue;

            // Generate time slots (10 AM - 6 PM, 30-min intervals)
            const timeSlots = [];
            for (let hour = 10; hour < 18; hour++) {
                for (let min = 0; min < 60; min += 30) {
                    timeSlots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
                }
            }

            slots.push({
                date: date,
                times: timeSlots
            });
        }

        this.renderCalendar(slots);
    }

    renderCalendar(slots) {
        const calendar = document.getElementById('calendar');
        if (!calendar) return;

        calendar.innerHTML = '';

        slots.forEach(slot => {
            const dayCard = document.createElement('div');
            dayCard.className = 'calendar-day-card';
            
            const dateStr = slot.date.toLocaleDateString('en-IN', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            });

            dayCard.innerHTML = `
                <div class="calendar-date">${dateStr}</div>
                <div class="calendar-times" id="times-${slot.date.toISOString().split('T')[0]}">
                    ${slot.times.map(time => `
                        <button class="time-slot" data-date="${slot.date.toISOString()}" data-time="${time}">
                            ${time}
                        </button>
                    `).join('')}
                </div>
            `;

            calendar.appendChild(dayCard);
        });

        // Add click handlers to time slots
        document.querySelectorAll('.time-slot').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectTimeSlot(e));
        });
    }

    selectTimeSlot(e) {
        // Remove previous selection
        document.querySelectorAll('.time-slot').forEach(btn => {
            btn.classList.remove('selected');
        });

        // Mark as selected
        e.target.classList.add('selected');

        const date = new Date(e.target.dataset.date);
        const time = e.target.dataset.time;

        this.selectedSlot = {
            date: date,
            time: time,
            datetime: new Date(`${date.toISOString().split('T')[0]}T${time}:00`)
        };

        // Enable next button
        document.querySelector('[data-next-step="3"]').disabled = false;
    }

    validateStep2() {
        if (!this.selectedSlot) {
            alert('Please select a date and time for your consultation');
            return false;
        }

        this.bookingData.step2 = this.selectedSlot;
        return true;
    }

    // STEP 3: Booking Summary
    renderBookingSummary() {
        const summary = document.getElementById('bookingSummary');
        if (!summary) return;

        const data = this.bookingData;
        const dateStr = data.step2.date.toLocaleDateString('en-IN', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        summary.innerHTML = `
            <div class="summary-section">
                <h3>Personal Details</h3>
                <p><strong>Name:</strong> ${data.step1.fullName}</p>
                <p><strong>Email:</strong> ${data.step1.email}</p>
                <p><strong>Phone:</strong> ${data.step1.phone}</p>
            </div>

            <div class="summary-section">
                <h3>Organization Details</h3>
                <p><strong>Organization:</strong> ${data.step1.orgName}</p>
                <p><strong>Type:</strong> ${data.step1.orgType}</p>
                <p><strong>Team Size:</strong> ${data.step1.teamSize}</p>
                <p><strong>Primary Game:</strong> ${data.step1.primaryGame}</p>
            </div>

            <div class="summary-section">
                <h3>Consultation Details</h3>
                <p><strong>Date:</strong> ${dateStr}</p>
                <p><strong>Time:</strong> ${data.step2.time} IST</p>
                <p><strong>Duration:</strong> 30-45 minutes</p>
                <p><strong>Platform:</strong> Google Meet</p>
            </div>

            <div class="summary-section summary-price">
                <h3>Payment</h3>
                <p class="price-amount">₹3,000</p>
                <p class="price-note">Consultation fee (adjusted if you proceed with larger services)</p>
            </div>
        `;
    }

    validateStep3() {
        const termsCheckbox = document.getElementById('termsAccepted');
        if (!termsCheckbox.checked) {
            alert('Please accept the terms and conditions to proceed');
            return false;
        }

        this.bookingData.step3 = {
            termsAccepted: true,
            acceptedAt: new Date().toISOString()
        };

        return true;
    }

    // STEP 4: Payment
    async initiatePayment() {
        // Show loading
        this.showLoading('Processing payment...');

        try {
            // In production, this will call your backend to create Razorpay order
            // For now, simulate payment
            
            // Razorpay integration code will go here
            const options = {
                key: 'YOUR_RAZORPAY_KEY_ID', // Will be replaced with actual key
                amount: 300000, // ₹3,000 in paise
                currency: 'INR',
                name: 'VEXA Digital',
                description: 'Consultation Booking',
                image: '/images/logo.svg',
                handler: (response) => {
                    this.handlePaymentSuccess(response);
                },
                prefill: {
                    name: this.bookingData.step1.fullName,
                    email: this.bookingData.step1.email,
                    contact: this.bookingData.step1.phone
                },
                theme: {
                    color: '#FF6B35'
                }
            };

            // const rzp = new Razorpay(options);
            // rzp.open();

            // For demo, simulate success after 2 seconds
            setTimeout(() => {
                this.handlePaymentSuccess({
                    razorpay_payment_id: 'demo_' + Date.now(),
                    razorpay_order_id: 'order_demo_' + Date.now()
                });
            }, 2000);

        } catch (error) {
            this.hideLoading();
            this.showError(null, 'Payment failed. Please try again.');
            console.error('Payment error:', error);
        }
    }

    async handlePaymentSuccess(paymentResponse) {
        this.bookingData.payment = {
            paymentId: paymentResponse.razorpay_payment_id,
            orderId: paymentResponse.razorpay_order_id,
            amount: 3000,
            status: 'success',
            paidAt: new Date().toISOString()
        };

        // Save booking to database
        await this.saveBooking();

        // Send confirmation email
        await this.sendConfirmationEmail();

        // Redirect to confirmation page
        this.showConfirmation();
    }

    async saveBooking() {
        // This will save to Firebase
        // For now, save to localStorage
        const bookingId = 'VEXA' + Date.now();
        this.bookingData.bookingId = bookingId;
        this.bookingData.status = 'confirmed';
        this.bookingData.createdAt = new Date().toISOString();

        localStorage.setItem('lastBooking', JSON.stringify(this.bookingData));
        
        // In production, this will call Firebase
        // await firebase.firestore().collection('bookings').doc(bookingId).set(this.bookingData);
    }

    async sendConfirmationEmail() {
        // This will trigger backend email function
        // For now, just log
        console.log('Sending confirmation email to:', this.bookingData.step1.email);
        
        // In production, this will call Cloud Function
        // await fetch('/api/send-confirmation', {
        //     method: 'POST',
        //     body: JSON.stringify(this.bookingData)
        // });
    }

    showConfirmation() {
        this.hideLoading();
        window.location.href = `/confirmation.html?booking=${this.bookingData.bookingId}`;
    }

    // Navigation
    handleNextStep(e) {
        e.preventDefault();
        const nextStep = parseInt(e.target.dataset.nextStep);

        // Validate current step
        let isValid = false;
        switch(this.currentStep) {
            case 1:
                isValid = this.validateStep1();
                break;
            case 2:
                isValid = this.validateStep2();
                break;
            case 3:
                isValid = this.validateStep3();
                if (isValid) {
                    this.initiatePayment();
                    return; // Don't navigate, payment will handle it
                }
                break;
        }

        if (!isValid) return;

        // Navigate to next step
        this.goToStep(nextStep);
    }

    handlePrevStep(e) {
        e.preventDefault();
        const prevStep = parseInt(e.target.dataset.prevStep);
        this.goToStep(prevStep);
    }

    goToStep(stepNumber) {
        // Hide current step
        document.querySelector(`[data-step="${this.currentStep}"]`).classList.remove('active');

        // Show new step
        document.querySelector(`[data-step="${stepNumber}"]`).classList.add('active');

        // Update progress
        this.updateProgress(stepNumber);

        // Special handling for step 3 (summary)
        if (stepNumber === 3) {
            this.renderBookingSummary();
        }

        this.currentStep = stepNumber;

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    updateProgress(step) {
        const progress = (step / this.totalSteps) * 100;
        document.querySelector('.progress-bar-fill').style.width = `${progress}%`;
        
        // Update step indicators
        document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
            if (index < step) {
                indicator.classList.add('completed');
                indicator.classList.remove('active');
            } else if (index === step - 1) {
                indicator.classList.add('active');
                indicator.classList.remove('completed');
            } else {
                indicator.classList.remove('active', 'completed');
            }
        });
    }

    showLoading(message = 'Loading...') {
        const loader = document.getElementById('loadingOverlay');
        if (loader) {
            loader.querySelector('.loading-message').textContent = message;
            loader.classList.remove('hidden');
        }
    }

    hideLoading() {
        const loader = document.getElementById('loadingOverlay');
        if (loader) {
            loader.classList.add('hidden');
        }
    }
}

// Initialize booking system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('bookingForm')) {
        window.bookingSystem = new VEXABookingSystem();
    }
});