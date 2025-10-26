// Intoxication Detection Test - JavaScript Implementation

// Global state management
let testData = {
    pvt: {
        reactionTimes: [],
        lapses: 0,
        falseStarts: 0,
        meanRT: 0,
        medianRT: 0,
        slowest10Percent: 0
    },
    trails: {
        completionTime: 0,
        errors: 0,
        interTapTimes: [],
        startTime: 0
    },
    faceTest: {
        timeInOval: 0,
        exitCount: 0,
        averageDeviation: 0,
        frameData: [],
        startTime: 0
    }
};

// Screen navigation
function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// Start test function
function startTest() {
    showScreen('pvtScreen');
    startPVT();
}

// ===== MODULE 1A - PVT (Psychomotor Vigilance Task) =====
let pvtState = {
    isRunning: false,
    startTime: 0,
    stimulusStartTime: 0,
    trialCount: 0,
    testDuration: 60000, // 1 minute in milliseconds
    nextStimulusTime: 0,
    waitingForResponse: false
};

function startPVT() {
    pvtState.isRunning = true;
    pvtState.startTime = performance.now();
    pvtState.trialCount = 0;
    pvtState.nextStimulusTime = performance.now() + getRandomInterval();
    
    // Reset test data
    testData.pvt = {
        reactionTimes: [],
        lapses: 0,
        falseStarts: 0,
        meanRT: 0,
        medianRT: 0,
        slowest10Percent: 0
    };
    
    updatePVTTimer();
    scheduleNextStimulus();
    
    // Add click listener for response
    document.addEventListener('click', handlePVTResponse);
}

function getRandomInterval() {
    return Math.random() * 8000 + 2000; // 2-10 seconds
}

function scheduleNextStimulus() {
    if (!pvtState.isRunning) return;
    
    const now = performance.now();
    const elapsed = now - pvtState.startTime;
    
    // Check if test should end based on time only
    if (elapsed >= pvtState.testDuration) {
        endPVT();
        return;
    }
    
    // Schedule next stimulus, but cap the delay to ensure we check time again soon
    const delay = Math.min(getRandomInterval(), pvtState.testDuration - elapsed);
    if (delay <= 0) {
        endPVT();
        return;
    }
    
    pvtState.nextStimulusTime = now + delay;
    setTimeout(() => {
        if (pvtState.isRunning && performance.now() - pvtState.startTime < pvtState.testDuration) {
            showStimulus();
        }
    }, delay);
}

function showStimulus() {
    if (!pvtState.isRunning) return;
    
    pvtState.stimulusStartTime = performance.now();
    pvtState.waitingForResponse = true;
    
    const stimulus = document.getElementById('pvtStimulus');
    stimulus.textContent = Math.floor(Math.random() * 9) + 1; // Random number 1-9
    stimulus.style.display = 'block';
    
    // Update status
    document.getElementById('pvtStatus').textContent = 'Tap now!';
}

function handlePVTResponse(event) {
    if (!pvtState.waitingForResponse) {
        // False start
        testData.pvt.falseStarts++;
        return;
    }
    
    const reactionTime = performance.now() - pvtState.stimulusStartTime;
    testData.pvt.reactionTimes.push(reactionTime);
    
    // Check for lapse (>500ms)
    if (reactionTime > 500) {
        testData.pvt.lapses++;
    }
    
    // Hide stimulus
    document.getElementById('pvtStimulus').style.display = 'none';
    document.getElementById('pvtStatus').textContent = 'Good!';
    
    pvtState.waitingForResponse = false;
    pvtState.trialCount++;
    
    // Schedule next stimulus
    setTimeout(() => {
        if (pvtState.isRunning) {
            document.getElementById('pvtStatus').textContent = 'Get ready...';
            scheduleNextStimulus();
        }
    }, 1000);
}

function updatePVTTimer() {
    if (!pvtState.isRunning) return;
    
    const elapsed = performance.now() - pvtState.startTime;
    const remaining = Math.max(0, pvtState.testDuration - elapsed);
    
    // Check if time is up
    if (remaining <= 0) {
        endPVT();
        return;
    }
    
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    const remainingSeconds = Math.ceil(remaining / 1000);
    
    document.getElementById('pvtTimer').textContent = 
        `Time: ${minutes}:${seconds.toString().padStart(2, '0')} (${remainingSeconds}s remaining)`;
    
    requestAnimationFrame(updatePVTTimer);
}

function endPVT() {
    pvtState.isRunning = false;
    document.removeEventListener('click', handlePVTResponse);
    
    // Calculate metrics
    calculatePVTMetrics();
    
    // Show completion message
    document.getElementById('pvtStatus').textContent = 'PVT Complete!';
    
    // Auto-advance to Trail Making Test
    setTimeout(() => {
        showScreen('trailsScreen');
        startTrails();
    }, 2000);
}

