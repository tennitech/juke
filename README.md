# *Juke - Your Music, Reimagined*

## ❓ *Who* are we?

We're a small team of 4 developers with a passion for making music lively again.

## ❓ *What* are we?

Let's cut to the chase. We're developing a retro, open-source music player that brings your music to life. How exactly?

## ❓ *Why* are we?

While the convenience of streaming is undeniable, we believe there's a way to combine both worlds—delivering the ease of modern technology with the rich, hands-on experience of the past. With Juke, you get more than just music; you get the nostalgia, the ritual, and the authenticity, all without sacrificing the benefits of today's streaming platforms.

## Stack

### Main API
* Spotify API
  
### Web Application
* React/NPM
* HTML/CSS/JavaScript

### Distribution
* Electron
* Docker

### Hardware
* Raspberry Pi
* PCB Designing

## To Be Implemented

* Authorzation with PKCE.
    * Connect to main.
    * Refactor Code.
* Pulling user playlists using the Spotify API.

# 👨‍💻 Looking to Develop? Start Here.

## Prerequisites
Ensure you have the following installed:
- **Git**: [Download Git](https://git-scm.com/)
- **Node.js v22.2.0**: [Download Node.js](https://nodejs.org/en/download/)

---

## Setup on Windows

### Step 1: Install Git
1. Download Git from the [official website](https://git-scm.com/).
2. Run the installer and follow the setup instructions.
3. Open **Git Bash** or **Command Prompt** and verify the installation:
   ```bash
   git --version
   ```

### Step 2: Install Node.js v22.2.0
1. Download **Node.js v22.2.0** installer from [here](https://nodejs.org/en/download/).
2. Run the installer and follow the instructions.
3. Verify the installation:
   ```bash
   node --version
   npm --version
   ```

### Step 3: Clone the Project Juke Repository
1. Open **Git Bash** or **Command Prompt**.
2. Clone the repository:
   ```bash
   git clone https://github.com/tennitech/juke.git
   ```

### Step 4: Install Project Dependencies
1. Navigate to the `jukeos` folder:
   ```bash
   cd juke/jukeos
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Step 5: Start the App
1. Run the app in development mode:
   ```bash
   npm start
   ```

---

## Setup on macOS

### Step 1: Install Git
1. Open **Terminal**.
2. Install Git using **Homebrew**:
   ```bash
   brew install git
   ```
3. Verify the installation:
   ```bash
   git --version
   ```

### Step 2: Install Node.js v22.2.0
1. Install **Node.js** using **Homebrew**:
   ```bash
   brew install node@22.2.0
   ```
2. Verify the installation:
   ```bash
   node --version
   npm --version
   ```

### Step 3: Clone the Project Juke Repository
1. In **Terminal**, navigate to the directory where you want to clone the project.
2. Clone the repository:
   ```bash
   git clone https://github.com/tennitech/juke.git
   ```

### Step 4: Install Project Dependencies
1. Navigate to the `jukeos` folder:
   ```bash
   cd juke/jukeos
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Step 5: Start the App
1. Run the app in development mode:
   ```bash
   npm start
   ```

---

## Development Workflow

### Create a New Branch
```bash
git checkout -b feature-branch-name
```

### Stage, Commit, and Push Changes
```bash
git add .
git commit -m "Description of your changes"
git push origin feature-branch-name
```

### Create a Pull Request
1. Go to the [GitHub repository](https://github.com/tennitech/juke).
2. Create a new Pull Request for your branch.

---

That’s it! Follow these steps to set up your environment and start contributing to **Project Juke** and **JukeOS**.

---

This guide should work smoothly for both Windows and macOS environments.
