// Indoor Navigation Assistant - Web Implementation

// Global state
const state = {
    userCurrentLocation: 0,
    userDesiredLocation: 0,
    lastInstruction: "",
    currentPanel: "main-menu",
    speechSynthesis: window.speechSynthesis,
    recognition: null,
    isListening: false,
    mapInitialized: false,
    routeSteps: [],
    // Add automatic guidance properties
    isAutoGuidanceActive: false,
    autoGuidanceTimer: null,
    currentAutoStep: 0
};

// Complete room data based on RouteGuidance.cpp
const roomData = {
    roomNames: [
        // Ground Floor Classrooms (indices 0-11)
        "N001", "N002", "N003", "N004", "N005", "N006", "N007", "N008", "N009", "N010", "N011", "N012",
        // Ground Floor Offices (indices 12-63)
        "NG-001", "NG-002", "NG-003", "NG-004", "NG-005", "NG-006", "NG-007", "NG-008", "NG-009", "NG-010",
        "NG-011", "NG-012", "NG-013", "NG-014", "NG-015", "NG-016", "NG-017", "NG-018", "NG-019", "NG-020",
        "NG-021", "NG-022", "NG-023", "NG-024", "NG-025", "NG-026", "NG-027", "NG-028", "NG-029", "NG-030",
        "NG-031", "NG-032", "NG-033", "NG-034", "NG-035", "NG-036", "NG-037", "NG-038", "NG-039", "NG-040",
        "NG-041", "NG-042", "NG-043", "NG-044", "NG-045", "NG-046", "NG-047", "NG-048", "NG-049", "NG-050",
        "NG-051", "NG-052",
        // Ground Floor Toilets (indices 64-66)
        "NGT_1_and_2", "NGT_3_4_and_5", "NGT_6_and_7",
        // Ground Floor Stairs (indices 67-70)
        "Stair_GF_Right_1", "Stair_GF_Right_2", "Stair_GF_Left_1", "Stair_GF_Left_2",
        // First Floor Classrooms (indices 71-82)
        "N101", "N102", "N103", "N104", "N105", "N106", "N107", "N108", "N109", "N110", "N111", "N112",
        // First Floor Offices (indices 83-124)
        "NF-001", "NF-002", "NF-003", "NF-004", "NF-005", "NF-006", "NF-007", "NF-008", "NF-009", "NF-010",
        "NF-011", "NF-012", "NF-013", "NF-014", "NF-015", "NF-016", "NF-017", "NF-018", "NF-019", "NF-020",
        "NF-021", "NF-022", "NF-023", "NF-024", "NF-025", "NF-026", "NF-027", "NF-028", "NF-029", "NF-030",
        "NF-031", "NF-032", "NF-033", "NF-034", "NF-035", "NF-036", "NF-037", "NF-038", "NF-039", "NF-040",
        "NF-041", "NF-042",
        // First Floor Toilets (indices 125-127)
        "NFT_1_and_2", "NFT_3_4_and_5", "NFT_6_and_7",
        // First Floor Printer (index 128)
        "NFP 2",
        // First Floor Stairs (indices 129-132)
        "Stair_FF_Right_1", "Stair_FF_Right_2", "Stair_FF_Left_1", "Stair_FF_Left_2"
    ],
    
    // Complete adjacency list based on RouteGuidance.cpp buildMap()
    adjList: {
        // Ground Floor Classrooms
        "N001": ["N002", "NGT_1_and_2", "N012", "Stair_GF_Right_1"],
        "N002": ["N001", "N003", "N012", "N011", "NGT_1_and_2"],
        "N003": ["N002", "N011", "Stair_GF_Right_2", "N012"],
        "N004": ["N005", "N010", "N009", "Stair_GF_Right_2"],
        "N005": ["N004", "N006", "N009", "N010"],
        "N006": ["N005", "N007", "NGT_3_4_and_5", "N008", "N009"],
        "N007": ["N006", "N008", "NGT_3_4_and_5", "NG-001", "Stair_GF_Left_2"],
        "N008": ["N007", "NGT_3_4_and_5", "NG-043", "Stair_GF_Left_2"],
        "N009": ["NGT_3_4_and_5", "N010", "N004", "N005", "N006"],
        "N010": ["N009", "N011", "N004", "N005", "Stair_GF_Right_2"],
        "N011": ["N010", "N012", "N002", "N003", "Stair_GF_Right_2"],
        "N012": ["N011", "NGT_1_and_2", "N001", "N002", "N003"],

        // Ground Floor Toilets
        "NGT_1_and_2": ["Stair_GF_Right_1", "N001", "N012", "N002"],
        "NGT_3_4_and_5": ["N006", "N007", "N008", "N009"],
        "NGT_6_and_7": ["NG-022", "NG-023", "NG-011", "Stair_GF_Left_1"],

        // Ground Floor Stairs
        "Stair_GF_Right_1": ["N001", "NGT_1_and_2", "Stair_FF_Right_1"],
        "Stair_GF_Right_2": ["N003", "N004", "N010", "N011", "Stair_FF_Right_2"],
        "Stair_GF_Left_1": ["NG-052", "NGT_6_and_7", "Stair_FF_Left_1"],
        "Stair_GF_Left_2": ["NG-001", "N007", "N008", "NG-043", "Stair_FF_Left_2"],

        // Ground Floor Offices (simplified - showing key connections)
        "NG-001": ["NG-002", "N007", "Stair_GF_Left_2"],
        "NG-002": ["NG-001", "NG-003"],
        "NG-003": ["NG-002", "NG-004", "NG-015"],
        "NG-004": ["NG-003", "NG-005"],
        "NG-005": ["NG-004", "NG-006"],
        "NG-006": ["NG-005", "NG-007"],
        "NG-007": ["NG-006", "NG-008"],
        "NG-008": ["NG-007", "NG-009", "NG-020"],
        "NG-009": ["NG-008", "NG-010"],
        "NG-010": ["NG-009", "NG-011"],
        "NG-011": ["NG-010", "NG-012", "NGT_6_and_7"],
        "NG-012": ["NG-011", "NG-013"],
        "NG-013": ["NG-012", "NG-014"],
        "NG-014": ["NG-013", "NG-024"],
        "NG-015": ["NG-003", "NG-016"],
        "NG-016": ["NG-015", "NG-017"],
        "NG-017": ["NG-016", "NG-018"],
        "NG-018": ["NG-017", "NG-019"],
        "NG-019": ["NG-018", "NG-020"],
        "NG-020": ["NG-008", "NG-019", "NG-021"],
        "NG-021": ["NG-020", "NG-022"],
        "NG-022": ["NG-021", "NGT_6_and_7"],
        "NG-023": ["NGT_6_and_7", "NG-024"],
        "NG-024": ["NG-014", "NG-023", "NG-025"],
        "NG-025": ["NG-024", "NG-026"],
        "NG-026": ["NG-025", "NG-027"],
        "NG-027": ["NG-026", "NG-028", "NG-029"],
        "NG-028": ["NG-027"],
        "NG-029": ["NG-027", "NG-030"],
        "NG-030": ["NG-029", "NG-031"],
        "NG-031": ["NG-030", "NG-032"],
        "NG-032": ["NG-031", "NG-033"],
        "NG-033": ["NG-032", "NG-034"],
        "NG-034": ["NG-033", "NG-035"],
        "NG-035": ["NG-034", "NG-036", "NG-052"],
        "NG-036": ["NG-035", "NG-037"],
        "NG-037": ["NG-036", "NG-038", "NG-050"],
        "NG-038": ["NG-037", "NG-039", "NG-048"],
        "NG-039": ["NG-038", "NG-040"],
        "NG-040": ["NG-039", "NG-041"],
        "NG-041": ["NG-040", "NG-042"],
        "NG-042": ["NG-041", "NG-043"],
        "NG-043": ["NG-042", "NG-044", "N008", "Stair_GF_Left_2"],
        "NG-044": ["NG-043", "NG-045"],
        "NG-045": ["NG-044", "NG-046"],
        "NG-046": ["NG-045", "NG-047"],
        "NG-047": ["NG-046", "NG-048"],
        "NG-048": ["NG-038", "NG-047", "NG-049"],
        "NG-049": ["NG-048", "NG-050"],
        "NG-050": ["NG-037", "NG-049", "NG-051"],
        "NG-051": ["NG-050", "NG-052"],
        "NG-052": ["NG-035", "NG-051", "Stair_GF_Left_1"],

        // First Floor Classrooms
        "N101": ["N102", "NFT_1_and_2", "N112", "Stair_FF_Right_1"],
        "N102": ["N101", "N103", "N112", "N111", "NFT_1_and_2"],
        "N103": ["N102", "N111", "Stair_FF_Right_2", "N112"],
        "N104": ["N105", "N110", "N109", "Stair_FF_Right_2"],
        "N105": ["N104", "N106", "N109", "N110"],
        "N106": ["N105", "N107", "NFT_3_4_and_5", "N108", "N109"],
        "N107": ["N106", "N108", "NFT_3_4_and_5", "NF-001", "Stair_FF_Left_2"],
        "N108": ["N107", "NFT_3_4_and_5", "NF-034", "Stair_FF_Left_2"],
        "N109": ["NFT_3_4_and_5", "N110", "N104", "N105", "N106"],
        "N110": ["N109", "N111", "N104", "N105", "Stair_FF_Right_2"],
        "N111": ["N110", "N112", "N102", "N103", "Stair_FF_Right_2"],
        "N112": ["N111", "NFT_1_and_2", "N101", "N102", "N103"],

        // First Floor Toilets
        "NFT_1_and_2": ["Stair_FF_Right_1", "N101", "N112", "N102"],
        "NFT_3_4_and_5": ["N106", "N107", "N108", "N109"],
        "NFT_6_and_7": ["NF-021", "NF-022", "Stair_FF_Left_1"],

        // First Floor Printer
        "NFP 2": ["NF-023", "NF-025", "NF-042", "Stair_FF_Left_1"],

        // First Floor Stairs
        "Stair_FF_Right_1": ["N101", "NFT_1_and_2", "Stair_GF_Right_1"],
        "Stair_FF_Right_2": ["N103", "N104", "N110", "N111", "Stair_GF_Right_2"],
        "Stair_FF_Left_1": ["NFP 2", "NFT_6_and_7", "Stair_GF_Left_1"],
        "Stair_FF_Left_2": ["NF-001", "NF-002", "N107", "N108", "NF-034", "Stair_GF_Left_2"],

        // First Floor Offices (key connections)
        "NF-001": ["NF-002", "N107", "Stair_FF_Left_2"],
        "NF-002": ["NF-001", "NF-003", "Stair_FF_Left_2"],
        "NF-003": ["NF-002", "NF-004"],
        "NF-004": ["NF-003", "NF-005", "NF-014"],
        "NF-005": ["NF-004", "NF-006"],
        "NF-006": ["NF-005", "NF-007"],
        "NF-007": ["NF-006", "NF-008"],
        "NF-008": ["NF-007", "NF-009"],
        "NF-009": ["NF-008", "NF-010"],
        "NF-010": ["NF-009", "NF-011"],
        "NF-011": ["NF-010", "NF-012"],
        "NF-012": ["NF-011", "NF-013"],
        "NF-013": ["NF-012", "NF-022"],
        "NF-014": ["NF-004", "NF-015"],
        "NF-015": ["NF-014", "NF-016"],
        "NF-016": ["NF-015", "NF-017"],
        "NF-017": ["NF-016", "NF-018"],
        "NF-018": ["NF-017", "NF-019"],
        "NF-019": ["NF-018", "NF-020"],
        "NF-020": ["NF-019", "NF-021"],
        "NF-021": ["NF-020", "NFT_6_and_7"],
        "NF-022": ["NF-013", "NFT_6_and_7", "NF-023"],
        "NF-023": ["NF-022", "NFP 2", "NF-024"],
        "NF-024": ["NF-023", "NF-025"],
        "NF-025": ["NF-024", "NFP 2", "NF-026"],
        "NF-026": ["NF-025", "NF-027"],
        "NF-027": ["NF-026", "NF-028", "NF-041"],
        "NF-028": ["NF-027", "NF-029", "NF-039"],
        "NF-029": ["NF-028", "NF-030"],
        "NF-030": ["NF-029", "NF-031"],
        "NF-031": ["NF-030", "NF-032"],
        "NF-032": ["NF-031", "NF-033"],
        "NF-033": ["NF-032", "NF-034"],
        "NF-034": ["NF-033", "N108", "Stair_FF_Left_2", "NF-035"],
        "NF-035": ["NF-034", "NF-036", "NF-037"],
        "NF-036": ["NF-035", "NF-037"],
        "NF-037": ["NF-035", "NF-036", "NF-038"],
        "NF-038": ["NF-037", "NF-039"],
        "NF-039": ["NF-028", "NF-038", "NF-040"],
        "NF-040": ["NF-039", "NF-041"],
        "NF-041": ["NF-027", "NF-040", "NF-042"],
        "NF-042": ["NF-041", "NFP 2"]
    },
    
    floors: {
        // Ground Floor
        "N001": "Ground Floor", "N002": "Ground Floor", "N003": "Ground Floor", "N004": "Ground Floor",
        "N005": "Ground Floor", "N006": "Ground Floor", "N007": "Ground Floor", "N008": "Ground Floor",
        "N009": "Ground Floor", "N010": "Ground Floor", "N011": "Ground Floor", "N012": "Ground Floor",
        "NG-001": "Ground Floor", "NG-002": "Ground Floor", "NG-003": "Ground Floor", "NG-004": "Ground Floor",
        // ... (all ground floor rooms)
        "NGT_1_and_2": "Ground Floor", "NGT_3_4_and_5": "Ground Floor", "NGT_6_and_7": "Ground Floor",
        "Stair_GF_Right_1": "Ground Floor", "Stair_GF_Right_2": "Ground Floor",
        "Stair_GF_Left_1": "Ground Floor", "Stair_GF_Left_2": "Ground Floor",
        
        // First Floor
        "N101": "First Floor", "N102": "First Floor", "N103": "First Floor", "N104": "First Floor",
        "N105": "First Floor", "N106": "First Floor", "N107": "First Floor", "N108": "First Floor",
        "N109": "First Floor", "N110": "First Floor", "N111": "First Floor", "N112": "First Floor",
        "NF-001": "First Floor", "NF-002": "First Floor", "NF-003": "First Floor", "NF-004": "First Floor",
        // ... (all first floor rooms)
        "NFT_1_and_2": "First Floor", "NFT_3_4_and_5": "First Floor", "NFT_6_and_7": "First Floor",
        "NFP 2": "First Floor",
        "Stair_FF_Right_1": "First Floor", "Stair_FF_Right_2": "First Floor",
        "Stair_FF_Left_1": "First Floor", "Stair_FF_Left_2": "First Floor"
    }
};

