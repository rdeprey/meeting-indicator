const fetch = require('node-fetch')
const cron = require('node-cron')
const { DateTime } = require('luxon')
const { getToken, tokenRequest, apiConfig } = require('./auth')

// Makes environment variables available
require('dotenv').config()

// Initializes the Adafruit i2c LCD screen
// Package details: https://www.npmjs.com/package/adafruit-i2c-lcd
const LCDPLATE = require('adafruit-i2c-lcd').plate

// Creates a reference to the LCD screen based on its i2c address
const lcd = new LCDPLATE(1, 0x20)

// Clears message on LCD screen and turns off the backlight
const turnOffScreen = () => {
  lcd.clear()
  lcd.backlight(lcd.colors.OFF)
}

// Runs when you enter CTRL + C
process.on('SIGINT', function () {
  turnOffScreen()
  lcd.close()
  process.exit()
})

// Gets the Microsoft Graph Explorer API auth token
const getAuthToken = async () => {
  const authResponse = await getToken(tokenRequest)
  return authResponse.accessToken
}

// Get's my user ID from Microsoft Graph Explorer API
const getUserId = async (apiOptions) => {
  const userRes = await fetch(apiConfig.uri, apiOptions)
  const { value } = await userRes.json()
  return value[0].id
}

// Gets the calendar events from Outlook using the Microsoft Graph Explorer API
const fetchMeetings = async () => {
  const accessToken = await getAuthToken()
  const currentDateTime = DateTime.utc().toString()
  const thirtyMinutesFromNow = DateTime.utc().plus({ minutes: 30 }).toString()

  const options = {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  }

  const userId = await getUserId(options)

  // The OUTLOOK_CALENDAR_ID specifies which of your calendars to get meetings from
  const endpointWithQueryParams = `https://graph.microsoft.com/v1.0/users/${userId}/calendars/${process.env.OUTLOOK_CALENDAR_ID}/calendarview?startdatetime=${currentDateTime}&enddatetime=${thirtyMinutesFromNow}`

  const meetingRes = await fetch(endpointWithQueryParams, options)
  const { value: meetings } = await meetingRes.json()

  return meetings
}

// Checks if a meeting is currently in progress by comparing the current date/time to the dates/times for each meeting
const isMeetingHappeningNow = (meetings) => {
  const currentDateTime = DateTime.utc().toString()

  if (!meetings || meetings.length === 0) {
     return false
  }

  // Get meetings happening right now
  const currentMeetings = meetings.filter((meeting) => {
    if (
      Date.parse(DateTime.fromISO(meeting.start.dateTime, { zone: "utc" }).toString()) <= Date.parse(currentDateTime) &&
      Date.parse(DateTime.fromISO(meeting.end.dateTime, { zone: "utc" }).toString()) >= Date.parse(currentDateTime)
    ) {
      return true
    }

    return false
  })

  // If there's at least one meeting happening right now, then there
  // are meetings currently happening.
  if (currentMeetings.length > 0) {
    return true
  }

  return false
}

const start = async () => {
  try {
    const currentDateTime = DateTime.utc()

    // Numeric value representing day of week; 6 is Saturday and 7 is Sunday
    const { weekday } = currentDateTime

    if (weekday === 6 || weekday === 7) {
      turnOffScreen()
      return
    }

    // A date string representing the work start time (9 am) for the current date in UTC
    const workStart = DateTime.utc(
      currentDateTime.year,
      currentDateTime.month,
      currentDateTime.day,
      14,
      0,
      0
    ).toString()

    // A date string representing the work end time (5 pm) for the current date in UTC
    const workEnd = DateTime.utc(
      currentDateTime.year,
      currentDateTime.month,
      currentDateTime.day,
      22,
      0,
      0
    ).toString()

    // Turn off the screen outside of work hours
    if (
      Date.parse(workStart) > Date.parse(currentDateTime.toString()) ||
      Date.parse(currentDateTime.toString()) > Date.parse(workEnd)
    ) {
      turnOffScreen()
      return
    }

    const meetings = await fetchMeetings()

    const isHappeningNow = isMeetingHappeningNow(meetings)

    // Clear the previous message from the screen
    lcd.clear()

    // If there's a meeting happening, show a message and make the screen red
    if (isHappeningNow) {
      lcd.backlight(lcd.colors.RED)
      lcd.message('Meeting in\nProgress!')
    } else {
      // If there isn't a meeting happening, show a message and make the screen green
      lcd.backlight(lcd.colors.GREEN)
      lcd.message("I'm free!")
    }
  } catch (error) {
    console.log(error)
    await fetch(
      `https://api.pushover.net/1/messages.json?title=Meeting+Indicator+Error&message=${error.message}&token=${process.env.PUSHOVER_TOKEN}&user=${process.env.PUSHOVER_USER}`,
      { method: 'POST' }
    )
  }
}

cron.schedule('*/15 * * * *', start) // runs once every 15 minutes
start()
