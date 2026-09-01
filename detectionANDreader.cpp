#define _HAS_STD_BYTE 0
#include "detectionANDreader.h"
#include <iomanip>

// constructor initialize function
LocationQRDetector::LocationQRDetector(bool debug)
    : debugMode(debug),
    stableFramesRequired(3),
    cameraResolution(640, 480),
    locationDetected(false),
    validFrameCount(0),
    detectedColor(""),
    currentLocation("")
{
    // Updated color ranges for location detection
    // (Lower HSV boundary for blue), (Upper HSV boundary for blue), colour label, name, output of the drawing
    colorRanges = {
        /// Purple 
        {{140, 100, 70}, {165, 255, 255}, "purple", "NF-001 Office Outside", {255, 0, 255}},

        // Blue 
        {{100, 50, 50}, {130, 255, 255}, "blue", "N001 Classroom Outside", {255, 0, 0}},

        // Orange 
        {{5, 80, 80}, {30, 255, 255}, "orange", "Office Ground Floor Toilet", {0, 165, 255}},

        // Red (lower range)
        {{0, 120, 120}, {10, 255, 255}, "red", "Stair Beside N104", {0, 0, 255} },

        // Red (upper range)
        {{170, 120, 120}, {179, 255, 255}, "red", "Stair Beside N104", {0, 0, 255}}

        };

    initializeScanningFrame();
    cout << "Location QR Detector initialized" << endl;
    cout << "Supported locations:" << endl;
    for (const auto& range : colorRanges) {
        cout << "- " << range.label << " QR -> " << range.location << endl;
    }
}

// same initialize the scanning range 
void LocationQRDetector::initializeScanningFrame() {
    // Create scanning frame in center of screen
    int frameSize = 250;
    int centerX = cameraResolution.width / 2;
    int centerY = cameraResolution.height / 2;

    scanningFrame = Rect(
        centerX - frameSize / 2,
        centerY - frameSize / 2,
        frameSize,
        frameSize
    );

    cout << "Scanning frame: " << scanningFrame.width << "x" << scanningFrame.height << " pixels" << endl;
}

// Detect color and determine location
    // detect the colour then list the location, combined colorRanges vector 
pair<bool, pair<string, string>> LocationQRDetector::detectColorAndLocation(Mat& roi) {
    if (roi.empty() || roi.rows < 10 || roi.cols < 10) {
        return make_pair(false, make_pair("", ""));
    }

    Mat hsvRoi;
    try {
        cvtColor(roi, hsvRoi, COLOR_BGR2HSV);
    }
    catch (const cv::Exception& e) {
        if (debugMode) cout << "HSV conversion error: " << e.what() << endl;
        return make_pair(false, make_pair("", ""));
    }

    // Check all color ranges to determine location
    for (const auto& colorRange : colorRanges) {
        Mat colorMask;
        try {
            inRange(hsvRoi, colorRange.lower, colorRange.upper, colorMask);
            int colorPixels = countNonZero(colorMask);
            int totalPixels = roi.rows * roi.cols;
            double colorPercentage = colorPixels * 100.0 / totalPixels;

            if (debugMode) {
                cout << colorRange.label << " coverage: " << fixed << setprecision(2)
                    << colorPercentage << "%" << endl;
            }

            // If we find significant color coverage, determine location
            if (colorPercentage > 1.0) { // Threshold for color detection
                if (debugMode) {
                    cout << "SUCCESS: " << colorRange.label << " QR detected ("
                        << colorPercentage << "%)" << endl;
                    cout << "Location: " << colorRange.location << endl;
                }
                return make_pair(true, make_pair(colorRange.label, colorRange.location));
            }
        }
        catch (const cv::Exception& e) {
            if (debugMode) cout << "Color detection error: " << e.what() << endl;
            continue;
        }
    }

    return make_pair(false, make_pair("", ""));
}