// Initialize when DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    initSpeechRecognition();
    initEventListeners();
    speak("Welcome to Indoor Navigation Assistant.");
    updateStatusDisplay();
});

// Initialize Speech Recognition
function initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
        state.recognition = new webkitSpeechRecognition();
        state.recognition.continuous = false;
        state.recognition.lang = 'en-US';
        
        state.recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            document.getElementById('voice-result').textContent = `You said: ${transcript}`;
            document.getElementById('voice-result').classList.remove('d-none');
            
            // Process voice input
            processVoiceDestination(transcript);
        };
        
        state.recognition.onend = function() {
            document.getElementById('btn-start-voice').classList.remove('recording');
            document.getElementById('voice-status').textContent = 'Click to start speaking';
            state.isListening = false;
        };
    } else {
        showMessage('Speech recognition not supported in this browser.', 'warning');
    }
}

// Initialize all event listeners
function initEventListeners() {
    // Case 1: Where Am I?
    document.getElementById("btn-where").addEventListener("click", () => {
        fetch("http://localhost:18080/scan", { method: "POST" })
            .then(res => res.json())
            .then(data => {
                document.getElementById("current-location").innerText = data.location || "Unknown";
                document.getElementById("scan-status").innerText = data.message || "";

                let list = document.getElementById("neighbors-list");
                list.innerHTML = "";
                if (data.neighbors) {
                    data.neighbors.forEach(n => {
                        let li = document.createElement("li");
                        li.className = "list-group-item";
                        li.textContent = n;
                        list.appendChild(li);
                    });
                    document.getElementById("nearby-locations").classList.remove("d-none");
                }

                showPanel("where-panel");
            });
    });

    document.getElementById("btn-where-back").addEventListener("click", () => showPanel("main-menu"));

    // Case 2: Set Destination
    document.getElementById("btn-set-destination").addEventListener("click", () => {
        let destInput = document.getElementById("destination-input").value.trim();
        if (!destInput) {
            alert("Please enter a destination.");
            return;
        }

        fetch("http://localhost:18080/set-destination", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ destination: destInput })
        })
            .then(res => res.json())
            .then(data => {
                if (data.status === "ok") {
                    document.getElementById("destination").innerText = data.destination;
                    showPanel("destination-panel");
                } else {
                    alert(data.message || "Failed to set destination");
                }
            })
            .catch(err => {
                console.error(err);
                alert("Error communicating with server");
            });
    });


    document.getElementById("btn-dest-back").addEventListener("click", () => showPanel("main-menu"));

    // Case 3: Guide Me
    document.getElementById("btn-guide").addEventListener("click", () => {
        fetch("http://localhost:18080/navigate")
            .then(res => res.json())
            .then(data => {
                let routeList = document.getElementById("route-steps");
                routeList.innerHTML = "";
                if (data.steps) {
                    data.steps.forEach(step => {
                        let li = document.createElement("li");
                        li.className = "list-group-item";
                        li.textContent = step;
                        routeList.appendChild(li);
                    });
                }
                showPanel("navigation-panel");
            });
    });

    document.getElementById("btn-nav-back").addEventListener("click", () => showPanel("main-menu"));

    // Case 4: Repeat Instruction
    document.getElementById("btn-repeat").addEventListener("click", () => {
        fetch("http://localhost:18080/repeat")
            .then(res => res.json())
            .then(data => {
                alert("Repeated Instruction: " + (data.instruction || "No instruction available"));
            });
    });

    // Case 5: Exit
    document.getElementById("btn-exit").addEventListener("click", () => {
        fetch("http://localhost:18080/exit")
            .then(res => res.json())
            .then(data => {
                alert(data.message || "Exiting system...");
                showPanel("main-menu");
            });
    });
}

