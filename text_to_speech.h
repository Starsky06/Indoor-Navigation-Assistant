#pragma once
#include <string>

// Initializes the COM and SAPI voice engine. Call this once at the start of the program.
void InitializeTTS();

// Releases the SAPI voice engine and uninitializes COM. Call this once before the program exits.
void CleanupTTS();

// Speaks the given text asynchronously (the program won't wait for it to finish).
void speak(const std::string& text);
void stopSpeech();