#define _HAS_STD_BYTE 0
#include "crow.h"
#include "detectionANDreader.h"
#include "RouteGuidance.h"
#include "text_to_speech.h"
#include "speech_to_text.h"
#include <iomanip>
#include <limits>

using namespace cv;
using namespace std;

extern std::string roomName[];

void clearScreen() {
    stopSpeech(); // Stop any ongoing speech when clearing screen
#ifdef _WIN32
    system("cls");
#else
    system("clear");
#endif
}

void displayBanner() {
    cout << "\n+====================================+" << endl;
    cout << "|      Indoor Navigation Assistant    |" << endl;
    cout << "+====================================+" << endl;
}

void displayMenu() {
    stopSpeech(); // Stop any previous speech before starting new one
    cout << "\n+-------------- MAIN MENU ------------+" << endl;
    cout << "|  1. Where Am I?                     |" << endl;
    cout << "|  2. Set Destination                 |" << endl;
    cout << "|  3. Guide Me                        |" << endl;
    cout << "|  4. Repeat Last Instruction         |" << endl;
    cout << "|  5. Exit                            |" << endl;
    cout << "+------------------------------------+" << endl;

    speak("Menu options: 1. Where Am I? 2. Set Destination. 3. Guide Me. 4. Repeat Last Instruction. 5. Exit.");
}

void displayLocationInfo(const map<string, string>& locationInfo) {
    cout << "\n+----------- CURRENT LOCATION ---------+" << endl;
    cout << "|  Location: " << left << setw(25) << locationInfo.at("location") << "|" << endl;
    cout << "|  Area Type: " << left << setw(25) << locationInfo.at("color") << "|" << endl;
    cout << "+------------------------------------+" << endl;
}

void clearInputBuffer() {
    cin.clear();
    cin.ignore(numeric_limits<streamsize>::max(), '\n');
}

int getValidChoice(int min, int max) {
    int choice;
    while (true) {
        cout << "\nEnter your choice (" << min << "-" << max << "): ";
        if (cin >> choice) {
            clearInputBuffer();
            if (choice >= min && choice <= max) {
                return choice;
            }
        }
        else {
            clearInputBuffer();
        }
        cout << "** Invalid input. Please try again. **" << endl;
    }
}

string getValidDestination() {
    string destination;
    cout << "Enter destination: ";
    getline(cin, destination);
    return destination;
}

bool validateLocation(const map<string, string>& locationInfo) {
    return locationInfo.count("location") > 0 &&
        locationInfo.count("color") > 0 &&
        locationInfo.count("qrData") > 0 &&
        !locationInfo.at("location").empty() &&
        !locationInfo.at("color").empty();
}

// Update getLocationName to include office locations
string getLocationName(int locationId) {
    // Ground Floor Classrooms (N series)
    if (locationId >= 1 && locationId <= 12) {
        std::ostringstream oss;
        oss << "N" << std::setfill('0') << std::setw(3) << locationId;
        return oss.str();
    }

    // Ground Floor Offices (NG series)
    if (locationId >= 13 && locationId <= 64) {
        std::ostringstream oss;
        oss << "NG-" << std::setfill('0') << std::setw(3) << (locationId - 12);
        return oss.str();
    }

    // First Floor Offices (NF series)
    if (locationId >= 84 && locationId <= 125) {
        std::ostringstream oss;
        oss << "NF-" << std::setfill('0') << std::setw(3) << (locationId - 83);  // Offset for NF series
        return oss.str();
    }

    switch (locationId) {
        // Ground Floor Facilities
    case 67: return "Office Ground Floor Toilet";
    case 68: return "NGT_1_and_2";
    case 69: return "NGT_3_4_and_5";
    case 70: return "NGT_6_and_7";
    case 71: return "Stair_GF_Right_1";
    case 72: return "Stair_GF_Right_2";
    case 73: return "Stair_GF_Left_1";
    case 74: return "Stair_GF_Left_2";

        // First Floor Classrooms (N1 series)
    case 75: return "N101";
    case 76: return "N102";
    case 77: return "N103";
    case 78: return "N104";
    case 79: return "N105";
    case 80: return "N106";
    case 81: return "N107";
    case 82: return "N108";
    case 83: return "N109";

        // First Floor Facilities
    case 126: return "NFT_1_and_2";
    case 127: return "NFT_3_4_and_5";
    case 128: return "NFT_6_and_7";
    case 129: return "Stair_FF_Right_1";
    case 130: return "Stair_FF_Right_2";
    case 131: return "Stair Beside N104";
    case 132: return "Stair_FF_Left_1";
    case 133: return "Stair_FF_Left_2";
    case 134: return "NFP 2";  // Printer

    default: return "Not Set";
    }
}