// Show specific panel and hide others
function showPanel(panelId) {
    // Hide all panels
    document.querySelectorAll('#main-interface > div').forEach(panel => {
        panel.classList.add('d-none');
    });
    
    // Show the requested panel
    document.getElementById(panelId).classList.remove('d-none');
    state.currentPanel = panelId;
    
    // Specific panel initialization
    if (panelId === 'main-menu') {
        speak("Menu options: 1. Where Am I? 2. Set Destination. 3. Guide Me. 4. Repeat Last Instruction. 5. Exit.");
    }
}

// Update the status display with current location and destination
function updateStatusDisplay() {
    const currentLocationElement = document.getElementById('current-location');
    const destinationElement = document.getElementById('destination');
    
    currentLocationElement.textContent = state.userCurrentLocation > 0 ? 
        roomData.roomNames[state.userCurrentLocation - 1] : "Not Set";
    
    destinationElement.textContent = state.userDesiredLocation > 0 ? 
        roomData.roomNames[state.userDesiredLocation - 1] : "Not Set";
}

// Text-to-speech function
function speak(text) {
    if (state.speechSynthesis) {
        // Cancel any ongoing speech
        state.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        state.speechSynthesis.speak(utterance);
    }
}

// Stop speech
function stopSpeech() {
    if (state.speechSynthesis) {
        state.speechSynthesis.cancel();
    }
}

// Show message to user
function showMessage(message, type = 'info') {
    const messagePanel = document.getElementById('message-panel');
    messagePanel.textContent = message;
    messagePanel.className = `alert alert-${type} d-block`;
    
    // Add a close button
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'btn-close';
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.style.float = 'right';
    closeButton.onclick = function() {
        messagePanel.classList.add('d-none');
    };
    
    messagePanel.prepend(closeButton);
    
    // Set a timeout to auto-hide the message after 5 seconds
    setTimeout(() => {
        messagePanel.classList.add('d-none');
    }, 5000);
}

// QR Scanning with camera
function startQRScanning() {
    speak("Scanning your location. Please hold still.");
    const scanStatus = document.getElementById('scan-status');
    scanStatus.classList.remove('d-none');
    
    const video = document.getElementById('qr-video');
    const qrPreview = document.getElementById('qr-preview');
    
    // Make sure video element is properly styled
    video.style.maxWidth = '100%';
    video.style.border = '1px solid #ddd';
    video.style.borderRadius = '4px';
    
    // Check if camera is supported
    if (!initCamera()) {
        // Fall back to your existing simulation if camera isn't supported
        simulateQRScan();
        return;
    }
    
    // Show the video element
    video.classList.remove('d-none');
    qrPreview.style.display = 'none';
    
    // Access the camera
    navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } // Use back camera if available
    })
    .then(stream => {
        video.srcObject = stream;
        video.play();
        
        // Start scanning for QR codes
        scanQRCode(video, stream, scanStatus);
    })
    .catch(err => {
        console.error("Camera access error:", err);
        // Fall back to your existing simulation
        simulateQRScan();
    });
}

