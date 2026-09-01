# Indoor Navigation Assistant

An indoor navigation assistant built with C++, OpenCV, Crow, and a browser-based frontend. The application detects coloured location markers through a camera, calculates routes between mapped rooms, and exposes navigation functions through a local HTTP API.

## Features

- Camera-based coloured marker detection with OpenCV
- Indoor room and stair graph construction
- Dijkstra shortest-path navigation
- Text-to-speech using Windows SAPI
- Optional speech-recognition components using Windows SAPI
- Crow HTTP backend on port `18080`
- HTML, CSS, and JavaScript frontend

## Project Structure

```text
main.cpp                    Crow server and API routes
RouteGuidance.cpp/.h        Indoor map and Dijkstra navigation
detectionANDreader.cpp/.h   OpenCV camera and marker detection
speech_to_text.cpp/.h       Windows SAPI speech recognition
text_to_speech.cpp/.h       Windows SAPI text-to-speech
index.html                  Frontend page
app.js                      Frontend interaction and navigation display
styles.css                  Frontend styling
.vscode/                    VS Code build and debug configuration
```

## Requirements

- Windows
- Visual Studio Code
- MSYS2 UCRT64 toolchain
- g++ 16.2 or compatible C++17 compiler
- OpenCV 5 for UCRT64
- Crow C++ framework
- Standalone Asio
- Windows SAPI and COM libraries
- Live Server VS Code extension for the frontend

The project uses the following MSYS2 locations:

```text
C:\msys64\ucrt64\bin\g++.exe
C:\msys64\ucrt64\include\opencv5
C:\msys64\ucrt64\lib
```

## Build

Open the project root in VS Code and run the default build task with `Ctrl+Shift+B`.

The equivalent command is:

```powershell
C:\msys64\ucrt64\bin\g++.exe -std=c++17 -DASIO_STANDALONE `
  -IC:\msys64\ucrt64\include\opencv5 `
  -Ithird_party\Crow\include `
  -Ithird_party\asio\include `
  main.cpp RouteGuidance.cpp detectionANDreader.cpp speech_to_text.cpp text_to_speech.cpp `
  -LC:\msys64\ucrt64\lib `
  -lopencv_core -lopencv_imgproc -lopencv_objdetect -lopencv_videoio -lopencv_highgui `
  -lsapi -lole32 -luuid -lwinmm -lws2_32 -lmswsock `
  -o IndoorNavigationAssistant.exe
```

## Run

Use the included launcher so the required MSYS2 DLL directories are available:

```powershell
.\run-backend.bat
```

The backend listens at:

```text
http://localhost:18080
```

The available API routes are `/menu`, `/scan`, `/set-destination`, `/navigate`, `/repeat`, and `/exit`.

## Start the Frontend

Install the VS Code extension **Live Server** by **Ritwick Dey**. Then right-click `index.html` and select **Open with Live Server**. The frontend normally opens at an address similar to:

```text
http://127.0.0.1:5500/index.html
```

Keep the C++ backend terminal running while using the frontend.

## GitHub Upload Guidance

Commit the source code, frontend files, README, and `.vscode` configuration. Do not commit generated or machine-specific files:

```text
IndoorNavigationAssistant.exe
*.o
*.out
*.err
```

The `third_party` directory contains downloaded Crow and Asio sources. It may be included for a self-contained repository, but it makes the repository much larger. If it is excluded, document the official CrowCpp/Crow and standalone Asio setup in the repository before building.

## Limitations

- Camera scanning requires a working camera and visible coloured markers.
- Windows SAPI voices and microphone support depend on the local Windows configuration.
- The backend is intended for local development and currently enables permissive CORS headers.
- The frontend and backend are separate processes; Live Server does not replace the C++ backend.
