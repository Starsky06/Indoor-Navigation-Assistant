#pragma once
#include <iostream>
#include <string>
#include <cstring>
#include <iomanip>
#include <cstdlib>
#include <limits>
using namespace std;

struct Edge {
    int to;         // destination node
    double dist;    // distance
    int next;       // next node
    string instruction;// instruction
};

int addRoom(string name, string floor);

// Build connection between class room
// N008 can go N009 only
void addEdge(int u, int v, double dist);
// N008 can go N009, N009 can go N008 also
void addRoad(int u, int v, double dist);

void dijkstra(int start, int end);

// show the room besides
string printNeighbors(int u);

int findRoomNode(const string& name);
void buildMap();
