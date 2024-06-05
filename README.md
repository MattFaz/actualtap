<h1 align="center">Actual Tap</h1>

<p align="center">
    <img src="images/logo.webp" width="200" height="200">
    <br>
    <i>Automatically create transactions in <a href="https://github.com/actualbudget/actual">Actual Budget</a> when you use Tap-to-Pay on a mobile device</i>
</p>

## Contents
- [Overview](#overview)
- [Run the App](#run-the-app)
- [iOS Setup](#ios-setup)
- [Android Setup](#android-setup)
- [Caddy](#caddy)

# Overview
Actual Tap is a Fastify API that utilises the Actual Budget API Client to create transactions.

The primary purpose of Actual Tap is receive a POST request from mobile devices *(.e.g iOS Shortcuts)* when a Tap to Pay transaction is made. Once the POST request is received Actual Tap will POST the Name and Amount to Actual Budget.

Ideal flow:
1. Mobile device is tapped to make a purchase
2. Automation on mobile device is triggered
    - Recommedned apps are [Shortcuts](https://apps.apple.com/us/app/shortcuts/id915249334) (iOS) or [Tasker](https://play.google.com/store/apps/details?id=net.dinglisch.android.taskerm&pcampaignid=web_share) (Android)
3. POST request containing transaction information *(merchant & amount)* is sent to Actual Tap
4. Actual Tap creates the transaction in Actual Budget

<p align="center">
    <img src="images/flow.png">
</p>

**Notes:** This is in active / heavy development, issues, pull requests, feature requests etc. are welcome. 

---

## Running the App

To run Actual Tap locally *(i.e. for development or not containerised)*:
- `$ cp .env.sample .env`
- Edit the `.env` file accordingly

To run Actual Tap in docker ensure you edit variables in the `docker-compose.yml` file.

Both will need to ensure they have the following environment variables:
- **Note:** Do not edit the `NODE_ENV` variable, leave it as its default

| **Variable** | **Example** | **Comment** |
|---|---|---|
| `API_KEY` | 527D6AAA-B22A-4D48-9DC8-C203139E5531 | Unique Id |
| `ACTUAL_URL` | https://actual.yourdomain.com | URL to Actual Budget Server |
| `ACTUAL_PASSWORD` | superSecretPassword | Password for your Actual Budget Server |
| `ACTUAL_BUDGET_ID` | 8B51B58D-3A0D-4B5B-A41F-DE574306A4F2 | The Unique Id of your Budget |
| `ACTUAL_DEFAULT_ACCOUNT_ID` | 8AF657D4-4811-42C7-8272-E299A8DAC43A | The Unique Id of an account you want transactions to default too |

The app will be running on port `3001`

## iOS Setup

1. Open Shortcuts app
2. Select Automations
3. Create new Automation to Run Immediately
4. When:
    - I tap any of x Wallet passes or payment cards
5. Do:
    - Receive transaction as input
    - Get numbers from Amount (*transaction variable*)
    - Get contents of URL:
        - URL = *your subdomain*
        - Headers = `{ api_key: <your_api_key>}`
        - Body = JSON `{ merchant: <merchant_variable>, amount: <numbers_variable> }`

## Android Setup

TBC

## Caddy
Below is the caddyfile I use:

```
xxx
```