// Add new function to display navigation status
void displayNavigationStatus(int currentLoc, int destLoc) {
    cout << "\n+============ CURRENT STATUS ============+" << endl;
    cout << "| Current Location: " << left << setw(19) << roomName[currentLoc - 1] << "|" << endl;
    cout << "| Destination:      " << left << setw(19) << roomName[destLoc - 1] << "|" << endl;
    cout << "+====================================+" << endl;
}

void displayAvailableLocations() {
    stopSpeech(); // Stop any previous speech
    cout << "\n+------------- DESTINATIONS --------------+" << endl;
    cout << "| Ground Floor:                          |" << endl;
    cout << "| * Classrooms: N001 - N012             |" << endl;
    cout << "| * Offices:    NG-001 - NG-052         |" << endl;
    cout << "| * Toilets:    NGT_1_and_2             |" << endl;
    cout << "|              NGT_3_4_and_5            |" << endl;
    cout << "|              NGT_6_and_7              |" << endl;
    cout << "| * Stairs:     Stair_GF_Right_1        |" << endl;
    cout << "|              Stair_GF_Right_2         |" << endl;
    cout << "|              Stair_GF_Left_1          |" << endl;
    cout << "|              Stair_GF_Left_2          |" << endl;
    cout << "|                                        |" << endl;
    cout << "| First Floor:                           |" << endl;
    cout << "| * Classrooms: N101 - N112             |" << endl;
    cout << "| * Offices:    NF-001 - NF-042         |" << endl;
    cout << "| * Toilets:    NFT_1_and_2             |" << endl;
    cout << "|              NFT_3_4_and_5            |" << endl;
    cout << "|              NFT_6_and_7              |" << endl;
    cout << "| * Stairs:     Stair_FF_Right_1        |" << endl;
    cout << "|              Stair_FF_Right_2         |" << endl;
    cout << "|              Stair_FF_Left_1          |" << endl;
    cout << "|              Stair_FF_Left_2          |" << endl;
    cout << "| * Other:      NFP 2 (Printer)         |" << endl;
    cout << "+----------------------------------------+" << endl;
}

int userCurrentLocation = 0;
int userDesiredLocation = 0;
string lastInstruction;
string destination;

