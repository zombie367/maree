document.addEventListener('DOMContentLoaded', function() {
    // Update the attendance button click handler
    const showAttendanceBtn = document.querySelector('.show-attendance-btn');
    const attendanceBox = document.querySelector('.attendance-box');
    const attendanceOverlay = document.querySelector('.attendance-box-overlay');

    showAttendanceBtn.addEventListener('click', function() {
        attendanceBox.style.display = 'block';
        attendanceOverlay.style.display = 'block';
    });

    // Close attendance box when clicking outside
    attendanceOverlay.addEventListener('click', function() {
        attendanceBox.style.display = 'none';
        attendanceOverlay.style.display = 'none';
    });

    // Check if QR Code library is loaded
    if (typeof QRCode === 'undefined') {
        console.error('QR Code library not loaded!');
        document.getElementById('status-message').innerHTML = 'Error: QR Code generator failed to load';
        document.getElementById('status-message').className = 'error';
        return;
    }

    // Check localStorage availability
    function isLocalStorageAvailable() {
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return true;
        } catch(e) {
            document.getElementById('status-message').innerHTML = 'Error: Local storage not available. Please enable cookies.';
            document.getElementById('status-message').className = 'error';
            return false;
        }
    }

    if (!isLocalStorageAvailable()) {
        console.error('localStorage not available');
        return;
    }

    // Generate a unique identifier for the device
    function generateDeviceId() {
        const navigator_info = window.navigator.userAgent + window.navigator.platform;
        const screen_info = window.screen.height + '' + window.screen.width + window.screen.colorDepth;
        return btoa(navigator_info + screen_info);
    }

    // Generate QR Code
    function generateQRCode() {
        const qrcodeContainer = document.getElementById('qrcode');
        qrcodeContainer.style.display = 'none';
    }

    // Hide attendance form
    function hideAttendanceForm() {
        const form = document.querySelector('.attendance-form');
        if (form) {
            form.style.display = 'none';
        }
    }

    // Show QR code
    function showQRCode(name) {
        const qrcodeContainer = document.getElementById('qrcode');
        
        // Check if this user already has a QR code
        const existingQRCodes = JSON.parse(localStorage.getItem('qr_data_list') || '[]');
        const deviceId = generateDeviceId();
        const existingQR = existingQRCodes.find(qr => qr.deviceId === deviceId);
        
        // Store the name without encoding in qrData
        const qrData = existingQR || {
            guest: name,
            deviceId: deviceId,
            code: Math.floor(100000 + Math.random() * 900000),
            mapUrl: 'https://maps.app.goo.gl/J5SzdTuTRQyKbP5c6',
            timestamp: new Date().toISOString()
        };
        
        // Only store new QR data if it doesn't exist
        if (!existingQR) {
            existingQRCodes.push(qrData);
            localStorage.setItem('qr_data_list', JSON.stringify(existingQRCodes));
        }
        
        qrcodeContainer.innerHTML = '';
        qrcodeContainer.style.display = 'block';
        
        try {
            // Hide elements after voting
            const namesSection = document.querySelector('.names-section');
            const arabicText = document.querySelector('.arabic-text');
            const footerText = document.querySelector('.footer-text');
            const showAttendanceBtn = document.querySelector('.show-attendance-btn');
            
            if (namesSection) namesSection.style.display = 'none';
            if (arabicText) arabicText.style.display = 'none';
            if (footerText) footerText.style.display = 'none';
            if (showAttendanceBtn) showAttendanceBtn.style.display = 'none';

            // Create and show welcome box
            const overlay = document.createElement('div');
            overlay.className = 'welcome-box-overlay';
            
            const welcomeBox = document.createElement('div');
            welcomeBox.className = 'welcome-box';
            welcomeBox.innerHTML = `
                <span class="emoji">🎉</span>
                <h3>مرحباً بك، ${qrData.guest}</h3>
                <p>رمز QR الخاص بك جاهز</p>
                <button class="welcome-box-button">حسناً</button>
            `;
            
            document.body.appendChild(overlay);
            document.body.appendChild(welcomeBox);
            
            // Handle close button
            const closeButton = welcomeBox.querySelector('.welcome-box-button');
            closeButton.addEventListener('click', () => {
                overlay.remove();
                welcomeBox.remove();
                
                // Generate QR code after closing welcome message
                const wrapper = document.createElement('div');
                wrapper.className = 'qr-wrapper';
                
                const qrDiv = document.createElement('div');
                qrDiv.className = 'qr-code';
                wrapper.appendChild(qrDiv);

                // Create QR code data with only device ID and code
                const qrCodeData = {
                    d: qrData.deviceId,
                    c: qrData.code
                };

                new QRCode(qrDiv, {
                    text: JSON.stringify(qrCodeData),
                    width: 240,
                    height: 240,
                    colorDark: "#2c3e50",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H,
                    margin: 2
                });

                const codeOverlay = document.createElement('div');
                codeOverlay.className = 'name-overlay';
                codeOverlay.innerHTML = `${qrData.code}`;
                wrapper.appendChild(codeOverlay);
                
                const borderAnimation = document.createElement('div');
                borderAnimation.className = 'border-animation';
                const movingBorder = document.createElement('div');
                movingBorder.className = 'moving-border';
                borderAnimation.appendChild(movingBorder);
                wrapper.appendChild(borderAnimation);
                
                qrcodeContainer.appendChild(wrapper);
            });

        } catch (error) {
            console.error('QR Code generation failed:', error);
        }
    }

    // Show decline message
    function showDeclineMessage(name) {
        const qrcodeContainer = document.getElementById('qrcode');
        qrcodeContainer.style.display = 'none';

        document.getElementById('status-message').innerHTML = `
            <div class="decline-message">
                <div class="decline-icon">💌</div>
                <h3>نأسف لعدم تمكنك من الحضور</h3>
                <p>شكراً لإخبارنا</p>
            </div>
        `;

        // Hide additional sections
        const locationSection = document.querySelector('.location-section');
        const footerText = document.querySelector('.footer-text');
        const dateSection = document.querySelector('.date-section');
        const namesSection = document.querySelector('.names-section');
        const arabicText = document.querySelector('.arabic-text');
        const groom = document.querySelector('.groom');
        const bride = document.querySelector('.bride');
        
        if (locationSection) locationSection.style.display = 'none';
        if (footerText) footerText.style.display = 'none';
        if (dateSection) dateSection.style.display = 'none';
        if (namesSection) namesSection.style.display = 'none';
        if (arabicText) arabicText.style.display = 'none';
        if (groom) groom.style.display = 'none';
        if (bride) bride.style.display = 'none';
        
        // Hide the attendance button
        const showAttendanceBtn = document.querySelector('.show-attendance-btn');
        if (showAttendanceBtn) {
            showAttendanceBtn.style.display = 'none';
        }
    }

    // Add this function near the top of your script
    function showErrorAlert(message) {
        const errorAlert = document.querySelector('.error-alert');
        const errorOverlay = document.querySelector('.error-alert-overlay');
        const errorButton = document.querySelector('.error-alert-button');
        
        // Update message if provided
        if (message) {
            errorAlert.querySelector('h3').textContent = message;
        }
        
        errorAlert.style.display = 'block';
        errorOverlay.style.display = 'block';
        
        // Close alert when button is clicked
        errorButton.onclick = () => {
            errorAlert.style.display = 'none';
            errorOverlay.style.display = 'none';
        };
        
        // Close alert when clicking outside
        errorOverlay.onclick = () => {
            errorAlert.style.display = 'none';
            errorOverlay.style.display = 'none';
        };
    }

    // Handle attendance
    function handleAttendance(name, isAttending) {
        if (!name.trim()) {
            showErrorAlert('الرجاء إدخال اسمك');
            return;
        }

        // Hide the attendance box and overlay
        const attendanceBox = document.querySelector('.attendance-box');
        const attendanceOverlay = document.querySelector('.attendance-box-overlay');
        if (attendanceBox) attendanceBox.style.display = 'none';
        if (attendanceOverlay) attendanceOverlay.style.display = 'none';

        const response = {
            name: name,
            attending: isAttending,
            deviceId: generateDeviceId(),
            timestamp: new Date().toISOString()
        };

        // Store individual response
        localStorage.setItem('wedding_response', JSON.stringify(response));

        // Store in responses array
        let responses = JSON.parse(localStorage.getItem('wedding_responses') || '[]');
        responses = responses.filter(r => r.deviceId !== response.deviceId); // Remove existing if any
        responses.push(response);
        localStorage.setItem('wedding_responses', JSON.stringify(responses));

        if (isAttending) {
            showQRCode(name);
        } else {
            showDeclineMessage(name);
        }

        hideAttendanceForm();
    }

    // Load saved response
    function loadSavedResponse() {
        const savedResponse = localStorage.getItem('wedding_response');
        
        if (savedResponse) {
            const response = JSON.parse(savedResponse);
            
            const namesSection = document.querySelector('.names-section');
            const arabicText = document.querySelector('.arabic-text');
            const footerText = document.querySelector('.footer-text');
            
            if (namesSection) namesSection.style.display = 'none';
            if (arabicText) arabicText.style.display = 'none';
            if (footerText) footerText.style.display = 'none';

            if (response.attending) {
                showQRCode(response.name);
                hideAttendanceForm();
            } else {
                showDeclineMessage(response.name);
                hideAttendanceForm();
            }
            return true;
        }
        return false;
    }

    // Initialize
    if (!loadSavedResponse()) {
        const qrcodeContainer = document.getElementById('qrcode');
        qrcodeContainer.style.display = 'none';
    }

    // Event Listeners
    document.getElementById('confirmYes').addEventListener('click', () => {
        const name = document.getElementById('guestName').value;
        handleAttendance(name, true);
    });

    document.getElementById('confirmNo').addEventListener('click', () => {
        const name = document.getElementById('guestName').value;
        handleAttendance(name, false);
    });

    // Initially hide location section
    const locationSection = document.querySelector('.location-section');
    if (locationSection) {
        locationSection.style.display = 'none';
    }

    // Add this to your existing DOMContentLoaded event listener
    document.querySelector('.settings-btn').addEventListener('click', function() {
        window.location.href = 'admin.html';
    });
}); 