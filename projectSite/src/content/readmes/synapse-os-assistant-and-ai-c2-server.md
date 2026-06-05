# Synapse OS Assistant & AI C2 Server

Welcome to the Synapse OS Assistant project. This repository contains a proof-of-concept system that transforms standard web-based Large Language Models (LLMs) into deterministic, voice-activated operating system controllers. 

By utilizing the custom **Synapse Command Language (SCL)** and a unified browser harness, this project allows you to control your Windows PC using models like Google Gemini, DeepSeek, and Google AI Search—**without needing any paid API keys.**

## Features
* **Synapse Command Language (SCL):** A highly efficient, token-saving syntax that forces LLMs to act as deterministic state machines rather than conversational agents.
* **Unified Web Harness:** A Tampermonkey script that puppeteers web-based AI chats, turning them into a local REST API.
* **Offline Wake-Word & STT:** Uses Vosk for fast, offline voice recognition ("Computer, do X").
* **Zero-Cost OS Integration:** Achieves deep OS control (executing shell commands, opening apps, reading files) using free web AI interfaces.

## Prerequisites
* Windows OS (WinForms is used for the UI).
* .NET 10.0 (or higher) SDK.
* A modern web browser with the [Tampermonkey](https://www.tampermonkey.net/) extension installed.
* **Important Browser Note:** If you intend to use Google AI Search, you **MUST use Mozilla Firefox**. Google Chrome restricts extension execution on `chrome://` pages and the default Google Search homepage.

## Setup Instructions

### 1. Install the Tampermonkey Harness
1. Open your browser and click the Tampermonkey extension icon -> **Create a new script**.
2. Copy the entire contents of `GoogleAI_Search_Google_Gemini_Deepseek_ChatGPT_UnifiedHarness.js` from this repository.
3. Paste it into the Tampermonkey editor, overwriting the default template.
4. Go to File -> **Save** (or press Ctrl+S).
5. If running Tampermonkey in Google Chrome, ensure Allow User Scripts is enabled in the extension page under "Manage Extensions"

### 2. Build and Run the Servers
1. Open the solution in Visual Studio.
2. Build the solution to restore NuGet packages (such as `NAudio` and `Vosk`).
3. Run the **AI C2 Server** project first. You should see the server console open and state that it is listening on port `8080`.
4. Open your web browser (Firefox recommended) and navigate to one of the supported AI platforms:
   * `https://gemini.google.com/`
   * `https://chat.deepseek.com/`
   * `https://google.com/ai` (Will not work with the Tampermonkey Harness in Google Chrome!)
5. Look at the C2 Server console; you should see a message indicating that a new instance has connected (e.g., `[OP-CENTER] New instance registered: inst_gem_...`).

### 3. Start the Voice Assistant
1. Run the **VoiceAssistantPoC_Win** project.
2. In the bottom panel, select your active browser session from the dropdown menu.
3. Click **Re Init Session**. This will inject the SCL System Instructions into the browser chat, preparing the AI to act as a state machine.
4. Ensure the "Voice Mode" checkbox is checked.
5. Speak into your microphone: *"Computer, open notepad."*
6. Watch as the AI processes the command, issues the SCL syntax `~cmd[start notepad.exe]`, and the client executes it on your machine!

## Limitations
* **ChatGPT is Unsupported:** Due to aggressive RLHF (Reinforcement Learning from Human Feedback), the web version of ChatGPT refuses to strictly adhere to the SCL syntax and will often output conversational filler or markdown, breaking the state machine loop. Please use Gemini or DeepSeek for the best results.
* **Browser Focus:** The Tampermonkey script requires the browser tab to be active/visible in some browsers to ensure DOM updates and JavaScript intervals fire reliably.

## Disclaimer
This project allows an AI to execute arbitrary shell commands on your local machine. It is provided as a Proof of Concept for educational and research purposes only. Do not run this software in a production environment or with elevated (Administrator) privileges unless you fully understand the risks.