// draw the frame 
void LocationQRDetector::drawScanningFrame(Mat& frame) {
    // Main scanning frame - green when location detected, orange when searching
    Scalar frameColor = locationDetected ? Scalar(0, 255, 0) : Scalar(255, 200, 0);
    rectangle(frame, scanningFrame, frameColor, 4);

    // Corner alignment guides
    int cornerLength = 30;
    int cornerThickness = 3;
    Scalar cornerColor = Scalar(0, 255, 255); // Yellow corners

    // Draw corners (top-left, top-right, bottom-left, bottom-right)
    // Top-left
    line(frame, Point(scanningFrame.x, scanningFrame.y),
        Point(scanningFrame.x + cornerLength, scanningFrame.y), cornerColor, cornerThickness);
    line(frame, Point(scanningFrame.x, scanningFrame.y),
        Point(scanningFrame.x, scanningFrame.y + cornerLength), cornerColor, cornerThickness);

    // Top-right
    line(frame, Point(scanningFrame.x + scanningFrame.width, scanningFrame.y),
        Point(scanningFrame.x + scanningFrame.width - cornerLength, scanningFrame.y), cornerColor, cornerThickness);
    line(frame, Point(scanningFrame.x + scanningFrame.width, scanningFrame.y),
        Point(scanningFrame.x + scanningFrame.width, scanningFrame.y + cornerLength), cornerColor, cornerThickness);

    // Bottom-left
    line(frame, Point(scanningFrame.x, scanningFrame.y + scanningFrame.height),
        Point(scanningFrame.x + cornerLength, scanningFrame.y + scanningFrame.height), cornerColor, cornerThickness);
    line(frame, Point(scanningFrame.x, scanningFrame.y + scanningFrame.height),
        Point(scanningFrame.x, scanningFrame.y + scanningFrame.height - cornerLength), cornerColor, cornerThickness);

    // Bottom-right
    line(frame, Point(scanningFrame.x + scanningFrame.width, scanningFrame.y + scanningFrame.height),
        Point(scanningFrame.x + scanningFrame.width - cornerLength, scanningFrame.y + scanningFrame.height), cornerColor, cornerThickness);
    line(frame, Point(scanningFrame.x + scanningFrame.width, scanningFrame.y + scanningFrame.height),
        Point(scanningFrame.x + scanningFrame.width, scanningFrame.y + scanningFrame.height - cornerLength), cornerColor, cornerThickness);

    // Center crosshair
    Point center(scanningFrame.x + scanningFrame.width / 2, scanningFrame.y + scanningFrame.height / 2);
    line(frame, Point(center.x - 15, center.y), Point(center.x + 15, center.y), Scalar(0, 255, 255), 2);
    line(frame, Point(center.x, center.y - 15), Point(center.x, center.y + 15), Scalar(0, 255, 255), 2);
}

// when you scanning the qr then show the details 
void LocationQRDetector::drawLocationInfo(Mat& frame) {
    // Status panel background
    rectangle(frame, Point(10, 10), Point(400, 100), Scalar(0, 0, 0), -1);
    rectangle(frame, Point(10, 10), Point(400, 100), Scalar(255, 255, 255), 2);

    if (locationDetected && validFrameCount >= stableFramesRequired) {
        // Success status
        putText(frame, "LOCATION DETECTED!", Point(20, 35),
            FONT_HERSHEY_SIMPLEX, 0.7, Scalar(0, 255, 0), 2);
        putText(frame, "Color: " + detectedColor, Point(20, 55),
            FONT_HERSHEY_SIMPLEX, 0.5, Scalar(255, 255, 255), 1);
        putText(frame, "Location: " + currentLocation, Point(20, 75),
            FONT_HERSHEY_SIMPLEX, 0.5, Scalar(255, 255, 255), 1);

        // Large success indicator with auto-exit message
        rectangle(frame, Point(frame.cols / 2 - 150, 120), Point(frame.cols / 2 + 150, 160),
            Scalar(0, 255, 0), -1);
        putText(frame, "CONFIRMED - EXITING...", Point(frame.cols / 2 - 140, 145),
            FONT_HERSHEY_SIMPLEX, 0.7, Scalar(0, 0, 0), 2);
    }
    else {
        // Searching status
        putText(frame, "Scanning for QR code...", Point(20, 35),
            FONT_HERSHEY_SIMPLEX, 0.6, Scalar(255, 255, 0), 2);
        putText(frame, "Align QR within frame", Point(20, 55),
            FONT_HERSHEY_SIMPLEX, 0.4, Scalar(255, 255, 255), 1);

        // Show supported colors
        string supportedColors = "Purple|Blue|Orange|Red";
        putText(frame, "Colors: " + supportedColors, Point(20, 75),
            FONT_HERSHEY_SIMPLEX, 0.4, Scalar(200, 200, 200), 1);
    }

    // Instructions - updated to remove spacebar instruction
    putText(frame, "Auto-exit on detection | Q to quit | D for debug",
        Point(10, frame.rows - 15), FONT_HERSHEY_SIMPLEX, 0.4, Scalar(255, 255, 255), 1);
}

