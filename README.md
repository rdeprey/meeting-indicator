# Meeting Indicator

This NodeJs console application uses Microsoft Graph Explorer APIs to get Outlook events and display
a message on an LCD screen to indicate when a meeting is in progress.

![Meeting in Progress](/images/meeting-indicator-in-progress.jpeg)

![Free](/images/meeting-indicator-free.jpeg)

## Tutorial

[I wrote a tutorial](https://rebeccamdeprey.com/blog/make-a-meeting-indicator-screen) that you can read to find out more about the project and how to set up the necessary Azure infrastructure.

## Environment

The application is meant to be run on a Raspberry Pi Zero using the [Adafruit i2c RGB LCD Pi Plate screen](https://www.adafruit.com/product/1109).

### Node

Since the Raspberry Pi Zero uses the ARMv6 architecture, Node doesn't officially support it anymore (as of Node12). To install Node on the Raspberry Pi Zero, there are two options:

- Install the ARMv6 Node binary for Node11
- Install an unofficial Node binary from [Node's unofficial releases](https://unofficial-builds.nodejs.org/download/release/) (these aren't all tested before release, so it could break; they're considered experimental)

I'm using [Node v11.15.0](https://nodejs.org/fa/blog/release/v11.15.0/) on my Raspberry Pi Zero to run the application.

If you decide to use a newer version of Node, you might need to change how the file imports/exports are configured. There have been changes to how these work between older and newer versions of Node.

### Environment Variables

This application uses [`dotenv` to handle environment variables](https://rebeccamdeprey.com/blog/securely-manage-environment-variables-for-js-apps-with-dotenv). There's a dev.envrc file in the repo. This stores placeholder values for environment variables needed by the application.

Use the command below to make a copy of the `dev.env` file called `.env`.

```
cp dev.env .env
```

After copying the dev.env file, update the variable values in the new `.env` file with the appropriate values for your setup.

**Variable Definitions**

| Name                  | Expected Value                                                                                                                                                                                                          |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TENANT_ID`           | The tenant (aka directory) ID from your app registration in the Azure Portal                                                                                                                                            |
| `CLIENT_ID`           | The client (aka application) ID from your app registration in the Azure Portal                                                                                                                                          |
| `CLIENT_SECRET`       | The value of the client secret you created for your app in the Azure Portal                                                                                                                                             |
| `AAD_ENDPOINT`        | Appended to the tenant ID for use as the authority URL for getting tokens. You can likely use the default.                                                                                                              |
| `GRAPH_ENDPOINT`      | Used to get the scopes when getting tokens. You can use the default.                                                                                                                                                    |
| `OUTLOOK_CALENDAR_ID` | The ID for the calendar that you want to get events from. You can get this from the [Microsoft Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer) by running the "Get all my calendars" query. |
| `PUSHOVER_TOKEN`      | API token for Pushover service to send errors as push notifications to your phone (optional)                                                                                                                            |
| `PUSHOVER_USER`       | User ID for Pushover service to send errors as push notifications to your phone (optional)                                                                                                                              |

**DO NOT check the `.env` file into a public code repository.** It contains keys for your application in plain-text and someone else could use them to access your data.

## Error Notifications

The application is configured to send push notifications via the [Pushover service](https://pushover.net/). If you want to use this, make sure
to add your user ID and API token in your `.env` file. Otherwise, remove the request to Pushover from the `catch` block in the `index.js` file.

## Running the Console Application

To run the console application, do the following:

1. Navigate to the application folder on the Raspberry Pi's command line
2. Run `npm install` to install dependencies
3. Run `npm start` or `node index.js` in the application folder to start the console app

You can use `pm2` to [automatically start the application on your Raspberry Pi](https://rebeccamdeprey.com/blog/automatically-start-nodejs-applications-when-your-raspberry-pi-boots-up) whenever you restart it.
