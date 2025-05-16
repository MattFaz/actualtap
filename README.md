# Actual Tap

<p align="center">
    <img src="images/logo.webp" width="200" height="200">
    <br>
    <i>Automatically create transactions in <a href="https://github.com/actualbudget/actual">Actual Budget</a> when you use Tap-to-Pay on a mobile device</i>
</p>

## Overview

Actual Tap bridges the gap between mobile payments and your Actual Budget, making expense tracking seamless and automatic. When you tap to pay with your mobile device, Actual Tap receives the transaction details and automatically creates the corresponding entry in your Actual Budget.

## Key Features

- 🚀 Fast and lightweight Fastify API
- 💳 Automatic transaction creation from Tap-to-Pay
- 📱 Mobile automation support (iOS Shortcuts & Android Tasker)
    - [iOS Shortcut](xxx)
- 🔒 Secure API key authentication
- 🐳 Easy deployment with Docker
- 🔄 Real-time transaction syncing with Actual Budget

## How It Works

Actual Tap is a Fastify API that utilizes the Actual Budget API Client to create transactions. Here's the ideal flow:

1. Mobile device is tapped to make a purchase
2. Automation on mobile device is triggered
    - Recommended apps are [Shortcuts](https://apps.apple.com/us/app/shortcuts/id915249334) (iOS) or [Tasker](https://play.google.com/store/apps/details?id=net.dinglisch.android.taskerm) (Android)
3. POST request containing transaction information (merchant & amount) is sent to Actual Tap
4. Actual Tap creates the transaction in Actual Budget

<p align="center">
    <img src="images/flow.png">
</p>

## Setup and Installation

### Running with Docker

```bash
docker run -p 3001:3001 \
  -e API_KEY=your_api_key \
  -e ACTUAL_URL=your_actual_url \
  -e ACTUAL_PASSWORD=your_password \
  -e ACTUAL_BUDGET_ID=your_budget_id \
  mattyfaz/actualtap
```
### Environment Variables

| Variable | Example | Description |
|----------|---------|-------------|
| `API_KEY` | 527D6AAA-B22A-4D48-9DC8-C203139E5531 | Unique API key for authentication (generate with [uuidgenerator.net](https://www.uuidgenerator.net)) |
| `ACTUAL_URL` | https://actual.yourdomain.com | URL to Actual Budget Server |
| `ACTUAL_PASSWORD` | superSecretPassword | Password for your Actual Budget Server |
| `ACTUAL_BUDGET_ID` | 8B51B58D-3A0D-4B5B-A41F-DE574306A4F2 | The Unique ID of your Budget |

### Local Development

1. Copy the environment file:
   ```bash
   cp .env.sample .env
   ```
2. Edit the `.env` file with your configuration
3. The app will run on port `3001`

## Mobile Setup

### iOS Setup

1. Open Shortcuts app
2. Select Automations
3. Create new Automation to Run Immediately
4. When:
    - I tap any of x Wallet passes or payment cards
5. Do:
    - Receive transaction as input
    - Get numbers from Amount (_transaction variable_)
    - Get contents of URL:
        - URL = _your subdomain_
        - Headers = `{ X-API-KEY: <your_api_key>}`
        - Body = JSON `{ merchant: <merchant_variable>, amount: <numbers_variable>, accountName: <exact_account_name> }`

### Android Setup

TBC

---

**Note:** This project is in active development. Issues, pull requests, and feature requests are welcome.