// Function to scan QR code from video
function scanQRCode(video, stream, scanStatus) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let scanning = true;
    const qrPreview = document.getElementById('qr-preview');
    
    // Update scan status to show that scanning is in progress
    scanStatus.textContent = "Scanning... Please hold the QR code steady";
    scanStatus.className = "alert alert-info";
    
    // Add a manual cancel button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = "Cancel Scanning";
    cancelButton.className = "btn btn-secondary mt-2";
    cancelButton.addEventListener('click', () => {
        scanning = false;
        stopCamera(stream);
        video.classList.add('d-none');
        qrPreview.style.display = 'block';
        cancelButton.remove();
        showPanel('main-menu');
    });
    
    // Add the cancel button
    scanStatus.parentNode.appendChild(cancelButton);
    
    function scan() {
        if (!scanning) return;
        
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            try {
                // Use jsQR to detect QR code
                if (typeof jsQR === 'function') {
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: "dontInvert"
                    });
                    
                    if (code) {
                        // QR code found
                        scanning = false;
                        cancelButton.remove(); // Remove cancel button
                        
                        // Keep camera visible until user chooses to close
                        scanStatus.textContent = "QR Code detected! Processing location...";
                        scanStatus.className = "alert alert-success";
                        
                        // Process detected location
                        const qrMap = {
                            "Welcome to UCCC2513 Mini Project -- Blue QR -- N001 Classroom Outside":
                                { id: 1, name: "N001", color: "blue" },
                            "Welcome to UCCC2513 Mini Project -- Purple QR -- NF-001 Office Outside":
                                { id: 84, name: "NF-001", color: "purple" },
                            "Welcome to UCCC2513 Mini Project -- Red QR -- Stair Beside N104":
                                { id: 131, name: "Stair_FF_Right_2", color: "red" },
                            "Welcome to UCCC2513 Mini Project -- Orange QR -- Office Ground Floor Toilet":
                                { id: 67, name: "NGT_6_and_7", color: "orange" }
                        };
                        
                        // Show the detected location
                        if (qrMap[code.data]) {
                            const detectedLocation = qrMap[code.data];
                            showDetectedLocation(detectedLocation);
                        } else {
                            scanStatus.textContent = "Unknown QR Code: " + code.data;
                            scanStatus.className = "alert alert-warning";
                        }
                        
                        // Add a close camera button for better user experience
                        const closeButton = document.createElement('button');
                        closeButton.textContent = "Close Camera";
                        closeButton.className = "btn btn-secondary mt-3";
                        closeButton.addEventListener('click', () => {
                            stopCamera(stream);
                            video.classList.add('d-none');
                            qrPreview.style.display = 'block';
                        });
                        
                        // Add the close button to the scanning area
                        const scanArea = document.querySelector('.qr-container');
                        if (scanArea && !scanArea.querySelector('.close-camera-btn')) {
                            closeButton.classList.add('close-camera-btn');
                            scanArea.appendChild(closeButton);
                        }
                        
                        return;
                    }
                }
            } catch (e) {
                console.error("QR scanning error:", e);
            }
        }
        
        // Continue scanning
        requestAnimationFrame(scan);
    }
    
    // Start scanning
    requestAnimationFrame(scan);
    
    // Stop scanning after 15 seconds if no QR code is found
    setTimeout(() => {
        if (scanning) {
            scanning = false;
            stopCamera(stream);
            video.classList.add('d-none');
            qrPreview.style.display = 'block';
            
            // DO NOT automatically stop the camera or hide the video
            // Instead, show timeout message and provide options
            
            // Keep the video visible but show a timeout message
            scanStatus.textContent = "Scanning timed out. No QR code detected.";
            scanStatus.className = "alert alert-warning";
            
            // Add buttons to retry or close camera
            const buttonContainer = document.createElement('div');
            buttonContainer.className = "d-flex justify-content-center mt-2 gap-2";
            
            const retryButton = document.createElement('button');
            retryButton.textContent = "Try Again";
            retryButton.className = "btn btn-primary";
            retryButton.addEventListener('click', () => {
                // Remove existing buttons if any
                const existingContainer = scanStatus.parentNode.querySelector('.d-flex.justify-content-center');
                if (existingContainer) {
                    existingContainer.remove();
                }
                
                // Restart scanning with the same stream
                scanQRCode(video, stream, scanStatus);
            });
            
            const closeButton = document.createElement('button');
            closeButton.textContent = "Close Camera";
            closeButton.className = "btn btn-secondary";
            closeButton.addEventListener('click', () => {
                stopCamera(stream);
                video.classList.add('d-none');
                qrPreview.style.display = 'block';
                simulateQRScan();
            });
            
            buttonContainer.appendChild(retryButton);
            buttonContainer.appendChild(closeButton);
            
            // Add buttons below the status message
            scanStatus.parentNode.insertBefore(buttonContainer, scanStatus.nextSibling);
        }
    }, 15000);
}

// Function to stop the camera
function stopCamera(stream) {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
}

// Add this function to keep your existing simulation as a fallback
function simulateQRScan() {
    const scanStatus = document.getElementById('scan-status');
    
    // Remove the simulation timeout
    // Simulate successful scan immediately
    const success = Math.random() > 0.2; // 80% success rate for simulation
    
    if (success) {
        // Simulate detected location (for demo purposes)
        const locations = [
            { id: 1, name: "N001", color: "blue" },
            { id: 84, name: "NF-001", color: "purple" },
            { id: 131, name: "Stair Beside N104", color: "red" },
            { id: 67, name: "Office Ground Floor Toilet", color: "orange" }
        ];
        
        const detectedLocation = locations[Math.floor(Math.random() * locations.length)];
        
        scanStatus.classList.add('d-none');
        showDetectedLocation(detectedLocation);
    } else {
        // Failed scan
        scanStatus.textContent = "Location Detection Failed";
        scanStatus.className = "alert alert-danger";
        speak("Location detection failed. Please check QR code visibility and try again.");
        
        // Add a button to return to main menu instead of auto-navigation
        const buttonContainer = document.createElement('div');
        buttonContainer.className = "mt-3";
        
        const backButton = document.createElement('button');
        backButton.textContent = "Back to Main Menu";
        backButton.className = "btn btn-secondary";
        backButton.addEventListener('click', () => {
            showPanel('main-menu');
        });
        
        buttonContainer.appendChild(backButton);
        scanStatus.parentNode.appendChild(buttonContainer);
    }
}

