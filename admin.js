document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const mainMenu = document.getElementById('mainMenu');
    const scannerSection = document.getElementById('scannerSection');
    const deviceListSection = document.getElementById('deviceListSection');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Admin credentials
    const ADMIN_USERNAME = 'admin';
    const ADMIN_PASSWORD = 'admin123';

    // Store scanned devices
    let scannedDevices = JSON.parse(localStorage.getItem('scanned_devices') || '[]');
    let html5QrcodeScanner;

    // Check if already logged in
    if (sessionStorage.getItem('adminLoggedIn')) {
        showMainMenu();
    }

    // Login handler
    loginBtn.addEventListener('click', () => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            sessionStorage.setItem('adminLoggedIn', 'true');
            showMainMenu();
        } else {
            alert('اسم المستخدم أو كلمة المرور غير صحيحة');
        }
    });

    // Logout handler
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('adminLoggedIn');
        loginForm.style.display = 'block';
        mainMenu.style.display = 'none';
        scannerSection.style.display = 'none';
        deviceListSection.style.display = 'none';
        logoutBtn.style.display = 'none';
        if (html5QrcodeScanner) {
            html5QrcodeScanner.clear();
        }
    });

    function showMainMenu() {
        loginForm.style.display = 'none';
        mainMenu.style.display = 'block';
        scannerSection.style.display = 'none';
        deviceListSection.style.display = 'none';
        logoutBtn.style.display = 'block';
    }

    // Add to global scope for onclick handlers
    window.showSection = async function(sectionId) {
        // Hide all sections
        loginForm.style.display = 'none';
        mainMenu.style.display = 'none';
        scannerSection.style.display = 'none';
        deviceListSection.style.display = 'none';

        // Show requested section
        document.getElementById(sectionId).style.display = 'block';
        logoutBtn.style.display = 'block';

        if (sectionId === 'scannerSection') {
            await initializeCamera();
        } else if (sectionId === 'deviceListSection') {
            showTab('created');
            updateDeviceList();
        }
    };

    // Update the camera initialization functions
    async function checkCameraPermission() {
        try {
            // First check if getUserMedia is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('كاميرا الويب غير مدعومة في هذا المتصفح');
            }

            // Try to get camera permission
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Prefer back camera
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            // If we get here, permission was granted
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (err) {
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                throw new Error('تم رفض الوصول للكاميرا');
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                throw new Error('لم يتم العثور على كاميرا');
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                throw new Error('الكاميرا مشغولة');
            } else {
                throw new Error(err.message || 'حدث خطأ غير متوقع في الوصول للكاميرا');
            }
        }
    }

    async function initializeCamera() {
        const scanResult = document.getElementById('scanResult');
        try {
            // Check camera permission first
            await checkCameraPermission();

            // If we got here, we have permission. Now initialize the scanner
            if (html5QrcodeScanner) {
                html5QrcodeScanner.clear();
            }

            // Create scanner with mobile-friendly config
            html5QrcodeScanner = new Html5QrcodeScanner(
                "reader",
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                    showTorchButtonIfSupported: true,
                    showZoomSliderIfSupported: true,
                    defaultZoomValueIfSupported: 2,
                    videoConstraints: {
                        facingMode: 'environment',
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                }
            );

            // Render scanner
            html5QrcodeScanner.render(onScanSuccess, onScanFailure);

        } catch (err) {
            let errorMessage = '';
            
            switch(err.message) {
                case 'تم رفض الوصول للكاميرا':
                    errorMessage = `
                        <div class="error-scan">
                            <h3>تم رفض الوصول للكاميرا</h3>
                            <p>يرجى اتباع الخطوات التالية:</p>
                            <ol style="text-align: right; margin: 10px 20px;">
                                <li>انقر على أيقونة القفل/الكاميرا في شريط العنوان</li>
                                <li>اختر "السماح" للوصول إلى الكاميرا</li>
                                <li>قم بتحديث الصفحة</li>
                            </ol>
                            <button onclick="window.location.reload()" class="admin-btn" style="margin-top: 15px;">
                                تحديث الصفحة
                            </button>
                        </div>
                    `;
                    break;
                case 'لم يتم العثور على كاميرا':
                    errorMessage = `
                        <div class="error-scan">
                            <h3>لم يتم العثور على كاميرا</h3>
                            <p>تأكد من:</p>
                            <ul style="text-align: right; margin: 10px 20px;">
                                <li>وجود كاميرا في جهازك</li>
                                <li>أن الكاميرا تعمل بشكل صحيح</li>
                                <li>عدم استخدام الكاميرا من قبل تطبيق آخر</li>
                            </ul>
                            <button onclick="window.location.reload()" class="admin-btn" style="margin-top: 15px;">
                                إعادة المحاولة
                            </button>
                        </div>
                    `;
                    break;
                case 'الكاميرا مشغولة':
                    errorMessage = `
                        <div class="error-scan">
                            <h3>الكاميرا مشغولة</h3>
                            <p>يرجى:</p>
                            <ul style="text-align: right; margin: 10px 20px;">
                                <li>إغلاق أي تطبيقات أخرى تستخدم الكاميرا</li>
                                <li>إعادة تحميل الصفحة</li>
                            </ul>
                            <button onclick="window.location.reload()" class="admin-btn" style="margin-top: 15px;">
                                إعادة المحاولة
                            </button>
                        </div>
                    `;
                    break;
                default:
                    errorMessage = `
                        <div class="error-scan">
                            <h3>حدث خطأ غير متوقع</h3>
                            <p>${err.message}</p>
                            <button onclick="window.location.reload()" class="admin-btn" style="margin-top: 15px;">
                                إعادة المحاولة
                            </button>
                        </div>
                    `;
            }
            
            scanResult.innerHTML = errorMessage;
            console.error('Camera initialization failed:', err);
        }
    }

    // Update the initializeScanner function to use the new camera initialization
    function initializeScanner() {
        initializeCamera().catch(err => {
            const scanResult = document.getElementById('scanResult');
            scanResult.innerHTML = `
                <div class="error-scan">
                    <h3>فشل في تهيئة الماسح الضوئي</h3>
                    <p>${err.message}</p>
                    <button onclick="window.location.reload()" class="admin-btn" style="margin-top: 15px;">
                        إعادة المحاولة
                    </button>
                </div>
            `;
        });
    }

    function onScanSuccess(decodedText, decodedResult) {
        try {
            // First validate that we have a decodedText
            if (!decodedText) {
                throw new Error('رمز QR غير صالح أو غير مقروء');
            }

            let qrData;
            try {
                qrData = JSON.parse(decodedText);
            } catch (parseError) {
                throw new Error('تنسيق رمز QR غير صحيح');
            }

            // Validate QR data structure
            if (!qrData.d || !qrData.c) {
                throw new Error('بيانات رمز QR غير صالحة');
            }

            const scanResult = document.getElementById('scanResult');
            
            // Get device ID and code from QR
            const deviceId = qrData.d;
            const code = qrData.c;
            
            // Find the guest info from stored data
            const createdDevices = JSON.parse(localStorage.getItem('qr_data_list') || '[]');
            const guestData = createdDevices.find(d => d.deviceId === deviceId);
            
            if (!guestData) {
                scanResult.innerHTML = `
                    <div class="error-scan">
                        <h3>رمز QR غير صالح</h3>
                        <p>لم يتم العثور على بيانات الضيف</p>
                    </div>`;
                return;
            }
            
            // Check if device is already scanned
            const existingDevice = scannedDevices.find(d => d.deviceId === deviceId);
            
            if (existingDevice) {
                scanResult.innerHTML = `
                    <div class="error-scan">
                        <h3>تم المسح مسبقاً</h3>
                        <p>تم مسح هذا الرمز من قبل</p>
                        <div class="device-info">
                            <p>رقم الجهاز: ${code}</p>
                            <p>اسم الضيف: ${guestData.guest}</p>
                            <p>وقت المسح السابق: ${new Date(existingDevice.scannedAt).toLocaleString('ar-SA')}</p>
                        </div>
                    </div>
                `;
            } else {
                // Add to scanned devices
                scannedDevices.push({
                    deviceId: deviceId,
                    code: code,
                    guest: guestData.guest,
                    scannedAt: new Date().toISOString()
                });
                localStorage.setItem('scanned_devices', JSON.stringify(scannedDevices));
                
                scanResult.innerHTML = `
                    <div class="success-scan">
                        <h3>تشرفنا بحضوركم</h3>
                        <p>مرحباً بك، ${guestData.guest}</p>
                        <div class="thank-you-message">شكراً لحضورك الحفل</div>
                        <div class="device-info">
                            <p>رقم الجهاز: ${code}</p>
                        </div>
                        <div class="timestamp">
                            ${new Date().toLocaleString('ar-SA')}
                        </div>
                    </div>
                `;
                updateDeviceList();
            }
        } catch (error) {
            const scanResult = document.getElementById('scanResult');
            scanResult.innerHTML = `
                <div class="error-scan">
                    <h3>خطأ في قراءة رمز QR</h3>
                    <p>${error.message}</p>
                    <p class="scan-tip">تأكد من أن الكاميرا موجهة بشكل صحيح نحو رمز QR</p>
                </div>
            `;
            console.error('QR Scan error:', error);
        }
    }

    function updateDeviceList() {
        const createdDevices = JSON.parse(localStorage.getItem('qr_data_list') || '[]');
        const scannedDevices = JSON.parse(localStorage.getItem('scanned_devices') || '[]');
        const allResponses = JSON.parse(localStorage.getItem('wedding_responses') || '[]');
        const declinedGuests = allResponses.filter(r => !r.attending);

        // Update counts
        document.getElementById('createdCount').textContent = createdDevices.length;
        document.getElementById('scannedCount').textContent = scannedDevices.length;
        document.getElementById('declinedCount').textContent = declinedGuests.length;

        // Update Created QR Codes List
        const createdListContainer = document.getElementById('createdQRList');
        if (createdListContainer) {
            let createdHtml = '';
            if (createdDevices.length === 0) {
                createdHtml = '<p class="empty-message">لا توجد دعوات منشأة</p>';
            } else {
                createdHtml = '<ul class="device-list">';
                createdDevices.forEach(device => {
                    const scannedDevice = scannedDevices.find(d => d.deviceId === device.deviceId);
                    createdHtml += `
                        <li class="device-item">
                            <div class="device-details">
                                <p>الضيف: ${device.guest}</p>
                                <p>رقم الجهاز: ${device.code}</p>
                                <p>وقت إنشاء QR Code: ${new Date(device.timestamp).toLocaleString('ar-SA')}</p>
                                ${scannedDevice ? 
                                    `<p>وقت الدخول للموقع: ${new Date(scannedDevice.scannedAt).toLocaleString('ar-SA')}</p>` 
                                    : ''
                                }
                                <p class="status-tag ${scannedDevice ? 'status-attended' : 'status-pending'}">
                                    ${scannedDevice ? '✓ تم الحضور' : '⏳ في الانتظار'}
                                </p>
                            </div>
                            <button onclick="resetCreatedDevice('${device.deviceId}')" class="reset-device-btn">
                                إعادة تعيين
                            </button>
                        </li>
                    `;
                });
                createdHtml += '</ul>';
            }
            createdListContainer.innerHTML = createdHtml;
        }

        // Update Scanned Devices List
        const scannedListContainer = document.getElementById('scannedDeviceList');
        if (scannedListContainer) {
            let scannedHtml = '';
            if (scannedDevices.length === 0) {
                scannedHtml = '<p class="empty-message">لا يوجد ضيوف تم مسح QR Code الخاص بهم</p>';
            } else {
                scannedHtml = '<ul class="device-list">';
                scannedDevices.forEach(device => {
                    const createdDevice = createdDevices.find(d => d.deviceId === device.deviceId);
                    scannedHtml += `
                        <li class="device-item">
                            <div class="device-details">
                                <p>الضيف: ${device.guest}</p>
                                <p>رقم الجهاز: ${device.code}</p>
                                <p>وقت إنشاء QR Code: ${createdDevice ? new Date(createdDevice.timestamp).toLocaleString('ar-SA') : 'غير متوفر'}</p>
                                <p>وقت الحضور: ${new Date(device.scannedAt).toLocaleString('ar-SA')}</p>
                                <p class="status-tag status-attended">✓ تم الحضور</p>
                            </div>
                            <button onclick="resetScannedDevice('${device.deviceId}')" class="reset-device-btn">
                                إعادة تعيين
                            </button>
                        </li>
                    `;
                });
                scannedHtml += '</ul>';
            }
            scannedListContainer.innerHTML = scannedHtml;
        }

        // Update Declined Guests List
        const declinedListContainer = document.getElementById('declinedList');
        if (declinedListContainer) {
            let declinedHtml = '';
            if (declinedGuests.length === 0) {
                declinedHtml = '<p class="empty-message">لا يوجد ضيوف اعتذروا عن الحضور</p>';
            } else {
                declinedHtml = '<ul class="device-list">';
                declinedGuests.forEach(guest => {
                    declinedHtml += `
                        <li class="device-item">
                            <div class="device-details">
                                <p>الضيف: ${guest.name}</p>
                                <p>وقت الاعتذار: ${new Date(guest.timestamp).toLocaleString('ar-SA')}</p>
                                <p class="status-tag status-declined">✗ اعتذر عن الحضور</p>
                            </div>
                            <button onclick="resetDeclinedGuest('${guest.deviceId}')" class="reset-device-btn">
                                إعادة تعيين
                            </button>
                        </li>
                    `;
                });
                declinedHtml += '</ul>';
            }
            declinedListContainer.innerHTML = declinedHtml;
        }
    }

    // Update the reset functions
    window.resetCreatedDevice = function(deviceId) {
        const resetAlert = document.querySelector('.device-reset-alert');
        const resetOverlay = document.querySelector('.device-reset-overlay');
        const confirmBtn = resetAlert.querySelector('.confirm');
        const cancelBtn = resetAlert.querySelector('.cancel');
        
        resetAlert.style.display = 'block';
        resetOverlay.style.display = 'block';
        
        confirmBtn.onclick = function() {
            // Remove from QR data list
            let qrDevices = JSON.parse(localStorage.getItem('qr_data_list') || '[]');
            qrDevices = qrDevices.filter(d => d.deviceId !== deviceId);
            localStorage.setItem('qr_data_list', JSON.stringify(qrDevices));

            // Remove from wedding response
            const response = JSON.parse(localStorage.getItem('wedding_response') || '{}');
            if (response.deviceId === deviceId) {
                localStorage.removeItem('wedding_response');
            }

            // Remove from scanned devices if exists
            let scannedDevices = JSON.parse(localStorage.getItem('scanned_devices') || '[]');
            scannedDevices = scannedDevices.filter(d => d.deviceId !== deviceId);
            localStorage.setItem('scanned_devices', JSON.stringify(scannedDevices));

            updateDeviceList();
            resetAlert.style.display = 'none';
            resetOverlay.style.display = 'none';
        };
        
        cancelBtn.onclick = function() {
            resetAlert.style.display = 'none';
            resetOverlay.style.display = 'none';
        };
        
        resetOverlay.onclick = function() {
            resetAlert.style.display = 'none';
            resetOverlay.style.display = 'none';
        };
    };

    window.resetScannedDevice = function(deviceId) {
        const resetAlert = document.querySelector('.device-reset-alert');
        const resetOverlay = document.querySelector('.device-reset-overlay');
        const confirmBtn = resetAlert.querySelector('.confirm');
        const cancelBtn = resetAlert.querySelector('.cancel');
        
        resetAlert.style.display = 'block';
        resetOverlay.style.display = 'block';
        
        confirmBtn.onclick = function() {
            // Remove from scanned devices
            let scannedDevices = JSON.parse(localStorage.getItem('scanned_devices') || '[]');
            scannedDevices = scannedDevices.filter(d => d.deviceId !== deviceId);
            localStorage.setItem('scanned_devices', JSON.stringify(scannedDevices));

            updateDeviceList();
            resetAlert.style.display = 'none';
            resetOverlay.style.display = 'none';
        };
        
        cancelBtn.onclick = function() {
            resetAlert.style.display = 'none';
            resetOverlay.style.display = 'none';
        };
        
        resetOverlay.onclick = function() {
            resetAlert.style.display = 'none';
            resetOverlay.style.display = 'none';
        };
    };

    window.resetDeclinedGuest = function(deviceId) {
        const resetAlert = document.querySelector('.device-reset-alert');
        const resetOverlay = document.querySelector('.device-reset-overlay');
        const confirmBtn = resetAlert.querySelector('.confirm');
        const cancelBtn = resetAlert.querySelector('.cancel');
        
        resetAlert.style.display = 'block';
        resetOverlay.style.display = 'block';
        
        confirmBtn.onclick = function() {
            // Remove from wedding responses
            let responses = JSON.parse(localStorage.getItem('wedding_responses') || '[]');
            responses = responses.filter(r => r.deviceId !== deviceId);
            localStorage.setItem('wedding_responses', JSON.stringify(responses));

            // Remove individual response
            const response = JSON.parse(localStorage.getItem('wedding_response') || '{}');
            if (response.deviceId === deviceId) {
                localStorage.removeItem('wedding_response');
            }

            updateDeviceList();
            resetAlert.style.display = 'none';
            resetOverlay.style.display = 'none';
        };
        
        cancelBtn.onclick = function() {
            resetAlert.style.display = 'none';
            resetOverlay.style.display = 'none';
        };
        
        resetOverlay.onclick = function() {
            resetAlert.style.display = 'none';
            resetOverlay.style.display = 'none';
        };
    };

    function onScanFailure(error) {
        const scanResult = document.getElementById('scanResult');
        
        // Don't show error for normal scanning process
        if (!error || error.includes("No QR code found")) {
            return;
        }

        // Handle different types of scan errors
        let errorMessage = '';
        
        if (error.includes("NotReadableError") || error.includes("TrackStartError")) {
            errorMessage = `
                <div class="error-scan">
                    <h3>خطأ في الوصول للكاميرا</h3>
                    <p>الكاميرا مشغولة أو غير متاحة</p>
                    <p class="scan-tip">حاول إغلاق التطبيقات الأخرى التي قد تستخدم الكاميرا</p>
                    <button onclick="window.location.reload()" class="admin-btn" style="margin-top: 15px;">
                        إعادة المحاولة
                    </button>
                </div>
            `;
        } else if (error.includes("OverconstrainedError")) {
            errorMessage = `
                <div class="error-scan">
                    <h3>إعدادات الكاميرا غير متوافقة</h3>
                    <p>الكاميرا لا تدعم الإعدادات المطلوبة</p>
                    <p class="scan-tip">جرب استخدام كاميرا أخرى إذا كانت متوفرة</p>
                    <button onclick="initializeCamera()" class="admin-btn" style="margin-top: 15px;">
                        إعادة المحاولة
                    </button>
                </div>
            `;
        } else if (error.includes("NotFoundError") || error.includes("DevicesNotFoundError")) {
            errorMessage = `
                <div class="error-scan">
                    <h3>لم يتم العثور على كاميرا</h3>
                    <p>تأكد من وجود كاميرا متصلة بجهازك</p>
                    <p class="scan-tip">قد تحتاج إلى إعادة تشغيل المتصفح</p>
                    <button onclick="window.location.reload()" class="admin-btn" style="margin-top: 15px;">
                        تحديث الصفحة
                    </button>
                </div>
            `;
        } else if (error.includes("low light")) {
            errorMessage = `
                <div class="error-scan">
                    <h3>إضاءة منخفضة</h3>
                    <p>الإضاءة غير كافية لمسح رمز QR</p>
                    <p class="scan-tip">حاول زيادة الإضاءة في المكان أو استخدام مصدر إضاءة إضافي</p>
                </div>
            `;
        } else if (error.includes("blurry")) {
            errorMessage = `
                <div class="error-scan">
                    <h3>الصورة غير واضحة</h3>
                    <p>حاول تثبيت الكاميرا وإبقائها ثابتة</p>
                    <p class="scan-tip">تأكد من أن رمز QR في مركز الكاميرا وواضح</p>
                </div>
            `;
        } else {
            errorMessage = `
                <div class="error-scan">
                    <h3>خطأ في المسح</h3>
                    <p>حاول توجيه الكاميرا بشكل أفضل نحو رمز QR</p>
                    <p class="scan-tip">تأكد من:</p>
                    <ul style="text-align: right; margin: 10px 20px;">
                        <li>أن رمز QR واضح وغير تالف</li>
                        <li>أن الإضاءة كافية</li>
                        <li>أن الكاميرا ثابتة وليست مهتزة</li>
                        <li>أن رمز QR في مركز إطار المسح</li>
                    </ul>
                </div>
            `;
        }

        scanResult.innerHTML = errorMessage;
        console.warn('Scan error:', error);
    }

    // Add auto-refresh every 30 seconds when device list section is visible
    setInterval(() => {
        if (deviceListSection.style.display === 'block') {
            updateDeviceList();
        }
    }, 30000);

    // Add this function
    window.resetAllData = function() {
        const resetAlert = document.querySelector('.dev-reset-alert');
        const resetOverlay = document.querySelector('.device-reset-overlay');
        const confirmBtn = resetAlert.querySelector('.confirm');
        const cancelBtn = resetAlert.querySelector('.cancel');
        
        resetAlert.style.display = 'block';
        resetOverlay.style.display = 'block';
        
        confirmBtn.onclick = function() {
            try {
                // Clear all stored data
                localStorage.removeItem('qr_data_list');
                localStorage.removeItem('scanned_devices');
                localStorage.removeItem('wedding_responses');
                localStorage.removeItem('wedding_response');
                localStorage.removeItem('wedding_invitation_accessed');
                
                // Update the display
                updateDeviceList();
                
                // Show success message
                alert('تم إعادة تعيين جميع البيانات بنجاح');
                
                resetAlert.style.display = 'none';
                resetOverlay.style.display = 'none';
            } catch (error) {
                console.error('Reset failed:', error);
                alert('فشلت عملية إعادة التعيين');
            }
        };
        
        cancelBtn.onclick = function() {
            resetAlert.style.display = 'none';
            resetOverlay.style.display = 'none';
        };
        
        resetOverlay.onclick = function() {
            resetAlert.style.display = 'none';
            resetOverlay.style.display = 'none';
        };
    };

    // Update the showTab function
    window.showTab = function(tabName) {
        // Update tab buttons
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => tab.classList.remove('active'));
        const activeTab = document.querySelector(`.tab-btn[onclick="showTab('${tabName}')"]`);
        if (activeTab) activeTab.classList.add('active');

        // Update tab content
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });

        const selectedTab = document.getElementById(`${tabName}Tab`);
        if (selectedTab) {
            selectedTab.classList.add('active');
            selectedTab.style.display = 'block';
        }

        // Update device list when switching tabs
        updateDeviceList();
    };

    // Add a function to check camera permissions
    async function checkCameraPermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            // Stop the stream immediately after checking
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (err) {
            return false;
        }
    }
}); 