function calculatePVTMetrics() {
    const reactions = testData.pvt.reactionTimes;
    if (reactions.length === 0) return;
    
    // Sort reactions
    const sortedReactions = [...reactions].sort((a, b) => a - b);
    
    // Calculate mean
    testData.pvt.meanRT = reactions.reduce((sum, rt) => sum + rt, 0) / reactions.length;
    
    // Calculate median
    const mid = Math.floor(sortedReactions.length / 2);
    testData.pvt.medianRT = sortedReactions.length % 2 === 0 
        ? (sortedReactions[mid - 1] + sortedReactions[mid]) / 2
        : sortedReactions[mid];
    
    // Calculate 10% slowest
    const slowCount = Math.ceil(sortedReactions.length * 0.1);
    const slowest = sortedReactions.slice(-slowCount);
    testData.pvt.slowest10Percent = slowest.reduce((sum, rt) => sum + rt, 0) / slowest.length;
}

// ===== MODULE 1B - TRAIL MAKING TEST =====
let trailsState = {
    circles: [],
    currentTarget: 1,
    startTime: 0,
    isComplete: false
};

function startTrails() {
    trailsState.currentTarget = 1;
    trailsState.startTime = performance.now();
    trailsState.isComplete = false;
    
    // Reset test data
    testData.trails = {
        completionTime: 0,
        errors: 0,
        interTapTimes: [],
        startTime: 0
    };
    
    generateCircles();
    updateTrailsStatus();
}

function generateCircles() {
    const container = document.getElementById('trailsContainer');
    container.innerHTML = '';
    trailsState.circles = [];
    
    const containerRect = container.getBoundingClientRect();
    const circleRadius = 25;
    const minDistance = 70;
    
    for (let i = 1; i <= 12; i++) {
        let attempts = 0;
        let position;
        
        do {
            position = {
                x: Math.random() * (containerRect.width - 100) + 50,
                y: Math.random() * (containerRect.height - 100) + 50
            };
            attempts++;
        } while (attempts < 100 && !isValidPosition(position, trailsState.circles, minDistance));
        
        const circle = document.createElement('div');
        circle.className = 'trail-circle';
        circle.textContent = i;
        circle.style.left = position.x + 'px';
        circle.style.top = position.y + 'px';
        circle.onclick = () => handleCircleClick(i);
        
        // Hide all numbers except 1 initially
        if (i !== 1) {
            circle.style.display = 'none';
        }
        
        container.appendChild(circle);
        trailsState.circles.push({ element: circle, number: i, position });
    }
}

function isValidPosition(newPos, existingCircles, minDistance) {
    return existingCircles.every(circle => {
        const distance = Math.sqrt(
            Math.pow(newPos.x - circle.position.x, 2) + 
            Math.pow(newPos.y - circle.position.y, 2)
        );
        return distance >= minDistance;
    });
}

function handleCircleClick(clickedNumber) {
    if (trailsState.isComplete) return;
    
    const currentTime = performance.now();
    
    if (clickedNumber === trailsState.currentTarget) {
        // Correct tap
        const circle = trailsState.circles.find(c => c.number === clickedNumber);
        circle.element.style.display = 'none'; // Make circle disappear
        
        // If this is the first click (number 1), show all remaining numbers
        if (clickedNumber === 1) {
            trailsState.circles.forEach(c => {
                if (c.number !== 1) {
                    c.element.style.display = 'flex';
                }
            });
        }
        
        // Record inter-tap time
        if (trailsState.currentTarget > 1) {
            const lastTapTime = testData.trails.interTapTimes[testData.trails.interTapTimes.length - 1] || trailsState.startTime;
            testData.trails.interTapTimes.push(currentTime - lastTapTime);
        }
        
        trailsState.currentTarget++;
        
        if (trailsState.currentTarget > 12) {
            // Test complete
            completeTrails();
        } else {
            // Don't highlight next circle - user must find it themselves
            updateTrailsStatus();
        }
    } else {
        // Error
        testData.trails.errors++;
        updateTrailsStatus();
    }
}

function updateTrailsStatus() {
    const status = document.getElementById('trailsStatus');
    if (trailsState.isComplete) {
        status.textContent = 'Trail Making Test Complete!';
    } else if (trailsState.currentTarget === 1) {
        status.textContent = 'Tap circle 1 to begin and reveal all numbers';
    } else {
        status.textContent = `Tap circle ${trailsState.currentTarget} to continue`;
    }
}

function completeTrails() {
    trailsState.isComplete = true;
    testData.trails.completionTime = performance.now() - trailsState.startTime;
    
    updateTrailsStatus();
    document.getElementById('completeModule1').style.display = 'block';
}