// Display detected location
function showDetectedLocation(location) {
    // Update UI with detected location
    document.getElementById('location-info').classList.remove('d-none');
    document.getElementById('detected-location').textContent = location.name;
    document.getElementById('area-type').textContent = location.color;
    
    // Update global state
    state.userCurrentLocation = location.id;
    state.lastInstruction = `You are at ${location.name}`;
    
    // Show nearby locations
    document.getElementById('nearby-locations').classList.remove('d-none');
    const neighborsList = document.getElementById('neighbors-list');
    neighborsList.innerHTML = "";
    
    // Get neighbors from our simplified adjacency list
    const neighbors = roomData.adjList[location.name] || [];
    
    if (neighbors.length > 0) {
        neighbors.forEach((neighbor, index) => {
            const li = document.createElement('li');
            li.className = "list-group-item";
            li.textContent = `${index + 1}. ${neighbor}`;
            neighborsList.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.className = "list-group-item";
        li.textContent = "No neighbors found";
        neighborsList.appendChild(li);
    }
    
    // Speak the location
    speak(state.lastInstruction);
    
    // Update status display
    updateStatusDisplay();
    
    // Show a success message
    showMessage(`Location detected: ${location.name}`, 'success');
    }

// Show type destination interface
function showTypeDestination() {
    document.getElementById('dest-input-area').classList.remove('d-none');
    document.getElementById('voice-input-area').classList.add('d-none');
    speak("Please type your destination.");
}

// Show voice input interface
function showVoiceDestination() {
    document.getElementById('voice-input-area').classList.remove('d-none');
    document.getElementById('dest-input-area').classList.add('d-none');
    speak("Please speak your destination after clicking the microphone button.");
}

// Toggle voice recognition
function toggleVoiceRecognition() {
    if (!state.recognition) {
        showMessage('Speech recognition not available', 'danger');
        return;
    }
    
    if (state.isListening) {
        state.recognition.stop();   
    } else {
        document.getElementById('voice-result').classList.add('d-none');
        document.getElementById('btn-start-voice').classList.add('recording');
        document.getElementById('voice-status').textContent = 'Listening...';
        state.isListening = true;
        
        
        
        setTimeout(() => {
            state.recognition.start();
        }, 500);
    }
}
function normalizeLocation(str) {
    return str
        .toUpperCase()
        .replace(/[\s_-]+/g, "") 
        .trim();
}

// Process voice destination
function processVoiceDestination(transcript) {
    // Simple room name matching - in real app, would use NLP
    const cleanTranscript = normalizeLocation(transcript);
    
    // Find closest room name match
    let matchedRoom = null;
    let matchIndex = -1;
    
    // For demo, just check if the transcript contains any room name
    roomData.roomNames.forEach((room, index) => {
        if (cleanTranscript.toLowerCase().includes(normalizeLocation(room).toLowerCase())) {
            matchedRoom = room;
            matchIndex = index;
        }
    });
    
    if (matchedRoom) {
        setDestination(matchIndex + 1, matchedRoom);
    } else {
        speak("Sorry, that location was not found. Please try again.");
        showMessage(`Location not found: ${transcript}`, 'warning');
    }
}

// Set destination from text input
function setDestinationFromInput() {
    const destinationInput = document.getElementById('destination-input');
    const newDestination = destinationInput.value.trim();
    
    if (newDestination) {
        // Find the room in our data
        const roomIndex = roomData.roomNames.findIndex(room => 
            room.toLowerCase() === newDestination.toLowerCase());
        
        if (roomIndex !== -1) {
            setDestination(roomIndex + 1, roomData.roomNames[roomIndex]);
        } else {
            speak("Sorry, that location was not found.");
            showMessage(`Location not found: ${newDestination}`, 'warning');
        }
    } else {
        speak("Empty destination not allowed.");
        showMessage("Empty destination not allowed", 'warning');
    }
}

// Set the destination
function setDestination(nodeIndex, name) {
    state.userDesiredLocation = nodeIndex;
    state.lastInstruction = `Destination set to ${name}`;
    
    speak(state.lastInstruction);
    showMessage(`Destination set to ${name}`, 'success');
    updateStatusDisplay();
    
    // Remove automatic navigation to main menu
    // Add a continue button instead
    const destInputArea = document.getElementById('dest-input-area');
    const voiceInputArea = document.getElementById('voice-input-area');
    
    // Hide input areas
    if (destInputArea) destInputArea.classList.add('d-none');
    if (voiceInputArea) voiceInputArea.classList.add('d-none');
    
    // Create continue button (this was missing!)
    const continueButton = document.createElement('button');
    continueButton.textContent = "Start Navigation";
    continueButton.className = "btn btn-success mt-3";
    continueButton.addEventListener('click', () => {
        showPanel('navigation-panel');
        startNavigation();
    });
    
    // Find destination panel and add button
    const destPanel = document.getElementById('destination-panel');
    if (destPanel) {
        // Remove any existing continue buttons
        const existingButton = destPanel.querySelector('.btn-success.mt-3');
        if (existingButton) {
            existingButton.remove();
        }
        destPanel.appendChild(continueButton);
    }
}

// Start navigation
function startNavigation() {
    if (state.userCurrentLocation === 0 || state.userDesiredLocation === 0) {
        speak("Please set both current location and destination first.");
        showMessage("Please set both current location and destination first", 'warning');
        return;
    }
    
    showPanel('navigation-panel');
    
    const startRoom = roomData.roomNames[state.userCurrentLocation - 1];
    const endRoom = roomData.roomNames[state.userDesiredLocation - 1];
    
    speak(`Starting navigation guidance from ${startRoom} to ${endRoom}`);
    
    // Simulate navigation calculation
    simulateNavigation(startRoom, endRoom);
}

// Simulate navigation path finding
function simulateNavigation(start, end) {
    const navigationStatus = document.getElementById('navigation-status');
    const routeStepsList = document.getElementById('route-steps');
    
    // Clear existing content
    navigationStatus.textContent = `Calculating route from ${start} to ${end}...`;
    navigationStatus.className = "alert alert-info";
    routeStepsList.innerHTML = "";
    
    // Remove any existing buttons and controls
    const existingButtons = navigationStatus.parentNode.querySelectorAll('button');
    existingButtons.forEach(button => button.remove());
    
    const existingControls = document.getElementById('auto-guidance-controls');
    if (existingControls) {
        existingControls.remove();
    }
    
    // Add "Calculate Route" button
    const calcButton = document.createElement('button');
    calcButton.textContent = "Calculate Route";
    calcButton.className = "btn btn-primary mt-3";
    
    calcButton.addEventListener('click', () => {
        // Generate route steps using Dijkstra algorithm
        const fullPath = dijkstra(start, end);
        
        if (fullPath.length === 0) {
            navigationStatus.textContent = "No route found between the selected locations.";
            navigationStatus.className = "alert alert-danger";
            speak("Sorry, no route could be found between the selected locations.");
            return;
        }
        
        state.routeSteps = fullPath;
        
        // Display route success message
        navigationStatus.textContent = `Route found! Total steps: ${fullPath.length}, Distance: ${(fullPath.length * 10)} meters`;
        navigationStatus.className = "alert alert-success";
        
        // Clear and populate route steps
        routeStepsList.innerHTML = "";
        
        fullPath.forEach((step, index) => {
            const listItem = document.createElement('div');
            listItem.className = "list-group-item d-flex justify-content-between align-items-center";
            
            // Create step content
            const stepContent = document.createElement('span');
            stepContent.innerHTML = `<strong>Step ${index + 1}:</strong> ${step}`;
            
            // Create badge
            const badge = document.createElement('span');
            if (index === 0) {
                badge.className = "badge bg-primary";
                badge.textContent = "Start";
            } else if (index === fullPath.length - 1) {
                badge.className = "badge bg-success";
                badge.textContent = "End";
            } else {
                badge.className = "badge bg-secondary";
                badge.textContent = "Via";
            }
            
            listItem.appendChild(stepContent);
            listItem.appendChild(badge);
            
            routeStepsList.appendChild(listItem);
        });
        
        // Only show automatic guidance button (removed manual option)
        const autoGuidanceButton = document.createElement('button');
        autoGuidanceButton.textContent = "Start Automatic Voice Guidance";
        autoGuidanceButton.className = "btn btn-success btn-lg mt-3 d-block mx-auto";
        autoGuidanceButton.addEventListener('click', () => {
            calcButton.remove();
            autoGuidanceButton.remove();
            startAutomaticVoiceGuidance(fullPath);
        });
        
        // Replace calculate button with automatic guidance button
        calcButton.parentNode.replaceChild(autoGuidanceButton, calcButton);
        
        // Updated announcement (removed manual option reference)
        speak("Route calculated successfully. Click to start automatic voice guidance.");
    });
    
    // Add button to navigation panel
    navigationStatus.parentNode.appendChild(calcButton);
}

// Generate a simulated path between two locations
function generateSimulatedPath(start, end) {
    const steps = [];
    
    // If both rooms are on ground floor (N series)
    if (start.startsWith('N') && start.length === 4 && end.startsWith('N') && end.length === 4) {
        const startNum = parseInt(start.substring(1));
        const endNum = parseInt(end.substring(1));
        
        if (startNum < endNum) {
            // Going forward - don't include start again
            for (let i = startNum + 1; i < endNum; i++) {
                const roomNum = i.toString().padStart(3, '0');
                steps.push(`N${roomNum}`);
            }
        } else if (startNum > endNum) {
            // Going backward - don't include start again
            for (let i = startNum - 1; i > endNum; i--) {
                const roomNum = i.toString().padStart(3, '0');
                steps.push(`N${roomNum}`);
            }
        }
        // If startNum === endNum, no intermediate steps needed
    } 
    // If going from N to NG (classroom to office)
    else if (start.startsWith('N') && end.startsWith('NG-')) {
        const startNum = parseInt(start.substring(1));
        
        if (startNum <= 3) {
            steps.push('NGT_1_and_2');  // Use first toilet as transition point
        } else if (startNum >= 6 && startNum <= 8) {
            steps.push('NGT_3_4_and_5');  // Use middle toilet as transition point
        } else {
            steps.push('NGT_6_and_7');  // Use last toilet as transition point
        }
        steps.push('Stair_GF_Left_2');  // Use left stairs to access office area
        steps.push('NG-001');  // Enter office area
    }
    // If going from NG to N (office to classroom)
    else if (start.startsWith('NG-') && end.startsWith('N')) {
        steps.push('NG-001');  // Exit office area
        steps.push('Stair_GF_Left_2');  // Use stairs
        steps.push('NGT_3_4_and_5');  // Through toilet area
    }
    
    return steps;
}

// Simulate navigation through the route
function simulateGuidance(steps) {
    let currentStep = 0;
    
    function nextStep() {
        if (currentStep < steps.length) {
            speak(`Go to ${steps[currentStep]}`);
            
            // Update current step highlight
            document.querySelectorAll('#route-steps .list-group-item').forEach((item, index) => {
                if (index === currentStep) {
                    item.classList.add('current-step');
                } else {
                    item.classList.remove('current-step');
                }
            });
            
            currentStep++;
            
            if (currentStep < steps.length) {
                setTimeout(nextStep, 3000); // Next instruction after 3 seconds
            } else {
                // Reached destination
                setTimeout(() => {
                    speak("You have arrived at your destination.");
                    state.lastInstruction = "Navigation complete";
                    
                    const navigationStatus = document.getElementById('navigation-status');
                    navigationStatus.textContent = "You have arrived at your destination!";
                }, 1000);
            }
        }
    }
    
    // Start guidance after a brief delay
    setTimeout(nextStep, 1000);
}

// Repeat last instruction
function repeatLastInstruction() {
    if (state.lastInstruction) {
        speak(state.lastInstruction);
        showMessage(`Last instruction: ${state.lastInstruction}`, 'info');
    } else {
        speak("No previous instruction to repeat.");
        showMessage("No previous instruction to repeat", 'warning');
    }
}

// Enhanced manual guidance with better step tracking
function simulateGuidanceManual(steps) {
    let currentStep = 0;
    
    // Create navigation controls
    const controlsContainer = document.createElement('div');
    controlsContainer.className = "navigation-controls d-flex gap-3 justify-content-center mt-3";
    
    const prevButton = document.createElement('button');
    prevButton.textContent = "Previous";
    prevButton.className = "btn btn-outline-secondary";
    prevButton.disabled = true;
    
    const nextButton = document.createElement('button');
    nextButton.textContent = "Next Step";
    nextButton.className = "btn btn-primary";
    
    const currentStepDisplay = document.createElement('div');
    currentStepDisplay.className = "alert alert-info mt-3";
    currentStepDisplay.textContent = "Click 'Next Step' to begin navigation";
    
    controlsContainer.appendChild(prevButton);
    controlsContainer.appendChild(nextButton);
    
    // Add controls to navigation panel
    const navigationStatus = document.getElementById('navigation-status');
    navigationStatus.parentNode.appendChild(currentStepDisplay);
    navigationStatus.parentNode.appendChild(controlsContainer);
    
    // Function to update display
    function updateStepDisplay() {
        // Update step highlighting in the route steps list
        document.querySelectorAll('#route-steps .list-group-item').forEach((item, index) => {
            item.classList.toggle('current-step', index === currentStep);
        });
        
        // Update button states
        prevButton.disabled = currentStep === 0;
        nextButton.disabled = currentStep >= steps.length;
        
        // Update button text
        if (currentStep < steps.length) {
            const truncatedName = steps[currentStep].length > 10 ? 
                steps[currentStep].substring(0, 10) + '...' : steps[currentStep];
            nextButton.textContent = `Next: ${truncatedName}`;
        } else {
            nextButton.textContent = "Navigation Complete";
        }
    }
    
    // Previous step handler
    prevButton.addEventListener('click', () => {
        if (currentStep > 0) {
            currentStep--;
            const instruction = currentStep === 0 ? 
                `You are at ${steps[0]}` : 
                getDetailedDirections(steps[currentStep - 1], steps[currentStep]);
            
            currentStepDisplay.textContent = instruction;
            speak(instruction);
            state.lastInstruction = instruction;
            updateStepDisplay();
        }
    });
    
    // Next step handler
    nextButton.addEventListener('click', () => {
        if (currentStep < steps.length) {
            let instruction;
            
            if (currentStep === 0) {
                instruction = `Starting navigation. You are currently at ${steps[0]}`;
            } else if (currentStep === steps.length - 1) {
                instruction = `Final step: Arrive at ${steps[currentStep]} - You have reached your destination!`;
            } else {
                instruction = getDetailedDirections(steps[currentStep - 1], steps[currentStep]);
            }
            
            currentStepDisplay.textContent = instruction;
            speak(instruction);
            state.lastInstruction = instruction;
            
            currentStep++;
            updateStepDisplay();
            
            if (currentStep >= steps.length) {
                setTimeout(() => {
                    currentStepDisplay.textContent = "Navigation completed! You have arrived at your destination.";
                    currentStepDisplay.className = "alert alert-success mt-3";
                }, 10000);
            }
        }
    });
    
    // Initialize display
    updateStepDisplay();
}

// Exit application
function exitApplication() {
    speak("Thank you for using Indoor Navigation Assistant! Goodbye!");
    showMessage("Thank you for using Indoor Navigation Assistant!", 'info');
    
    // Replace timeout with immediate action or add a button
    const exitButton = document.createElement('button');
    exitButton.textContent = "Exit Application";
    exitButton.className = "btn btn-danger mt-3";
    exitButton.addEventListener('click', () => {
        document.body.innerHTML = `
            <div class="container text-center mt-5">
                <h2>Indoor Navigation Assistant</h2>
                <p>Application has been closed.</p>
                <button class="btn btn-primary mt-3" onclick="location.reload()">Restart Application</button>
            </div>
        `;
    });
    
    // Add the exit button to the current panel
    const currentPanel = document.getElementById(state.currentPanel);
    if (currentPanel) {
        currentPanel.appendChild(exitButton);
    }
}

// Add this function to initialize the camera
function initCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("Camera API not supported in this browser");
        return false;
    }
    return true;
}

