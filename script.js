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
    maxTrials: 30,
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
    
    // Check if test should end
    if (elapsed >= pvtState.testDuration || pvtState.trialCount >= pvtState.maxTrials) {
        endPVT();
        return;
    }
    
    // Schedule next stimulus
    pvtState.nextStimulusTime = now + getRandomInterval();
    setTimeout(showStimulus, pvtState.nextStimulusTime - now);
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
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    document.getElementById('pvtTimer').textContent = 
        `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    
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

// ===== MODULE 2 - FACE STABILIZATION TEST =====
let faceState = {
    isRunning: false,
    startTime: 0,
    faceMesh: null,
    video: null,
    canvas: null,
    camera: null,
    timeInOval: 0,
    lastFrameTime: 0,
    facePositions: []
};

async function startFaceTest() {
    try {
        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: 'user',
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        });
        
        faceState.video = document.getElementById('video');
        faceState.video.srcObject = stream;
        
        // Initialize MediaPipe Face Mesh
        await initializeFaceMesh();
        
        faceState.isRunning = true;
        faceState.startTime = performance.now();
        faceState.timeInOval = 0;
        faceState.facePositions = [];
        
        // Reset test data
        testData.faceTest = {
            timeInOval: 0,
            exitCount: 0,
            averageDeviation: 0,
            frameData: [],
            startTime: 0
        };
        
        updateFaceTimer();
        processFaceFrames();
        
    } catch (error) {
        showError('Camera access required. Please enable camera permissions and refresh the page.');
    }
}

async function initializeFaceMesh() {
    try {
        faceState.faceMesh = new FaceMesh({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            }
        });
        
        faceState.faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        
        faceState.faceMesh.onResults(onFaceResults);
        
    } catch (error) {
        showError('Face detection unavailable. Please check your internet connection.');
    }
}

function onFaceResults(results) {
    if (!faceState.isRunning) return;
    
    const currentTime = performance.now();
    const elapsed = currentTime - faceState.startTime;
    
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];
        const faceCenter = calculateFaceCenter(landmarks);
        
        // Check if face is in oval
        const isInOval = isFaceInOval(faceCenter);
        
        if (isInOval) {
            faceState.timeInOval += currentTime - faceState.lastFrameTime;
            document.getElementById('faceStatus').textContent = 'INSIDE';
            document.getElementById('faceStatus').className = 'face-status inside';
        } else {
            document.getElementById('faceStatus').textContent = 'OUTSIDE';
            document.getElementById('faceStatus').className = 'face-status outside';
        }
        
        // Record frame data
        faceState.facePositions.push({
            time: currentTime,
            center: faceCenter,
            inOval: isInOval
        });
        
        // Update progress
        const progress = Math.min((faceState.timeInOval / 10000) * 100, 100);
        document.getElementById('faceProgress').textContent = `Progress: ${progress.toFixed(1)}%`;
        
        // Check if test is complete
        if (faceState.timeInOval >= 10000) {
            completeFaceTest();
        }
    }
    
    faceState.lastFrameTime = currentTime;
}

function calculateFaceCenter(landmarks) {
    // Use key facial landmarks to calculate center
    const leftEye = landmarks[33];
    const rightEye = landmarks[362];
    const nose = landmarks[1];
    
    return {
        x: (leftEye.x + rightEye.x + nose.x) / 3,
        y: (leftEye.y + rightEye.y + nose.y) / 3
    };
}

function isFaceInOval(faceCenter) {
    const video = faceState.video;
    const videoRect = video.getBoundingClientRect();
    
    // Convert normalized coordinates to pixel coordinates
    const faceX = faceCenter.x * videoRect.width;
    const faceY = faceCenter.y * videoRect.height;
    
    // Oval center and dimensions
    const ovalCenterX = videoRect.width / 2;
    const ovalCenterY = videoRect.height / 2;
    const ovalWidth = 250;
    const ovalHeight = 350;
    
    // Check if face center is within oval bounds
    const dx = (faceX - ovalCenterX) / (ovalWidth / 2);
    const dy = (faceY - ovalCenterY) / (ovalHeight / 2);
    
    return (dx * dx + dy * dy) <= 1;
}

function processFaceFrames() {
    if (!faceState.isRunning) return;
    
    if (faceState.video && faceState.faceMesh) {
        faceState.faceMesh.send({ image: faceState.video });
    }
    
    requestAnimationFrame(processFaceFrames);
}

function updateFaceTimer() {
    if (!faceState.isRunning) return;
    
    const elapsed = performance.now() - faceState.startTime;
    const seconds = Math.floor(elapsed / 1000);
    const milliseconds = Math.floor((elapsed % 1000) / 10);
    
    document.getElementById('faceTimer').textContent = 
        `Time: ${seconds}:${milliseconds.toString().padStart(2, '0')}`;
    
    requestAnimationFrame(updateFaceTimer);
}

function completeFaceTest() {
    faceState.isRunning = false;
    
    // Stop camera
    if (faceState.video && faceState.video.srcObject) {
        const tracks = faceState.video.srcObject.getTracks();
        tracks.forEach(track => track.stop());
    }
    
    // Calculate final metrics
    calculateFaceMetrics();
    
    document.getElementById('faceStatus').textContent = 'COMPLETE';
    document.getElementById('faceStatus').className = 'face-status inside';
    document.getElementById('completeModule2').style.display = 'block';
}

function calculateFaceMetrics() {
    const totalTime = performance.now() - faceState.startTime;
    const timeInOvalPercent = (faceState.timeInOval / totalTime) * 100;
    
    // Count exits
    let exitCount = 0;
    let wasInOval = false;
    
    faceState.facePositions.forEach(frame => {
        if (wasInOval && !frame.inOval) {
            exitCount++;
        }
        wasInOval = frame.inOval;
    });
    
    // Calculate average deviation
    const deviations = faceState.facePositions.map(frame => {
        const video = faceState.video;
        const videoRect = video.getBoundingClientRect();
        const faceX = frame.center.x * videoRect.width;
        const faceY = frame.center.y * videoRect.height;
        const ovalCenterX = videoRect.width / 2;
        const ovalCenterY = videoRect.height / 2;
        
        return Math.sqrt(
            Math.pow(faceX - ovalCenterX, 2) + 
            Math.pow(faceY - ovalCenterY, 2)
        );
    });
    
    const averageDeviation = deviations.length > 0 
        ? deviations.reduce((sum, dev) => sum + dev, 0) / deviations.length 
        : 0;
    
    // Store results
    testData.faceTest = {
        timeInOval: timeInOvalPercent,
        exitCount: exitCount,
        averageDeviation: averageDeviation,
        frameData: faceState.facePositions,
        startTime: faceState.startTime
    };
}

function completeModule2() {
    showScreen('module3Screen');
}

// ===== MODULE 3 - PLACEHOLDER =====
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
    
    // Face Test Results
    html += '<h4>Module 2 - Face Stabilization</h4>';
    html += '<ul>';
    html += `<li>Time in Oval: ${testData.faceTest.timeInOval.toFixed(1)}%</li>`;
    html += `<li>Exit Count: ${testData.faceTest.exitCount}</li>`;
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
        maxTrials: 30,
        testDuration: 120000,
        nextStimulusTime: 0,
        waitingForResponse: false
    };
    
    trailsState = {
        circles: [],
        currentTarget: 1,
        startTime: 0,
        isComplete: false
    };
    
    faceState = {
        isRunning: false,
        startTime: 0,
        faceMesh: null,
        video: null,
        canvas: null,
        camera: null,
        timeInOval: 0,
        lastFrameTime: 0,
        facePositions: []
    };
    
    // Reset UI elements
    document.getElementById('pvtStimulus').style.display = 'none';
    document.getElementById('completeModule1').style.display = 'none';
    document.getElementById('completeModule2').style.display = 'none';
    
    showScreen('startScreen');
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    showScreen('startScreen');
});