function completeModule1() {
    showScreen('faceScreen');
    startFaceTest();
}

// ===== MODULE 2 - FACE DETECTION =====
function completeModule2() {
    showScreen('module3Screen');
}

function completeModule3() {
    showScreen('resultsScreen');
    displayResults();
}

// ===== RESULTS PAGE =====
function displayResults() {
    const resultsContent = document.getElementById('resultsContent');
    
    let html = '<h3>Test Results</h3>';
    
    // PVT Results
    html += '<h4>Module 1A - Reaction Time Test (PVT)</h4>';
    html += '<ul>';
    html += `<li>Mean Reaction Time: ${testData.pvt.meanRT.toFixed(0)}ms</li>`;
    html += `<li>Lapses (>500ms): ${testData.pvt.lapses}</li>`;
    html += `<li>False Starts: ${testData.pvt.falseStarts}</li>`;
    html += '</ul>';
    
    // Trails Results
    html += '<h4>Module 1B - Trail Making Test</h4>';
    html += '<ul>';
    html += `<li>Completion Time: ${(testData.trails.completionTime / 1000).toFixed(1)}s</li>`;
    html += `<li>Errors: ${testData.trails.errors}</li>`;
    html += '</ul>';
    
    resultsContent.innerHTML = html;
}

// ===== ERROR HANDLING =====
function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    showScreen('errorScreen');
}

// ===== UTILITY FUNCTIONS =====
function restartTest() {
    // Reset all state
    testData = {
        pvt: { reactionTimes: [], lapses: 0, falseStarts: 0, meanRT: 0, medianRT: 0, slowest10Percent: 0 },
        trails: { completionTime: 0, errors: 0, interTapTimes: [], startTime: 0 },
        faceTest: { timeInOval: 0, exitCount: 0, averageDeviation: 0, frameData: [], startTime: 0 }
    };
    
    pvtState = {
        isRunning: false,
        startTime: 0,
        stimulusStartTime: 0,
        trialCount: 0,
        testDuration: 60000,
        nextStimulusTime: 0,
        waitingForResponse: false
    };
    
    trailsState = {
        circles: [],
        currentTarget: 1,
        startTime: 0,
        isComplete: false
    };
    
    // Reset face detection state
    faceState = {
        faceDetector: null,
        video: null,
        stream: null,
        isRunning: false,
        isInsideOval: false,
        consecutiveTime: 0,
        animationFrameId: null,
        startTime: 0
    };
    
    // Reset UI elements
    document.getElementById('pvtStimulus').style.display = 'none';
    document.getElementById('completeModule1').style.display = 'none';
    
    showScreen('startScreen');
}

// ===== MODULE 2 - FACE DETECTION =====
let faceState = {
    faceDetector: null,
    video: null,
    stream: null,
    isRunning: false,
    isInsideOval: false,
    consecutiveTime: 0,
    animationFrameId: null,
    startTime: 0
};

async function initializeFaceDetection() {
    try {
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        
        faceState.faceDetector = await FaceDetector.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
                delegate: "GPU"
            },
            runningMode: "VIDEO"
        });
        
        return true;
    } catch (error) {
        console.error('Face detection initialization error:', error);
        showError('Failed to initialize face detection. Please check your connection and try again.');
        return false;
    }
}

async function startFaceTest() {
    try {
        // Get video element
        faceState.video = document.getElementById('video');
        
        // Request camera access
        faceState.stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: 'user',
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        });
        
        faceState.video.srcObject = faceState.stream;
        
        // Wait for video to be ready
        await new Promise((resolve) => {
            faceState.video.onloadedmetadata = () => {
                faceState.video.play();
                resolve();
            };
        });
        
        // Initialize MediaPipe Face Detector
        const initialized = await initializeFaceDetection();
        if (!initialized) {
            return;
        }
        
        // Reset state
        faceState.isRunning = true;
        faceState.isInsideOval = false;
        faceState.consecutiveTime = 0;
        faceState.startTime = performance.now();
        
        // Reset test data
        testData.faceTest = {
            timeInOval: 0,
            exitCount: 0,
            averageDeviation: 0,
            frameData: [],
            startTime: performance.now()
        };
        
        // Reset UI
        document.getElementById('faceStatus').textContent = 'Position your face in the oval';
        document.getElementById('faceStatus').className = 'face-status outside';
        document.getElementById('faceTimer').textContent = 'Time: 10s';
        document.getElementById('faceProgress').textContent = 'Progress: 0%';
        
        // Start detection loop
        detectFaceInFrame();
        
    } catch (error) {
        console.error('Face test error:', error);
        showError('Camera access required. Please enable camera permissions and refresh the page.');
    }
}

