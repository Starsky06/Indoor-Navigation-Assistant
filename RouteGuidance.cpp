#define _HAS_STD_BYTE 0
#include "RouteGuidance.h"
#include "text_to_speech.h"
#include <thread>
#include <chrono>

const int MAXN = 200; // maximum number of class room
const int MAXM = 400; // maximum number of route (bidirectional, so *2)

Edge edges[MAXM];

int head[MAXN];           // node of each class room
int edgeCount = 0;
string roomName[MAXN];    // which class room
string floorName[MAXN];   // which floor
int nodeCount = 0;

int addRoom(string name, string floor) {
    roomName[nodeCount] = name;
    floorName[nodeCount] = floor;
    head[nodeCount] = -1; // initialize Adjacency List (every room cannot go other room from the beginning)
    return nodeCount++;
}

// Build connection between class room
// N008 can go N009 only
void addEdge(int u, int v, double dist) {
    edges[edgeCount].to = v;
    edges[edgeCount].dist = dist;
    edges[edgeCount].next = head[u];
    head[u] = edgeCount++;
}

// N008 can go N009, N009 can go N008 also
void addRoad(int u, int v, double dist) {
    addEdge(u, v, dist);
    addEdge(v, u, dist);
}

int prevNode[MAXN];
double distArr[MAXN];
bool visited[MAXN];

void dijkstra(int start, int end) {
    start -= 1;
    end -= 1;
    for (int i = 0; i < nodeCount; i++) {
        distArr[i] = numeric_limits<double>::infinity();
        visited[i] = false;
        prevNode[i] = -1;
    }

    distArr[start] = 0;

    for (int i = 0; i < nodeCount; i++) {
        int u = -1;
        double minDist = numeric_limits<double>::infinity();
        // find the nearest node that haven't visit
        for (int j = 0; j < nodeCount; j++) {
            if (!visited[j] && distArr[j] < minDist) {
                minDist = distArr[j];
                u = j;
            }
        }

        if (u == -1) break; // if no way to go, break
        visited[u] = true;
        if (u == end) break; // if arrived destination, break

        // search in the adjacency list
        for (int e = head[u]; e != -1; e = edges[e].next) {
            int v = edges[e].to;
            double w = edges[e].dist;
            if (!visited[v] && distArr[u] + w < distArr[v]) {
                distArr[v] = distArr[u] + w;
                prevNode[v] = u;
            }
        }
    }

    // output
    if (distArr[end] == numeric_limits<double>::infinity()) {
        cout << "No route found from " << roomName[start] << " to " << roomName[end] << endl;
    }
    else {
        cout << "Shortest distance from " << roomName[start]
            << " to " << roomName[end] << " is " << distArr[end] << " units.\n";

            // find the path
            int path[MAXN], cnt = 0;
            for (int cur = end; cur != -1; cur = prevNode[cur]) {
                path[cnt++] = cur;
            }
            cout << "Path: ";
            for (int i = cnt - 1; i >= 0; i--) {
                std::this_thread::sleep_for(std::chrono::seconds(3)); // wait for 3 seconds
                cout << roomName[path[i]];
                speak("Go to " + roomName[path[i]]);
                if (i > 0) cout << " -> ";
            }
            cout << endl;
    }
}

// show the room besides
string printNeighbors(int u) {
    u -= 1;
    cout << roomName[u] << " (" << floorName[u] << ") is beside: \n";
    int index = 1;
    for (int i = head[u]; i != -1; i = edges[i].next) {
        cout << index << ". " << roomName[edges[i].to] << "\n";
        index++;
    }
    return roomName[u];
}

int findRoomNode(const string& name) {
    for (int i = 0; i < nodeCount; i++) {
        if (roomName[i] == name) {
            return i;  // find relevant node index
        }
    }
    return -1; // not found
}