// Main QR processing function
    // for qr reader processing and combine detectAndDecode() function
pair<string, bool> LocationQRDetector::processLocationQRInFrame(Mat& frame) {
    // Extract scanning region
        Mat scanningROI = frame(scanningFrame);

    // Detect QR code
    vector<Point> points;
    string qrData = "";

    try {
        qrData = qrDecoder.detectAndDecode(scanningROI, points);
    }
    catch (const cv::Exception& e) {
        if (debugMode) cout << "QR decode error: " << e.what() << endl;
        return make_pair("", false);
    }

    if (!qrData.empty() && points.size() == 4) {
        // QR detected, now check for color and determine location
        auto colorResult = detectColorAndLocation(scanningROI);
        bool hasValidColor = colorResult.first;
        string colorLabel = colorResult.second.first;
        string location = colorResult.second.second;

        // SEAN PART
        allowedContent[0] = "Welcome to UCCC2513 Mini Project -- Blue QR -- N001 Classroom Outside";
        allowedContent[1] = "Welcome to UCCC2513 Mini Project -- Red QR -- Stair Beside N104";
        allowedContent[2] = "Welcome to UCCC2513 Mini Project -- Orange QR -- Office Ground Floor Toilet";
        allowedContent[3] = "Welcome to UCCC2513 Mini Project -- Purple QR -- NF-001 Office Outside";
        bool WhetherOurQR = (qrData == allowedContent[0] || qrData == allowedContent[1] || qrData == allowedContent[2] || qrData == allowedContent[3]);

        if (hasValidColor && WhetherOurQR) {
            detectedColor = colorLabel;
            currentLocation = location;

            if (debugMode) {
                cout << "SUCCESS: " << colorLabel << " QR found!" << endl;
                cout << "Location: " << location << endl;
                cout << "QR Data: " << qrData << endl;
            }

            // Adjust points to full frame coordinates
            for (auto& point : points) {
                point.x += scanningFrame.x;
                point.y += scanningFrame.y;
            }

            // Draw success outline
            polylines(frame, points, true, Scalar(0, 255, 0), 3);

            // Show location text near QR
            putText(frame, location, Point(scanningFrame.x, scanningFrame.y - 10),
                FONT_HERSHEY_SIMPLEX, 0.5, Scalar(0, 255, 0), 2);

            return make_pair(qrData, true);
        }
        else {
            // QR detected but no recognizable color
            for (auto& point : points) {
                point.x += scanningFrame.x;
                point.y += scanningFrame.y;
            }
            polylines(frame, points, true, Scalar(0, 0, 255), 2);

            putText(frame, "QR found but unrecognized color!",
                Point(scanningFrame.x, scanningFrame.y - 25),
                FONT_HERSHEY_SIMPLEX, 0.4, Scalar(0, 0, 255), 2);

            if (debugMode) {
                cout << "QR detected but no recognized color: " << qrData << endl;
            }
        }
    }

    return make_pair("", false);
}

// output the video
VideoCapture LocationQRDetector::initializeCamera() {
    VideoCapture cap;
    bool cameraFound = false;

    vector<int> cameraIndices = { 0, 1, 2 };

    for (int index : cameraIndices) {
        cout << "Testing camera " << index << "..." << endl;
        cap.open(index);

        if (cap.isOpened()) {
            Mat testFrame;
            cap >> testFrame;
            if (!testFrame.empty()) {
                cout << "Camera " << index << " ready!" << endl;
                cameraFound = true;
                cap.set(CAP_PROP_FRAME_WIDTH, cameraResolution.width);
                cap.set(CAP_PROP_FRAME_HEIGHT, cameraResolution.height);
                cap.set(CAP_PROP_FPS, 30);
                break;
            }
            else {
                cap.release();
            }
        }
    }

    if (!cameraFound) {
        cout << "Error: No camera available!" << endl;
    }

    return cap;
}