// JavaScript implementation of Dijkstra's algorithm based on the C++ version
function dijkstra(startRoom, endRoom) {
    const roomNames = roomData.roomNames;
    const adjList = roomData.adjList;
    
    // Find indices of start and end rooms
    const startIndex = roomNames.indexOf(startRoom);
    const endIndex = roomNames.indexOf(endRoom);
    
    if (startIndex === -1 || endIndex === -1) {
        console.log("Room not found");
        return [];
    }
    
    // Initialize distances and previous nodes
    const distances = new Array(roomNames.length).fill(Infinity);
    const previous = new Array(roomNames.length).fill(-1);
    const visited = new Array(roomNames.length).fill(false);
    
    distances[startIndex] = 0;
    
    for (let i = 0; i < roomNames.length; i++) {
        // Find unvisited node with minimum distance
        let u = -1;
        let minDist = Infinity;
        
        for (let j = 0; j < roomNames.length; j++) {
            if (!visited[j] && distances[j] < minDist) {
                minDist = distances[j];
                u = j;
            }
        }
        
        if (u === -1) break; // No more reachable nodes
        
        visited[u] = true;
        
        if (u === endIndex) break; // Reached destination
        
        // Check all neighbors of current node
        const currentRoom = roomNames[u];
        const neighbors = adjList[currentRoom] || [];
        
        for (const neighbor of neighbors) {
            const v = roomNames.indexOf(neighbor);
            if (v !== -1 && !visited[v]) {
                // Simple distance calculation (can be improved with actual distances)
                const weight = getDistance(currentRoom, neighbor);
                const newDist = distances[u] + weight;
                
                if (newDist < distances[v]) {
                    distances[v] = newDist;
                    previous[v] = u;
                }
            }
        }
    }
    
    // Reconstruct path
    if (distances[endIndex] === Infinity) {
        console.log(`No route found from ${startRoom} to ${endRoom}`);
        return [];
    }
    
    const path = [];
    let current = endIndex;
    
    while (current !== -1) {
        path.unshift(roomNames[current]);
        current = previous[current];
    }
    
    return path;
}

// Calculate distance between two rooms (simplified)
function getDistance(room1, room2) {
    // Same floor: distance 1
    // Different floors via stairs: distance 3
    // Diagonal connections: distance 2
    
    const floor1 = roomData.floors[room1];
    const floor2 = roomData.floors[room2];
    
    if (floor1 !== floor2) {
        return 3; // Stairs connection
    }
    
    // Check if it's a diagonal connection (simplified logic)
    if ((room1.includes('N00') && room2.includes('N01')) || 
        (room1.includes('N01') && room2.includes('N00'))) {
        return 2; // Diagonal classroom connection
    }
    
    return 1; // Normal adjacent connection
}

// Updated generateSimulatedPath function using Dijkstra
function generateSimulatedPath(start, end) {
    console.log(`Generating path from ${start} to ${end}`);
    
    // Use Dijkstra algorithm to find the actual shortest path
    const fullPath = dijkstra(start, end);
    
    if (fullPath.length === 0) {
        console.log("No path found");
        return [];
    }
    
    // Return the intermediate steps (excluding start and end which are already in the main route)
    return fullPath.slice(1, -1);
}