int main() {
    crow::SimpleApp app;

    InitializeTTS();
    buildMap();

    // Case 0: Menu
    CROW_ROUTE(app, "/menu").methods("GET"_method)([]() {
        stopSpeech();
        string menu = "Menu: 1. Scan QR  2. Set Destination  3. Navigate  4. Repeat  5. Exit";
        speak("Please select an option.");
        crow::response resp;
        resp.set_header("Access-Control-Allow-Origin", "*");
        resp.write(crow::json::wvalue{ {"menu", menu} }.dump());
        return resp;
        });

    // Case 1: Scan QR
    CROW_ROUTE(app, "/scan").methods("POST"_method)([]() {
        stopSpeech();
        cout << "\n[*] Scanning for QR Code..." << endl;
        speak("Scanning your location. Please hold still.");

        auto result = detectLocationQR(true);
        crow::json::wvalue res;

        if (result.first && validateLocation(result.second)) {
            stopSpeech();
            displayLocationInfo(result.second);

            if (result.second.at("color") == "blue") {
                userCurrentLocation = 1;
                lastInstruction = "You are at N001";
            }
            else if (result.second.at("color") == "purple") {
                userCurrentLocation = 84;
                lastInstruction = "You are at NF-001";
            }
            else if (result.second.at("color") == "red") {
                userCurrentLocation = 131;
                lastInstruction = "You are at the stair beside N104";
            }
            else if (result.second.at("color") == "orange") {
                userCurrentLocation = 67;
                lastInstruction = "You are at the office ground floor toilet";
            }

            string neighbors = printNeighbors(userCurrentLocation);
            speak(lastInstruction);
            res["status"] = "ok";
            res["location"] = lastInstruction;
            res["neighbors"] = neighbors;
        }
        else {
            stopSpeech();
            res["status"] = "fail";
            res["message"] = "Location Detection Failed. Check QR visibility and lighting.";
            speak("Location detection failed.");
        }
        crow::response resp;
        resp.set_header("Access-Control-Allow-Origin", "*");
        resp.write(res.dump());
        return resp;
        });

    // Case 2: Set Destination
    CROW_ROUTE(app, "/set-destination").methods("POST"_method)([](const crow::request& req) {
        crow::json::wvalue res;
        auto body = crow::json::load(req.body);
        if (!body) {
            res["status"] = "fail";
            res["message"] = "Invalid JSON";
        }
        else {
            string newDestination = body["destination"].s();
            int nodeIndex = findRoomNode(newDestination);
            if (nodeIndex != -1) {
                userDesiredLocation = nodeIndex + 1;
                destination = newDestination;
                lastInstruction = "Destination set to " + destination;
                speak(lastInstruction);

                res["status"] = "ok";
                res["destination"] = destination;
            }
            else {
                res["status"] = "fail";
                res["message"] = "Location not found";
                speak("Sorry, that location was not found.");
            }
        }

        crow::response crowResp;
        crowResp.set_header("Access-Control-Allow-Origin", "*");
        crowResp.set_header("Access-Control-Allow-Headers", "Content-Type");
        crowResp.write(res.dump());
        return crowResp;
        });

    // Case 3: Navigation
    CROW_ROUTE(app, "/navigate").methods("GET"_method)([]() {
        crow::json::wvalue res;
        stopSpeech();

        if (userCurrentLocation == 0 || userDesiredLocation == 0) {
            res["status"] = "fail";
            res["message"] = "Please set both current location and destination first.";
            speak("Please set both current location and destination first.");
        }
        else {
            speak("Starting navigation guidance.");
            dijkstra(userCurrentLocation, userDesiredLocation);
            stopSpeech();
            speak("You have arrived at your destination.");
            lastInstruction = "Navigation complete";

            res["status"] = "ok";
            res["message"] = "Navigation complete";
        }
        crow::response resp;
        resp.set_header("Access-Control-Allow-Origin", "*");
        resp.write(res.dump());
        return resp;
        });

    // Case 4: Repeat last instruction
    CROW_ROUTE(app, "/repeat").methods("GET"_method)([]() {
        crow::json::wvalue res;
        stopSpeech();

        if (!lastInstruction.empty()) {
            res["status"] = "ok";
            res["instruction"] = lastInstruction;
            speak(lastInstruction);
        }
        else {
            res["status"] = "fail";
            res["message"] = "No previous instruction to repeat.";
            speak("No previous instruction to repeat.");
        }
        crow::response resp;
        resp.set_header("Access-Control-Allow-Origin", "*");
        resp.write(res.dump());
        return resp;
        });

    // Case 5: Exit
    CROW_ROUTE(app, "/exit").methods("GET"_method)([]() {
        stopSpeech();
        speak("Thank you for using Indoor Navigation Assistant. Goodbye!");
        crow::json::wvalue body;
        body["status"] = "bye";

        crow::response res;
        res.set_header("Access-Control-Allow-Origin", "*");
        res.write(body.dump());
        std::thread([]() {
            std::this_thread::sleep_for(std::chrono::milliseconds(200));
            exit(0);
            }).detach();

        return res;
        });

    app.port(18080).run();
    CleanupTTS();
    return 0;
}
