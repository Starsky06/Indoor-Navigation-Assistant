#ifndef LOCATION_QR_DETECTOR_H
#define LOCATION_QR_DETECTOR_H

#include <opencv2/opencv.hpp>
#include <opencv2/objdetect.hpp>
#include <string>
#include <vector>
#include <map>
#include <iostream>

using namespace cv;
using namespace std;

// Color range structure for location detection
struct ColorRange {
    Scalar lower;
    Scalar upper;
    string label;
    string location;
    Scalar displayColor;
};

class LocationQRDetector {
private:
    QRCodeDetector qrDecoder;
    vector<ColorRange> colorRanges;

    // Detection parameters
    bool debugMode;
    int stableFramesRequired;
    Size cameraResolution;
    Rect scanningFrame;
    string allowedContent[4];

    // Status tracking
    bool locationDetected;
    string currentQRData;
    string detectedColor;
    string currentLocation;
    int validFrameCount;

    // Internal helper functions
    void initializeScanningFrame();
    pair<bool, pair<string, string>> detectColorAndLocation(Mat& roi);
    void drawScanningFrame(Mat& frame);
    void drawLocationInfo(Mat& frame);
    pair<string, bool> processLocationQRInFrame(Mat& frame);
    VideoCapture initializeCamera();

public:
    LocationQRDetector(bool debug);

    bool startLocationDetection();

    // Getter methods
    string getDetectedLocation();
    string getDetectedColor();
    string getQRData();
};

// Main detection function
pair<bool, map<string, string>> detectLocationQR(bool debugMode);

#endif // LOCATION_QR_DETECTOR_H