// Enhanced direction instructions based on actual room connections
function getDetailedDirections(current, next) {
    const currentFloor = roomData.floors[current];
    const nextFloor = roomData.floors[next];
    
    // Floor change instructions
    if (currentFloor !== nextFloor) {
        if (current.includes('Stair_GF') && next.includes('Stair_FF')) {
            return `Take the stairs up from ${current} to ${next} (Ground Floor to First Floor)`;
        }
        if (current.includes('Stair_FF') && next.includes('Stair_GF')) {
            return `Take the stairs down from ${current} to ${next} (First Floor to Ground Floor)`;
        }
    }
    
    // Ground Floor Classroom Navigation
    if (current.startsWith('N0') && next.startsWith('N0')) {
        const currentNum = parseInt(current.substring(1));
        const nextNum = parseInt(next.substring(1));
        
        if (nextNum > currentNum) {
            return `Walk forward along the corridor from ${current} to ${next}`;
        } else {
            return `Walk backward along the corridor from ${current} to ${next}`;
        }
    }
    
    // First Floor Classroom Navigation
    if (current.startsWith('N1') && next.startsWith('N1')) {
        const currentNum = parseInt(current.substring(1));
        const nextNum = parseInt(next.substring(1));
        
        if (nextNum > currentNum) {
            return `Walk forward along the corridor from ${current} to ${next}`;
        } else {
            return `Walk backward along the corridor from ${current} to ${next}`;
        }
    }
    
    // Office Navigation
    if (current.startsWith('NG-') && next.startsWith('NG-')) {
        return `Navigate through the ground floor office area from ${current} to ${next}`;
    }
    
    if (current.startsWith('NF-') && next.startsWith('NF-')) {
        return `Navigate through the first floor office area from ${current} to ${next}`;
    }
    
    // Toilet area navigation
    if (next.includes('GT_') || next.includes('FT_')) {
        return `Head to the restroom area: ${next}`;
    }
    
    // Stair navigation
    if (next.includes('Stair')) {
        const side = next.includes('Left') ? 'left' : 'right';
        const floor = next.includes('GF') ? 'ground floor' : 'first floor';
        return `Head to the ${side} staircase on the ${floor}: ${next}`;
    }
    
    // General navigation between different areas
    if (current.startsWith('N0') && next.startsWith('NG-')) {
        return `Exit the classroom area and enter the ground floor office area to ${next}`;
    }
    
    if (current.startsWith('NG-') && next.startsWith('N0')) {
        return `Exit the office area and enter the ground floor classroom area to ${next}`;
    }
    
    if (current.startsWith('N1') && next.startsWith('NF-')) {
        return `Exit the classroom area and enter the first floor office area to ${next}`;
    }
    
    if (current.startsWith('NF-') && next.startsWith('N1')) {
        return `Exit the office area and enter the first floor classroom area to ${next}`;
    }
    
    // Default instruction
    return `Navigate from ${current} to ${next}`;
}

// Add automatic voice guidance function
function startAutomaticVoiceGuidance(steps) {
    // Clear any existing guidance
    stopAutomaticVoiceGuidance();
    startNavigationWithCamera(steps);
    
    state.isAutoGuidanceActive = true;
    state.currentAutoStep = 0;
    state.routeSteps = steps;
    
    console.log("Starting automatic voice guidance for", steps.length, "steps");
    
    // Create automatic guidance controls
    createAutoGuidanceControls();
    
    // Start the automatic guidance
    continueAutomaticGuidance();
}

function stopAutomaticVoiceGuidance() {
    if (state.autoGuidanceTimer) {
        clearTimeout(state.autoGuidanceTimer);
        state.autoGuidanceTimer = null;
    }
    
    state.isAutoGuidanceActive = false;
    
    // Remove auto guidance controls if they exist
    const autoControls = document.getElementById('auto-guidance-controls');
    if (autoControls) {
        autoControls.remove();
    }
}

function continueAutomaticGuidance() {
    if (!state.isAutoGuidanceActive || state.currentAutoStep >= state.routeSteps.length) {
        // Guidance completed
        finishAutomaticGuidance();
        return;
    }
    
    const steps = state.routeSteps;
    const currentStep = state.currentAutoStep;
    
    // Update visual display
    updateStepHighlight(currentStep);
    
    // Generate instruction
    let instruction;
    if (currentStep === 0) {
        instruction = `Starting automatic navigation. You are currently at ${steps[0]}. Please follow the voice instructions to reach your destination.`;
    } else if (currentStep === steps.length - 1) {
        instruction = `Final step: You have arrived at ${steps[currentStep]}. You have reached your destination!`;
    } else {
        instruction = getDetailedDirections(steps[currentStep - 1], steps[currentStep]);
    }
    
    // Update display and speak
    updateAutoGuidanceDisplay(instruction, currentStep + 1, steps.length);
    speak(instruction);
    state.lastInstruction = instruction;
    
    // Move to next step
    state.currentAutoStep++;
    
    // Schedule next instruction (4 seconds between instructions)
    if (state.currentAutoStep < steps.length) {
        state.autoGuidanceTimer = setTimeout(() => {
            continueAutomaticGuidance();
        }, 9000); //  seconds between instructions
    } else {
        // Final completion
        state.autoGuidanceTimer = setTimeout(() => {
            finishAutomaticGuidance();
        }, 9000);
    }
}

function finishAutomaticGuidance() {
    const completionMessage = "Automatic navigation completed! You have successfully reached your destination. Thank you for using the Indoor Navigation Assistant.";
    
    speak("Navigation completed successfully. You have arrived at your destination. Thank you for using the Indoor Navigation Assistant.");
    
    // Update display
    updateAutoGuidanceDisplay(completionMessage, state.routeSteps.length, state.routeSteps.length, true);
    
    // Stop automatic guidance
    state.isAutoGuidanceActive = false;
    
    // Keep controls visible for a moment, then clean up
    setTimeout(() => {
        const autoControls = document.getElementById('auto-guidance-controls');
        if (autoControls) {
            // Add restart option
            const restartButton = document.createElement('button');
            restartButton.textContent = "Start New Navigation";
            restartButton.className = "btn btn-primary mt-3";
            restartButton.addEventListener('click', () => {
                showPanel('main-menu');
                stopAutomaticVoiceGuidance();
            });
            
            autoControls.appendChild(restartButton);
        }
    }, 3000);
}

function createAutoGuidanceControls() {
    // Remove any existing controls
    const existingControls = document.getElementById('auto-guidance-controls');
    if (existingControls) {
        existingControls.remove();
    }
    
    // Create new controls container
    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'auto-guidance-controls';
    controlsContainer.className = 'auto-guidance-controls mt-4 p-3 border rounded';
    
    // Progress display
    const progressDisplay = document.createElement('div');
    progressDisplay.id = 'auto-progress-display';
    progressDisplay.className = 'alert alert-info';
    progressDisplay.textContent = 'Preparing automatic guidance...';
    
    // Progress bar
    const progressBarContainer = document.createElement('div');
    progressBarContainer.className = 'progress mt-3 mb-3';
    progressBarContainer.style.height = '25px';
    
    const progressBar = document.createElement('div');
    progressBar.id = 'auto-progress-bar';
    progressBar.className = 'progress-bar progress-bar-striped progress-bar-animated';
    progressBar.style.width = '0%';
    progressBar.setAttribute('role', 'progressbar');
    progressBar.textContent = '0%';
    
    progressBarContainer.appendChild(progressBar);
    
    // Control buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'd-flex gap-2 justify-content-center';
    
    // Pause/Resume button
    const pauseResumeButton = document.createElement('button');
    pauseResumeButton.id = 'btn-pause-resume';
    pauseResumeButton.textContent = 'Pause Guidance';
    pauseResumeButton.className = 'btn btn-warning';
    pauseResumeButton.addEventListener('click', toggleAutomaticGuidance);
    
    // Stop button
    const stopButton = document.createElement('button');
    stopButton.textContent = 'Stop Guidance';
    stopButton.className = 'btn btn-danger';
    stopButton.addEventListener('click', () => {
        stopAutomaticVoiceGuidance();
        showMessage('Automatic guidance stopped by user.', 'info');
    });
    
    // Repeat current instruction button
    const repeatButton = document.createElement('button');
    repeatButton.textContent = 'Repeat Current';
    repeatButton.className = 'btn btn-secondary';
    repeatButton.addEventListener('click', () => {
        if (state.lastInstruction) {
            speak(state.lastInstruction);
        }
    });
    
    buttonContainer.appendChild(pauseResumeButton);
    buttonContainer.appendChild(repeatButton);
    buttonContainer.appendChild(stopButton);
    
    // Assemble controls
    controlsContainer.appendChild(progressDisplay);
    controlsContainer.appendChild(progressBarContainer);
    controlsContainer.appendChild(buttonContainer);
    
    // Add to navigation panel
    const navigationStatus = document.getElementById('navigation-status');
    navigationStatus.parentNode.appendChild(controlsContainer);


}