// initialize then ,combined function initializeCamera();drawScanningFrame(frame); drawLocationInfo(frame);processLocationQRInFrame
bool  LocationQRDetector::startLocationDetection() {
    VideoCapture cap = initializeCamera();

    if (!cap.isOpened()) {
        return false;
    }

    cout << "\n=== Location QR Detection System ===" << endl;
    cout << "Scan colored QR codes to determine your location:" << endl;
    for (const auto& range : colorRanges) {
        cout << "- " << range.label << " QR -> " << range.location << endl;
    }
    cout << "Auto-exit enabled - will exit after successful detection" << endl;

    Mat frame;
    bool detectionSuccess = false;

    while (true) {
        cap >> frame;
        if (frame.empty()) {
            cout << "Camera read error" << endl;
            break;
        }

        flip(frame, frame, 1); // Mirror for front camera

        // Process QR detection with color-based location detection
        auto result = processLocationQRInFrame(frame);
        string qrData = result.first;
        bool isValidQR = result.second;

        // Update detection status
        if (isValidQR && !qrData.empty()) {
            if (currentQRData == qrData) {
                validFrameCount++;
            }
            else {
                currentQRData = qrData;
                validFrameCount = 1;
            }
            locationDetected = true;
        }
        else {
            validFrameCount = max(0, validFrameCount - 1);
            if (validFrameCount == 0) {
                locationDetected = false;
                currentQRData = "";
                detectedColor = "";
                currentLocation = "";
            }
        }

        // Draw UI elements
        drawScanningFrame(frame);
        drawLocationInfo(frame);

        // Debug window - show color detection for detected color
        if (debugMode && locationDetected) {
            Mat roi = frame(scanningFrame);
            Mat hsvRoi;
            cvtColor(roi, hsvRoi, COLOR_BGR2HSV);

            // Show mask for detected color
            for (const auto& colorRange : colorRanges) {
                if (colorRange.label == detectedColor) {
                    Mat colorMask;
                    inRange(hsvRoi, colorRange.lower, colorRange.upper, colorMask);
                    imshow("Color Detection: " + detectedColor, colorMask);
                    break;
                }
            }
        }

        imshow("Location QR Detector", frame);

        // Handle input
        char key = waitKey(1) & 0xFF;
        if (key == 'q') {
            cout << "Detection cancelled by user" << endl;
            break;
        }
        else if (key == 'd') {
            debugMode = !debugMode;
            cout << "Debug: " << (debugMode ? "ON" : "OFF") << endl;
            if (!debugMode) {
                destroyWindow("Color Detection: " + detectedColor);
            }
        }

        // AUTO-EXIT: Exit immediately after stable detection (no spacebar required)
        if (locationDetected && validFrameCount >= stableFramesRequired) {
            cout << "\n=== AUTO LOCATION CONFIRMED ===" << endl;
            cout << "Detected Color: " << detectedColor << endl;
            cout << "User Location: " << currentLocation << endl;
            cout << "QR Data: " << currentQRData << endl;
            cout << "Auto-exiting after successful detection..." << endl;
            detectionSuccess = true;

            // Brief pause to show confirmation message
            waitKey(1000); // Wait 1 second to show the confirmation
            break;
        }
    }

    cap.release();
    destroyAllWindows();
    return detectionSuccess;
}

// Getter
string LocationQRDetector::getDetectedLocation() { return currentLocation; }
string LocationQRDetector::getDetectedColor() { return detectedColor; }
string LocationQRDetector::getQRData() { return currentQRData; }


// Main detection function
pair<bool, map<string, string>> detectLocationQR(bool debugMode = false) {
    LocationQRDetector detector(debugMode);
    bool success = detector.startLocationDetection();

    map<string, string> locationInfo;
    if (success) {
        locationInfo["location"] = detector.getDetectedLocation();
        locationInfo["color"] = detector.getDetectedColor();
        locationInfo["qrData"] = detector.getQRData();
    }

    return make_pair(success, locationInfo);
}