void buildMap() {
    // Ground Floor
    // Class Room
        int classRoomNode[13];
        for (int i = 1; i <= 12; i++) {
            string name = string("N") + (i < 10 ? "00" : "0") + to_string(i);
            classRoomNode[i] = addRoom(name, "Ground Floor");
        }
        // Office
        int officeNode[53];
        for (int i = 1; i <= 52; i++) {
            string name = string("NG-") + (i < 10 ? "00" : "0") + to_string(i);
            officeNode[i] = addRoom(name, "Ground Floor");
        }
        // Toilet
        int NGT1_and_2 = addRoom("NGT_1_and_2", "Ground Floor");
        int NGT3_4_and_5 = addRoom("NGT_3_4_and_5", "Ground Floor");
        int NGT6_and_7 = addRoom("NGT_6_and_7", "Ground Floor");
        // Classroom Stairs
        int Stair_GF_Right_1 = addRoom("Stair_GF_Right_1", "Ground Floor");
        int Stair_GF_Right_2 = addRoom("Stair_GF_Right_2", "Ground Floor");
        // Office Stairs
        int Stair_GF_Left_1 = addRoom("Stair_GF_Left_1", "Ground Floor");
        int Stair_GF_Left_2 = addRoom("Stair_GF_Left_2", "Ground Floor");


        //Straight Line distance = 1, diagonal line distance = 2
        addRoad(Stair_GF_Right_1, classRoomNode[1], 1);
        addRoad(Stair_GF_Right_1, NGT1_and_2, 1);
        //N001
        addRoad(classRoomNode[1], classRoomNode[2], 1);
        addRoad(classRoomNode[1], NGT1_and_2, 1);
        addRoad(classRoomNode[1], classRoomNode[12], 2);
        //N002
        addRoad(classRoomNode[2], classRoomNode[3], 1);
        addRoad(classRoomNode[2], classRoomNode[12], 1);
        addRoad(classRoomNode[2], classRoomNode[11], 2);
        addRoad(classRoomNode[2], NGT1_and_2, 2);
        //N003
        addRoad(classRoomNode[3], classRoomNode[11], 1);
        addRoad(classRoomNode[3], Stair_GF_Right_2, 1);
        addRoad(classRoomNode[3], classRoomNode[12], 2);
        //Stair_GF
        addRoad(Stair_GF_Right_2, classRoomNode[4], 1);
        addRoad(Stair_GF_Right_2, classRoomNode[11], 2);
        addRoad(Stair_GF_Right_2, classRoomNode[10], 2);
        //N004
        addRoad(classRoomNode[4], classRoomNode[5], 1);
        addRoad(classRoomNode[4], classRoomNode[10], 1);
        addRoad(classRoomNode[4], classRoomNode[9], 2);
        //N005
        addRoad(classRoomNode[5], classRoomNode[6], 1);
        addRoad(classRoomNode[5], classRoomNode[9], 1);
        addRoad(classRoomNode[5], classRoomNode[10], 2);
        //N006
        addRoad(classRoomNode[6], classRoomNode[7], 1);
        addRoad(classRoomNode[6], NGT3_4_and_5, 1);
        addRoad(classRoomNode[6], classRoomNode[8], 2);
        addRoad(classRoomNode[6], classRoomNode[9], 2);
        //N007
        addRoad(classRoomNode[7], classRoomNode[8], 1);
        addRoad(classRoomNode[7], NGT3_4_and_5, 2);
        addRoad(classRoomNode[7], officeNode[1], 1);
        //N008
        addRoad(classRoomNode[8], NGT3_4_and_5, 1);
        //Toilet NGT 3,4,5
        addRoad(NGT3_4_and_5, classRoomNode[9], 1);
        //N009
        addRoad(classRoomNode[9], classRoomNode[10], 1);
        //N010
        addRoad(classRoomNode[10], classRoomNode[11], 1);
        //N011
        addRoad(classRoomNode[11], classRoomNode[12], 1);
        //Toilet NGT 1,2
        addRoad(NGT1_and_2, classRoomNode[12], 1);


        //Ground Floor Offices Route
        for (int i = 1; i < 14; i++) {
            addRoad(officeNode[i], officeNode[i + 1], 1);
        }
        addRoad(officeNode[3], officeNode[15], 1);
        addRoad(officeNode[8], officeNode[20], 1);
        addRoad(officeNode[14], officeNode[24], 1);
        for (int i = 15; i < 22; i++) {
            addRoad(officeNode[i], officeNode[i + 1], 1);
        }
        addRoad(officeNode[22], NGT6_and_7, 1);
        addRoad(NGT6_and_7, officeNode[23], 1);
        addRoad(NGT6_and_7, officeNode[11], 1);
        addRoad(officeNode[23], officeNode[24], 1);
        for (int i = 24; i < 28; i++) {
            addRoad(officeNode[i], officeNode[i + 1], 1);
        }
        addRoad(officeNode[27], officeNode[29], 1);
        addRoad(officeNode[29], officeNode[30], 1);
        addRoad(officeNode[30], officeNode[31], 1);
        for (int i = 31; i < 43; i++) {
            addRoad(officeNode[i], officeNode[i + 1], 1);
        }
        for (int i = 44; i < 52; i++) {
            addRoad(officeNode[i], officeNode[i + 1], 1);
        }
        addRoad(officeNode[35], officeNode[52], 1);
        addRoad(officeNode[37], officeNode[50], 1);
        addRoad(officeNode[38], officeNode[48], 1);
        addRoad(officeNode[43], officeNode[44], 1);
        addRoad(officeNode[43], classRoomNode[8], 1);
        addRoad(Stair_GF_Left_1, officeNode[52], 1);
        addRoad(Stair_GF_Left_1, NGT6_and_7, 1);
        addRoad(Stair_GF_Left_2, officeNode[1], 1);
        addRoad(Stair_GF_Left_2, classRoomNode[7], 1);
        addRoad(Stair_GF_Left_2, classRoomNode[8], 1);
        addRoad(Stair_GF_Left_2, officeNode[43], 1);


    // First Floor
    // Class Room
    int firstFloorClassRoomNode[13];
    for (int i = 1; i <= 12; i++) {
        string name = string("N") + (i < 10 ? "10" : "1") + to_string(i);
        firstFloorClassRoomNode[i] = addRoom(name, "First Floor");
    }
    // Office
    int firstFloorOfficeNode[43];
    for (int i = 1; i <= 42; i++) {
        string name = string("NF-") + (i < 10 ? "00" : "0") + to_string(i);
        firstFloorOfficeNode[i] = addRoom(name, "First Floor");
    }
    // Toilet
    int NFT1_and_2 = addRoom("NFT_1_and_2", "First Floor");
    int NFT3_4_and_5 = addRoom("NFT_3_4_and_5", "First Floor");
    int NFT6_and_7 = addRoom("NFT_6_and_7", "First Floor");
    // Printer
    int NFP2 = addRoom("NFP 2", "First Floor");
    // Classroom Stairs
    int Stair_FF_Right_1 = addRoom("Stair_FF_Right_1", "First Floor");
    int Stair_FF_Right_2 = addRoom("Stair_FF_Right_2", "First Floor");
    // Office Stairs
    int Stair_FF_Left_1 = addRoom("Stair_FF_Left_1", "First Floor");
    int Stair_FF_Left_2 = addRoom("Stair_FF_Left_2", "First Floor");

    addRoad(Stair_GF_Right_1, firstFloorClassRoomNode[1], 1);
    addRoad(Stair_GF_Right_1, NFT1_and_2, 1);
    //N101
    addRoad(firstFloorClassRoomNode[1], firstFloorClassRoomNode[2], 1);
    addRoad(firstFloorClassRoomNode[1], NFT1_and_2, 1);
    addRoad(firstFloorClassRoomNode[1], firstFloorClassRoomNode[12], 2);
    //N102
    addRoad(firstFloorClassRoomNode[2], firstFloorClassRoomNode[3], 1);
    addRoad(firstFloorClassRoomNode[2], firstFloorClassRoomNode[12], 1);
    addRoad(firstFloorClassRoomNode[2], firstFloorClassRoomNode[11], 2);
    addRoad(firstFloorClassRoomNode[2], NFT1_and_2, 2);
    //N103
    addRoad(firstFloorClassRoomNode[3], firstFloorClassRoomNode[11], 1);
    addRoad(firstFloorClassRoomNode[3], Stair_FF_Right_2, 1);
    addRoad(firstFloorClassRoomNode[3], firstFloorClassRoomNode[12], 2);
    //Stair_FF
    addRoad(Stair_FF_Right_2, firstFloorClassRoomNode[4], 1);
    addRoad(Stair_FF_Right_2, firstFloorClassRoomNode[11], 2);
    addRoad(Stair_FF_Right_2, firstFloorClassRoomNode[10], 2);
    //N104
    addRoad(firstFloorClassRoomNode[4], firstFloorClassRoomNode[5], 1);
    addRoad(firstFloorClassRoomNode[4], firstFloorClassRoomNode[10], 1);
    addRoad(firstFloorClassRoomNode[4], firstFloorClassRoomNode[9], 2);
    //N105
    addRoad(firstFloorClassRoomNode[5], firstFloorClassRoomNode[6], 1);
    addRoad(firstFloorClassRoomNode[5], firstFloorClassRoomNode[9], 1);
    addRoad(firstFloorClassRoomNode[5], firstFloorClassRoomNode[10], 2);
    //N106
    addRoad(firstFloorClassRoomNode[6], firstFloorClassRoomNode[7], 1);
    addRoad(firstFloorClassRoomNode[6], NFT3_4_and_5, 1);
    addRoad(firstFloorClassRoomNode[6], firstFloorClassRoomNode[8], 2);
    addRoad(firstFloorClassRoomNode[6], firstFloorClassRoomNode[9], 2);
    //N107
    addRoad(firstFloorClassRoomNode[7], firstFloorClassRoomNode[8], 1);
    addRoad(firstFloorClassRoomNode[7], NFT3_4_and_5, 2);
    addRoad(firstFloorClassRoomNode[7], firstFloorOfficeNode[1], 1);
    //N108
    addRoad(firstFloorClassRoomNode[8], NFT3_4_and_5, 1);
    //Toilet NFT 3,4,5
    addRoad(NFT3_4_and_5, firstFloorClassRoomNode[9], 1);
    //N109
    addRoad(firstFloorClassRoomNode[9], firstFloorClassRoomNode[10], 1);
    //N110
    addRoad(firstFloorClassRoomNode[10], firstFloorClassRoomNode[11], 1);
    //N111
    addRoad(firstFloorClassRoomNode[11], firstFloorClassRoomNode[12], 1);
    //Toilet NFT 1,2
    addRoad(NFT1_and_2, firstFloorClassRoomNode[12], 1);
    
    //First Floor Offices Route
    addRoad(firstFloorOfficeNode[1], firstFloorOfficeNode[2], 1);
    for (int i = 2; i < 13; i++) {
        addRoad(firstFloorOfficeNode[i], firstFloorOfficeNode[i + 1], 1);
    }
    addRoad(firstFloorOfficeNode[13], firstFloorOfficeNode[22], 1);
    addRoad(firstFloorOfficeNode[4], firstFloorOfficeNode[14], 1);
    for (int i = 14; i < 21; i++) {
        addRoad(firstFloorOfficeNode[i], firstFloorOfficeNode[i + 1], 1);
    }
    addRoad(firstFloorOfficeNode[21], NFT6_and_7, 1);
    addRoad(NFT6_and_7, firstFloorOfficeNode[22], 1);
    addRoad(firstFloorOfficeNode[22], firstFloorOfficeNode[23], 1);
    addRoad(firstFloorOfficeNode[23], NFP2, 1);
    for (int i = 23; i < 34; i++) {
        addRoad(firstFloorOfficeNode[i], firstFloorOfficeNode[i + 1], 1);
    }
    addRoad(firstFloorOfficeNode[25], NFP2, 1);
    for (int i = 35; i < 42; i++) {
        addRoad(firstFloorOfficeNode[i], firstFloorOfficeNode[i + 1], 1);
    }
    addRoad(NFP2, firstFloorOfficeNode[42], 1);
    addRoad(firstFloorOfficeNode[27], firstFloorOfficeNode[41], 1);
    addRoad(firstFloorOfficeNode[28], firstFloorOfficeNode[39], 1);
    addRoad(firstFloorOfficeNode[35], firstFloorOfficeNode[37], 1);
    addRoad(firstFloorOfficeNode[34], firstFloorClassRoomNode[8], 1);
    addRoad(Stair_FF_Left_1, NFP2, 1);
    addRoad(Stair_FF_Left_1, NFT6_and_7, 1);
    addRoad(Stair_FF_Left_2, firstFloorOfficeNode[1], 1);
    addRoad(Stair_FF_Left_2, firstFloorOfficeNode[2], 1);
    addRoad(Stair_FF_Left_2, firstFloorClassRoomNode[7], 1);
    addRoad(Stair_FF_Left_2, firstFloorClassRoomNode[8], 1);
    addRoad(Stair_FF_Left_2, firstFloorOfficeNode[34], 1);

    // Stair that connect Ground Floor and First Floor
    addRoad(Stair_GF_Left_1, Stair_FF_Left_1, 3);
    addRoad(Stair_GF_Left_2, Stair_FF_Left_2, 3);
    addRoad(Stair_GF_Right_1, Stair_FF_Right_1, 3);
    addRoad(Stair_GF_Right_2, Stair_FF_Right_2, 3);
}