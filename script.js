const compassDial = document.getElementById('compassDial');
const headingValue = document.getElementById('headingValue');
const directionText = document.getElementById('directionText');
const requestPermissionBtn = document.getElementById('requestPermissionBtn');
const statusText = document.getElementById('statusText');
const latValue = document.getElementById('latValue');
const lonValue = document.getElementById('lonValue');
const openMapBtn = document.getElementById('openMapBtn');

let isCompassActive = false;
let currentLat = null;
let currentLon = null;

// Helper to get cardinal direction
function getCardinalDirection(angle) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(((angle %= 360) < 0 ? angle + 360 : angle) / 45) % 8;
    return directions[index];
}

// Function to handle orientation events
function handleOrientation(event) {
    let compassHeading;

    // iOS devices
    if (event.webkitCompassHeading) {
        compassHeading = event.webkitCompassHeading;
    }
    // Android/Windows (alpha is counter-clockwise 0-360)
    else if (event.alpha !== null) {
        compassHeading = 360 - event.alpha;
    }

    if (compassHeading === undefined) return;

    // Normalize to 0-360
    compassHeading = compassHeading % 360;
    if (compassHeading < 0) compassHeading += 360;

    // Apply rotation (CSS rotate is clockwise, so we need negative for dial or positive depending on implementation

    const rotation = -compassHeading;

    compassDial.style.transform = `rotate(${rotation}deg)`;

    // Update text
    const headingInt = Math.round(compassHeading);
    headingValue.textContent = headingInt;
    directionText.textContent = getCardinalDirection(headingInt);
}

function handleLocation(position) {
    const lat = position.coords.latitude.toFixed(4);
    const lon = position.coords.longitude.toFixed(4);

    currentLat = position.coords.latitude;
    currentLon = position.coords.longitude;

    latValue.textContent = `${lat}°`;
    lonValue.textContent = `${lon}°`;
}

function handleError(error) {
    console.warn(`ERROR(${error.code}): ${error.message}`);
}

function startCompass() {
    let permissionCount = 0;

    // 1. Request Orientation Permission (iOS 13+)
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(response => {
                if (response === 'granted') {
                    window.addEventListener('deviceorientation', handleOrientation, true);
                    isCompassActive = true;
                } else {
                    statusText.textContent = 'Compass permission denied';
                }
            })
            .catch(console.error);
    } else {
        // Non-iOS 13+ devices
        window.addEventListener('deviceorientation', handleOrientation, true);
        isCompassActive = true;
    }

    // 2. Request Location Permission
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(handleLocation, handleError, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        });
    } else {
        latValue.textContent = 'N/A';
        lonValue.textContent = 'N/A';
    }

    // UI Updates
    requestPermissionBtn.style.display = 'none';
    statusText.textContent = 'Active';
}

// Check if we need to show the permission button
if ((typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') || navigator.geolocation) {
    requestPermissionBtn.style.display = 'block';
    requestPermissionBtn.textContent = 'Start Compass';
    requestPermissionBtn.addEventListener('click', startCompass);
    statusText.textContent = 'Permissions required';
} else {
    // Try auto-starting for others
    startCompass();

    // If after a small delay we haven't received data, maybe show a manual start or simulation for desktop
    setTimeout(() => {
        if (!isCompassActive) {
            // For desktop debugging (Simulation)
            console.log('No device orientation detected. Desktop mode?');
            statusText.textContent = 'Desktop Mode (Simulated)';

            document.addEventListener('mousemove', (e) => {
                const x = e.clientX - window.innerWidth / 2;
                const y = e.clientY - window.innerHeight / 2;
                const rad = Math.atan2(y, x);
                let deg = rad * (180 / Math.PI);
                deg = deg + 90; // offset to make top 0
                if (deg < 0) deg += 360;

                handleOrientation({ alpha: deg, webkitCompassHeading: deg });
            });

            // Simulate location for desktop
            handleLocation({ coords: { latitude: 40.7128, longitude: -74.0060 } });
        }
    }, 1000);
}

openMapBtn.addEventListener('click', () => {
    if (currentLat !== null && currentLon !== null) {
        const url = `https://www.google.com/maps?q=${currentLat},${currentLon}`;
        window.open(url, '_blank');
    } else {
        alert('Location not yet available. Please wait.');
    }
});
