**HerHealth-She Cares. We Guide.**


**PROJECT DESCRIPTION**

HerHealth – Women’s Health Web App

Type: Web Application

Problem: Women often face challenges managing reproductive health, including irregular periods, PCOS/PCOD, pregnancy, and postpartum care.

Solution: HerHealth is a smart web app that provides:

PCOS/PCOD risk detection and personalized diet/workout tips
Period, pregnancy, and postpartum tracking
Week-by-week pregnancy guidance and baby growth visualization
Postpartum recovery tips and mood tracking
Secure login for users and ASHA workers, with multilingual support(hindi,english,malayalam)
Tech Stack: HTML, CSS, JavaScript (Frontend), Node.js + Express.js (Backend), MongoDB (Database)
Benefit: Covers the full reproductive lifecycle, supports preventive care, and helps women stay informed and healthy.


**TECH STACK**

Frontend: HTML, CSS, JavaScript

Backend: Node.js, Express.js

Database: MongoDB


**FEATURES LIST**

PCOS & Menstrual Health Tracker
* Track period cycle, flow, and symptoms
* PCOS/PCOD risk assessment (Early / Moderate / High)
* Personalized diet and workout suggestions
* Alerts for doctor consultation
  
Pregnancy Tracker
* Week-by-week guidance
* Baby size comparison (fruit visual idea)
* Nutrition reminders and vaccination schedule
* Danger symptom alerts
* Kick counter & daily checklist
  
Postpartum Care
* Recovery guidance and breastfeeding tips
* Mood tracker for postpartum depression
* Baby growth milestone tracking
* Sleep tracker and parenting tips
  
Special Features
* Multilingual support (English, Malayalam, Hindi)
* Secure login system for users and ASHA workers
* Smart dashboard: stage, alerts, risk status
* chatbot for FAQs
  
  
**INSTALLATION COMMANDS**

Node.js 
MongoDB Community Server 
MongoDB Compass 
Visual Studio Code 
Node.js packages – Backend dependencies (run inside HerHealth folder):

Bash
npm install express
npm install mongoose
npm install body-parser
npm install bcrypt

Browser – Open frontend:
http://localhost:3000/index.html

# Clone repository
git clone <your-repo-link>

# Move into project folder
cd herhealth

# Install dependencies
npm install


**RUN COMMANDS**

node server.js
open in browser http://localhost:3000


**SCREENSHOTS**

<img width="1888" height="901" alt="homepage" src="https://github.com/user-attachments/assets/3e2b1657-814d-49cc-a518-639e1823d62d" />
<img width="1919" height="891" alt="demo3" src="https://github.com/user-attachments/assets/e47ff181-a651-4c50-99d8-fca9e15d6d85" />
<img width="1888" height="897" alt="demo2" src="https://github.com/user-attachments/assets/c1c7c266-00a7-4aa2-833b-c52a23d50a32" />
<img width="1860" height="873" alt="demo1" src="https://github.com/user-attachments/assets/76646965-1d83-4fe6-ab20-6751306f068e" />


**DEMO VIDEO LINK**

https://drive.google.com/file/d/1Sfo9b1TKgUx2_3Tb7M3pDNFomMDXT5XR/view?usp=sharing

**ARCHITECHTURE DIAGRAM**


[ User / Browser ]

        |
        v
[ Frontend: HTML, CSS, JS ]

        |
        v
[ Backend: Node.js + Express + Mongoose ]

        |
        v
[ Database: MongoDB ]


**API DOCS**

1. Add User Data

Endpoint: POST /add

Purpose: Save user information to the database.

Request Body (JSON):

{
  "name": "Devika"
}

Response (JSON):

{
  "message": "Data saved successfully!"
}

2. Get All Users

Endpoint: GET /users

Purpose: Retrieve all user data from MongoDB.

Request: No body required.

Response (JSON):

[
  { "_id": "640d...", "name": "Devika" },
  { "_id": "640d...", "name": "Anjali" }
]

3. Update User

Endpoint: PUT /update/:id

Purpose: Update a user’s name using their unique ID.

Request Body (JSON):

{
  "name": "New Name"
}

Response (JSON):

{
  "message": "User updated successfully!"
}

4. Delete User

Endpoint: DELETE /delete/:id

Purpose: Remove a user from the database by ID.

Request: No body required.

Response (JSON):

{
  "message": "User deleted successfully!"
}

5. Notes

All endpoints return JSON.

Backend server runs on http://localhost:3000
.

MongoDB database name: mydb.

Collection name: users.


**TEAM MEMBERS**

Devika S — Frontend & UI/UX Design

Anusree S — Backend & Database Integration

**LICENSE INFO**

MIT License

Copyright (c) 2026 Devika S.

You are free to use, copy, modify, and distribute this project. 
Include this notice in all copies. The project is provided "as is" without warranty.

Note: MongoDB Community Edition is under SSPL; this project does not modify MongoDB.
