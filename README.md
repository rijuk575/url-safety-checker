#  URL Safety Checker (Chrome Extension)

A lightweight Chrome extension that analyzes URLs for potential security risks using heuristic checks and VirusTotal integration.

##  Features
- Scan current tab instantly  
- URL risk scoring system  
- Detects suspicious patterns (keywords, domains, no HTTPS)  
- VirusTotal API support  

##  Setup
1. Clone this repository  
2. Add your VirusTotal API key in `popup.js`:
   ```js
   const API_KEY = "YOUR_API_KEY_HERE";
