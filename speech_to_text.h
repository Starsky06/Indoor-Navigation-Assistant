#pragma once
#ifndef SPEECH_TO_TEXT_H
#define SPEECH_TO_TEXT_H

#include <string>

void InitializeSTT();
void CleanupSTT();
std::string listen(int timeoutMs);
void LoadDynamicGrammar();

#endif
