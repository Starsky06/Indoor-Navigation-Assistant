#define _HAS_STD_BYTE 0
#define byte win_byte
#include <windows.h>
#include <sapi.h>
#pragma warning(push)
#pragma warning(disable:4996)
#pragma warning(pop)
#undef byte
#include "speech_to_text.h"
#include "RouteGuidance.h"   // extern nodeCount, roomName
#include <iostream>
#include <string>

// Extern variables from RouteGuidance.cpp
extern int nodeCount;
extern std::string roomName[];

// Global SAPI pointers
static ISpRecognizer* g_pRecognizer = nullptr;
static ISpRecoContext* g_pContext = nullptr;
static ISpRecoGrammar* g_pGrammar = nullptr;
static SPSTATEHANDLE g_hRule = 0;

// Convert wide string (LPWSTR) to ANSI std::string
std::string WideToAnsi(LPCWSTR pwszText) {
    if (!pwszText) return "";
    int size_needed = WideCharToMultiByte(CP_ACP, 0, pwszText, -1, NULL, 0, NULL, NULL);
    std::string str(size_needed, 0);
    WideCharToMultiByte(CP_ACP, 0, pwszText, -1, &str[0], size_needed, NULL, NULL);
    if (!str.empty() && str.back() == '\0') str.pop_back(); // remove last \0
    return str;
}

void InitializeSTT() {
    HRESULT hr = CoInitialize(NULL);
    if (FAILED(hr)) {
        std::cerr << "[STT] CoInitialize failed." << std::endl;
        return;
    }

    // Create recognizer
    hr = CoCreateInstance(CLSID_SpInprocRecognizer, NULL, CLSCTX_INPROC_SERVER,
        IID_ISpRecognizer, (void**)&g_pRecognizer);
    if (FAILED(hr) || !g_pRecognizer) {
        std::cerr << "[STT] Failed to create recognizer." << std::endl;
        CoUninitialize();
        return;
    }

    // Create recognition context
    hr = g_pRecognizer->CreateRecoContext(&g_pContext);
    if (FAILED(hr) || !g_pContext) {
        std::cerr << "[STT] Failed to create reco context." << std::endl;
        g_pRecognizer->Release(); g_pRecognizer = nullptr;
        CoUninitialize();
        return;
    }

    // Set default microphone
    // NULL selects SAPI's default audio input device.
    g_pRecognizer->SetInput(NULL, TRUE);

    // Create grammar
    hr = g_pContext->CreateGrammar(1, &g_pGrammar);
    if (FAILED(hr) || !g_pGrammar) {
        std::cerr << "[STT] Failed to create grammar." << std::endl;
        g_pContext->Release(); g_pContext = nullptr;
        g_pRecognizer->Release(); g_pRecognizer = nullptr;
        CoUninitialize();
        return;
    }

    // Create top-level rule "destination"
    hr = g_pGrammar->GetRule(L"destination", 0,
        SPRAF_TopLevel | SPRAF_Active, TRUE, &g_hRule);
    if (FAILED(hr)) {
        std::cerr << "[STT] Failed to create rule handle." << std::endl;
        return;
    }

    g_pGrammar->Commit(0);
    g_pGrammar->SetRuleState(NULL, NULL, SPRS_ACTIVE);

    std::cout << "[STT] Initialized (Grammar mode)." << std::endl;
}

void LoadDynamicGrammar() {
    if (!g_pGrammar || !g_hRule) {
        std::cerr << "[STT] Grammar not initialized." << std::endl;
        return;
    }

    // deactivate before update
    g_pGrammar->SetRuleState(NULL, NULL, SPRS_INACTIVE);

    // Add rooms
    for (int i = 0; i < nodeCount; i++) {
        const std::string& r = roomName[i];
        if (r.empty()) continue;

        // convert string to wide (SAPI requires wide strings)
        std::wstring wname(r.begin(), r.end());
        HRESULT hr = g_pGrammar->AddWordTransition(g_hRule, NULL,
            wname.c_str(),
            L" ", SPWT_LEXICAL,
            1.0f, NULL);
        if (FAILED(hr)) {
            std::cerr << "[STT] Failed to add '" << r << "' to grammar." << std::endl;
        }

        // if code is N001, allow saying "N zero zero one"
        if (r.size() == 4 && r[0] == 'N' &&
            isdigit(r[1]) && isdigit(r[2]) && isdigit(r[3])) {
            char buf[64];
            std::snprintf(buf, sizeof(buf), "N zero zero %c", r[3]);
            std::wstring walt(buf, buf + strlen(buf));
            g_pGrammar->AddWordTransition(g_hRule, NULL,
                walt.c_str(), L" ", SPWT_LEXICAL,
                1.0f, NULL);
        }
    }

    g_pGrammar->Commit(0);
    g_pGrammar->SetRuleState(NULL, NULL, SPRS_ACTIVE);

    std::cout << "[STT] Grammar loaded with " << nodeCount << " rooms." << std::endl;
}

std::string listen(int timeoutMs) {
    if (!g_pContext) {
        std::cerr << "[STT] Context not initialized." << std::endl;
        return "";
    }

    SPEVENT event{};
    ULONG fetched = 0;
    ULONGLONG start = GetTickCount64();

    while ((GetTickCount64() - start) < (ULONGLONG)timeoutMs) {
        HRESULT hr = g_pContext->GetEvents(1, &event, &fetched);
        if (SUCCEEDED(hr) && fetched == 1 && event.eEventId == SPEI_RECOGNITION) {
            ISpRecoResult* pResult = reinterpret_cast<ISpRecoResult*>(event.lParam);
            if (pResult) {
                LPWSTR pwszText = nullptr;
                hr = pResult->GetText(SP_GETWHOLEPHRASE,
                    SP_GETWHOLEPHRASE,
                    FALSE, &pwszText, NULL);
                if (SUCCEEDED(hr) && pwszText) {
                    std::string text = WideToAnsi(pwszText);
                    ::CoTaskMemFree(pwszText);
                    std::cout << "[STT] Recognized: " << text << std::endl;
                    return text;
                }
            }
        }
        Sleep(50);
    }
    return "";
}

void CleanupSTT() {
    if (g_pGrammar) { g_pGrammar->Release(); g_pGrammar = nullptr; }
    if (g_pContext) { g_pContext->Release(); g_pContext = nullptr; }
    if (g_pRecognizer) { g_pRecognizer->Release(); g_pRecognizer = nullptr; }
    CoUninitialize();
    std::cout << "[STT] Cleaned up." << std::endl;
}