function updateAutoGuidanceDisplay(instruction, currentStep, totalSteps, isCompleted = false) {
    const progressDisplay = document.getElementById('auto-progress-display');
    const progressBar = document.getElementById('auto-progress-bar');
    
    if (progressDisplay) {
        progressDisplay.textContent = instruction;
        progressDisplay.className = isCompleted ? 'alert alert-success' : 'alert alert-info';
    }
    
    if (progressBar) {
        const percentage = Math.round((currentStep / totalSteps) * 100);
        progressBar.style.width = `${percentage}%`;
        progressBar.textContent = `Step ${currentStep} of ${totalSteps} (${percentage}%)`;
        progressBar.setAttribute('aria-valuenow', percentage);
        
        if (isCompleted) {
            progressBar.className = 'progress-bar bg-success';
        }
    }
}

function updateStepHighlight(currentStepIndex) {
    // Update step highlighting in the route steps list
    document.querySelectorAll('#route-steps .list-group-item').forEach((item, index) => {
        item.classList.toggle('current-step', index === currentStepIndex);
        
        // Add completed class for previous steps
        if (index < currentStepIndex) {
            item.classList.add('completed-step');
        } else {
            item.classList.remove('completed-step');
        }
    });
}

function toggleAutomaticGuidance() {
    const button = document.getElementById('btn-pause-resume');
    
    if (state.isAutoGuidanceActive) {
        // Pause guidance
        if (state.autoGuidanceTimer) {
            clearTimeout(state.autoGuidanceTimer);
            state.autoGuidanceTimer = null;
        }
        state.isAutoGuidanceActive = false;
        button.textContent = 'Resume Guidance';
        button.className = 'btn btn-success';
        
        speak("Automatic guidance paused. Click resume to continue.");
        showMessage('Automatic guidance paused.', 'warning');
        
    } else {
        // Resume guidance
        state.isAutoGuidanceActive = true;
        button.textContent = 'Pause Guidance';
        button.className = 'btn btn-warning';
        
        speak("Resuming automatic guidance.");
        showMessage('Automatic guidance resumed.', 'info');
        
        // Continue from current step
        continueAutomaticGuidance();
    }
}

// ===== Navigation Camera + Arrow Guidance =====
let navVideo, navCanvas, navCtx;
let navStream;
let currentStepIndex = 0;

function startNavigationWithCamera(routeSteps) {
    navVideo = document.getElementById('nav-video');
    navCanvas = document.getElementById('nav-canvas');
    navCtx = navCanvas.getContext('2d');

    navCanvas.width = navVideo.clientWidth;
    navCanvas.height = navVideo.clientHeight;

    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => {
            navStream = stream;
            navVideo.srcObject = stream;
            navVideo.setAttribute('playsinline', true);
            navVideo.play();

            requestAnimationFrame(() => renderArrow(routeSteps));
        })
        .catch(err => {
            console.error("Camera error:", err);
            document.getElementById('navigation-status').textContent = "Cannot access camera: " + err;
        });
}

const roomCoordinate = {
    // Ground Floor Classrooms
    "N001": { x: 50, y: 100 },
    "N002": { x: 150, y: 100 },
    "N003": { x: 250, y: 100 },
    "N004": { x: 350, y: 100 },
    "N005": { x: 450, y: 100 },
    "N006": { x: 550, y: 100 },
    "N007": { x: 650, y: 100 },
    "N008": { x: 750, y: 100 },
    "N009": { x: 850, y: 100 },
    "N010": { x: 950, y: 100 },
    "N011": { x: 1050, y: 100 },
    "N012": { x: 1150, y: 100 },

    // Ground Floor Offices
    "NG-001": { x: 50, y: 200 },
    "NG-002": { x: 150, y: 200 },
    // ...

    // Ground Floor Toilets
    "NGT_1_and_2": { x: 50, y: 50 },
    "NGT_3_4_and_5": { x: 500, y: 50 },
    "NGT_6_and_7": { x: 950, y: 50 },

    // Ground Floor Stairs
    "Stair_GF_Right_1": { x: 1200, y: 50 },
    "Stair_GF_Right_2": { x: 1200, y: 150 },
    "Stair_GF_Left_1": { x: 0, y: 50 },
    "Stair_GF_Left_2": { x: 0, y: 150 },

    // First Floor Classrooms
    "N101": { x: 50, y: 400 },
    "N102": { x: 150, y: 400 },
    "N103": { x: 250, y: 400 },
    "N104": { x: 350, y: 100 },
    "N105": { x: 450, y: 100 },
    "N106": { x: 550, y: 100 },
    "N107": { x: 650, y: 100 },
    "N108": { x: 750, y: 100 },
    "N109": { x: 850, y: 100 },
    "N110": { x: 950, y: 100 },
    "N111": { x: 1050, y: 100 },
    "N112": { x: 1150, y: 100 },

    // First Floor Offices
    "NF-001": { x: 50, y: 500 },
    "NF-002": { x: 150, y: 500 },
    // ...

    // First Floor Toilets
    "NFT_1_and_2": { x: 50, y: 350 },
    "NFT_3_4_and_5": { x: 500, y: 350 },
    "NFT_6_and_7": { x: 950, y: 350 },

    // First Floor Printer
    "NFP 2": { x: 600, y: 500 },

    // First Floor Stairs
    "Stair_FF_Right_1": { x: 1200, y: 400 },
    "Stair_FF_Right_2": { x: 1200, y: 500 },
    "Stair_FF_Left_1": { x: 0, y: 400 },
    "Stair_FF_Left_2": { x: 0, y: 500 },
};


function renderArrow(routeSteps) {
    if (!navVideo || navVideo.readyState !== navVideo.HAVE_ENOUGH_DATA) {
        requestAnimationFrame(() => renderArrow(routeSteps));
        return;
    }

    navCtx.clearRect(0, 0, navCanvas.width, navCanvas.height);

    navCtx.fillStyle = 'red';
    navCtx.strokeStyle = 'red';
    navCtx.lineWidth = 5;

    const centerX = navCanvas.width / 2;
    const centerY = navCanvas.height / 2;
    const arrowLength = 100;

    navCtx.beginPath();
    navCtx.moveTo(centerX - arrowLength / 2, centerY);
    navCtx.lineTo(centerX + arrowLength / 2, centerY);
    navCtx.stroke();

    navCtx.beginPath();
    navCtx.moveTo(centerX + arrowLength / 2, centerY);
    navCtx.lineTo(centerX + arrowLength / 2 - 20, centerY - 20);
    navCtx.lineTo(centerX + arrowLength / 2 - 20, centerY + 20);
    navCtx.closePath();
    navCtx.fill();

    requestAnimationFrame(() => renderArrow(routeSteps));
}