function detectFaceInFrame() {
    if (!faceState.isRunning || !faceState.faceDetector) return;
    
    const video = faceState.video;
    const nowInMs = performance.now();
    
    // Run detection
    const detections = faceState.faceDetector.detectForVideo(video, nowInMs);
    
    if (detections.detections.length > 0) {
        const detection = detections.detections[0];
        const bbox = detection.boundingBox;
        
        // Calculate face center point
        const faceCenterX = bbox.originX + bbox.width / 2;
        const faceCenterY = bbox.originY + bbox.height / 2;
        
        // Check if face is inside oval
        const isInside = isPointInOval(faceCenterX, faceCenterY);
        
        // Update state
        if (isInside) {
            if (!faceState.isInsideOval) {
                faceState.isInsideOval = true;
                faceState.consecutiveTime = performance.now();
                document.getElementById('faceStatus').textContent = 'Face Inside - Hold Still!';
                document.getElementById('faceStatus').className = 'face-status inside';
                
                // Update oval border color
                document.querySelector('.face-oval-overlay').classList.remove('outside');
                document.querySelector('.face-oval-overlay').classList.add('inside');
            }
            
            // Update timer
            const timeInside = (performance.now() - faceState.consecutiveTime) / 1000;
            const remaining = 10 - timeInside;
            
            if (remaining > 0) {
                document.getElementById('faceTimer').textContent = `Time: ${remaining.toFixed(1)}s`;
                const progress = ((10 - remaining) / 10) * 100;
                document.getElementById('faceProgress').textContent = `Progress: ${progress.toFixed(0)}%`;
            } else {
                // Success! Move to Module 3
                faceState.isRunning = false;
                document.getElementById('faceStatus').textContent = 'Complete! Moving to next module...';
                document.getElementById('faceStatus').className = 'face-status inside';
                
                if (faceState.stream) {
                    faceState.stream.getTracks().forEach(track => track.stop());
                }
                
                setTimeout(() => {
                    completeModule2();
                }, 1500);
                return;
            }
        } else {
            // Face exited oval - reset timer
            if (faceState.isInsideOval) {
                faceState.isInsideOval = false;
                testData.faceTest.exitCount++;
                
                document.getElementById('faceStatus').textContent = 'Face Outside - Move back into the oval';
                document.getElementById('faceStatus').className = 'face-status outside';
                
                // Update oval border color
                document.querySelector('.face-oval-overlay').classList.remove('inside');
                document.querySelector('.face-oval-overlay').classList.add('outside');
                
                document.getElementById('faceTimer').textContent = 'Time: 10s';
                document.getElementById('faceProgress').textContent = 'Progress: 0%';
            }
        }
    } else {
        // No face detected
        if (faceState.isInsideOval) {
            faceState.isInsideOval = false;
        }
        document.getElementById('faceStatus').textContent = 'No Face Detected';
        document.getElementById('faceStatus').className = 'face-status outside';
        
        // Update oval border color
        document.querySelector('.face-oval-overlay').classList.remove('inside');
        document.querySelector('.face-oval-overlay').classList.add('outside');
    }
    
    // Continue detection loop
    faceState.animationFrameId = requestAnimationFrame(detectFaceInFrame);
}

function isPointInOval(x, y) {
    const video = faceState.video;
    const videoRect = video.getBoundingClientRect();
    
    // Get oval overlay element
    const ovalOverlay = document.querySelector('.face-oval-overlay');
    const ovalRect = ovalOverlay.getBoundingClientRect();
    
    // Oval dimensions from CSS (280px × 380px)
    const ovalWidth = 280;
    const ovalHeight = 380;
    
    // Calculate oval center relative to video element
    const ovalCenterX = (ovalRect.left - videoRect.left + ovalWidth / 2);
    const ovalCenterY = (ovalRect.top - videoRect.top + ovalHeight / 2);
    
    // Calculate if point is inside ellipse
    // Account for video mirror transform (scaleX(-1))
    const xRelative = x - ovalCenterX;
    const yRelative = y - ovalCenterY;
    
    const a = ovalWidth / 2;  // Semi-major axis (horizontal)
    const b = ovalHeight / 2; // Semi-minor axis (vertical)
    
    // Ellipse equation: (x/a)² + (y/b)² <= 1
    const ellipseValue = Math.pow(xRelative / a, 2) + Math.pow(yRelative / b, 2);
    
    return ellipseValue <= 1;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    showScreen('startScreen');
    
    // Initialize oval overlay with default state
    const ovalOverlay = document.querySelector('.face-oval-overlay');
    if (ovalOverlay) {
        ovalOverlay.classList.add('outside');
    }
});
