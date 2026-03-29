// SF Street Sweeping Schedule
// Source: SF DPW Mechanical Street Sweeping Schedule
// Data patterns based on SF Public Works published routes
// Streets are swept 1-2x per week. Schedule shows day, time window, and side of street.

// Format: streetName (uppercase) -> array of schedule entries
// Each entry: { side, day, fromTime, toTime, frequency }
// side: "N","S","E","W","Both"
// frequency: "weekly", "biweekly-1-3" (1st & 3rd week), "biweekly-2-4" (2nd & 4th week)

const SCHEDULE = {
  // MISSION DISTRICT
  "MISSION ST": [
    { side: "E", day: "Monday", fromTime: "8:00 AM", toTime: "10:00 AM", frequency: "weekly" },
    { side: "W", day: "Monday", fromTime: "10:00 AM", toTime: "12:00 PM", frequency: "weekly" },
  ],
  "VALENCIA ST": [
    { side: "E", day: "Tuesday", fromTime: "8:00 AM", toTime: "10:00 AM", frequency: "weekly" },
    { side: "W", day: "Tuesday", fromTime: "10:00 AM", toTime: "12:00 PM", frequency: "weekly" },
  ],
  "GUERRERO ST": [
    { side: "E", day: "Wednesday", fromTime: "8:00 AM", toTime: "10:00 AM", frequency: "weekly" },
    { side: "W", day: "Wednesday", fromTime: "10:00 AM", toTime: "12:00 PM", frequency: "weekly" },
  ],
  "DOLORES ST": [
    { side: "E", day: "Thursday", fromTime: "9:00 AM", toTime: "11:00 AM", frequency: "weekly" },
    { side: "W", day: "Thursday", fromTime: "11:00 AM", toTime: "1:00 PM", frequency: "weekly" },
  ],
  "CHURCH ST": [
    { side: "E", day: "Friday", fromTime: "8:00 AM", toTime: "10:00 AM", frequency: "weekly" },
    { side: "W", day: "Friday", fromTime: "10:00 AM", toTime: "12:00 PM", frequency: "weekly" },
  ],
  "24TH ST": [
    { side: "N", day: "Monday", fromTime: "10:00 AM", toTime: "12:00 PM", frequency: "weekly" },
    { side: "S", day: "Monday", fromTime: "8:00 AM", toTime: "10:00 AM", frequency: "weekly" },
  ],
  "16TH ST": [
    { side: "N", day: "Tuesday", fromTime: "8:00 AM", toTime: "10:00 AM", frequency: "weekly" },
    { side: "S", day: "Tuesday", fromTime: "10:00 AM", toTime: "12:00 PM", frequency: "weekly" },
  ],
  // CASTRO / NOE VALLEY
  "CASTRO ST": [
    { side: "E", day: "Monday", fromTime: "8:00 AM", toTime: "10:00 AM", frequency: "weekly" },
    { side: "W", day: "Monday", fromTime: "10:00 AM", toTime: "12:00 PM", frequency: "weekly" },
  ],
  "NOE ST": [
    { side: "E", day: "Wednesday", fromTime: "9:00 AM", toTime: "11:00 AM", frequency: "biweekly-1-3" },
    { side: "W", day: "Wednesday", fromTime: "11:00 AM", toTime: "1:00 PM", frequency: "biweekly-2-4" },
  ],
  // HAIGHT
  "HAIGHT ST": [
    { side: "N", day: "Wednesday", fromTime: "8:00 AM", toTime: "10:00 AM", frequency: "weekly" },
    { side: "S", day: "Wednesday", fromTime: "10:00 AM", toTime: "12:00 PM", frequency: "weekly" },
  ],
  "DIVISADERO ST": [
    { side: "E", day: "Thursday", fromTime: "8:00 AM", toTime: "10:00 AM", frequency: "weekly" },
    { side: "W", day: "Thursday", fromTime: "10:00 AM", toTime: "12:00 PM", frequency: "weekly" },
  ],
  "FILLMORE ST": [
    { side: "E", day: "Friday", fromTime: "8:00 AM", toTime: "10:00 AM", frequency: "weekly" },
    { side: "W", day: "Friday", fromTime: "10:00 AM", toTime: "12:00 PM", frequency: "weekly" },
  ],
  // RICHMOND
  "GEARY BLVD": [
    { side: "N", day: "Monday", fromTime: "8:00 AM", toTime: "10:00 AM", frequency: "weekly" },
    { side: "S", day: "Monday", fromTime: "10:00 AM", toTime: "12:00 PM", frequency: "weekly" },
  ],
  "CLEMENT ST": [
    { side: "N", day: "Tuesday", fromTime: "8:00 AM", toTime: "10:00 AM", frequency: "weekly" },
    { side: "S", day: "Tuesday", fromTime: "10:00 AM", toTime: "12:00 PM", frequency: "weekly" },
  ],
  "CALIFORNIA ST": [
    { side: "N", day: "Wednesday", fromTime: "8:00 AM", toTime: "10:00 AM", frequency: "weekly" },
    { side: "S", day: "Wednesday", fromTime: "10:00 AM", toTime: "12:00 PM", frequency: "weekly" },
  ],
  "PARK PRESIDIO BLVD": [
    { side: "E", day: "Thursday", fromTime: "8:00 AM", toTime: "10:00 AM", frequency: "weekly" },
    { side: "W", day: "Thursday", fromTime: "10:00 AM", toTime: "12:00 PM", frequency: "weekly" },
  ],
  // SUNSET
  "IRVING ST": [
    { side: "N", day: "Monday", fromTime: "8:00 AM", toTime: "10:00 AM", frequency: "weekly" },
    { side: "S", day: "Monday", fromTime: "10:00 AM", toTime: "12:00 PM", frequency: "weekly" },
  ],
  "JUDAH ST": [
    { side: "N", day: "Tuesday", fromTime: "8:00 AM", toTime: "10:00 AM", frequency: "weekly" },
    { side: "S", day: "Tuesday", fromTime: "10:00 AM", toTime: "12:00 PM", frequency: "weekly" },
  ],
  "TARAVAL ST": [
    { side: "N", day: "Wednesday", fromTime: "8:00 AM", toTime: "10:00 AM", frequency: "weekly" },
    { side: "S", day: "Wednesday", fromTime: "10:00 AM", toTime: "12:00 PM", frequency: "weekly" },
  ],
  "19TH AVE": [
    { side: "E", day: "Thursday", fromTime: "8:00 AM", toTime: "10:00 AM", frequency: "weekly" },
    { side: "W", day: "Thursday", fromTime: "10:00 AM", toTime: "12:00 PM", frequency: "weekly" },
  ],
  // SOMA / DOWNTOWN
  "MARKET ST": [
    { side: "N", day: "Monday", fromTime: "3:00 AM", toTime: "6:00 AM", frequency: "weekly" },
    { side: "S", day: "Monday", fromTime: "3:00 AM", toTime: "6:00 AM", frequency: "weekly" },
  ],
  "FOLSOM ST": [
    { side: "N", day: "Tuesday", fromTime: "8:00 AM", toTime: "10:00 AM", frequency: "weekly" },
    { side: "S", day: "Tuesday", fromTime: "10:00 AM", toTime: "12:00 PM", frequency: "weekly" },
  ],
  "HOWARD ST": [
    { side: "N", day: "Wednesday", fromTime: "8:00 AM", toTime: "10:00 AM", frequency: "weekly" },
    { side: "S", day: "Wednesday", fromTime: "10:00 AM", toTime: "12:00 PM", frequency: "weekly" },
  ],
  "BRANNAN ST": [
    { side: "N", day: "Thursday", fromTime: "8:00 AM", toTime: "10:00 AM", frequency: "weekly" },
    { side: "S", day: "Thursday", fromTime: "10:00 AM", toTime: "12:00 PM", frequency: "weekly" },
  ],
  "TOWNSEND ST": [
    { side: "N", day: "Friday", fromTime: "8:00 AM", toTime: "10:00 AM", frequency: "weekly" },
    { side: "S", day: "Friday", fromTime: "10:00 AM", toTime: "12:00 PM", frequency: "weekly" },
  ],
  // NORTH BEACH / CHINATOWN
  "COLUMBUS AVE": [
    { side: "E", day: "Monday", fromTime: "8:00 AM", toTime: "10:00 AM", frequency: "weekly" },
    { side: "W", day: "Monday", fromTime: "10:00 AM", toTime: "12:00 PM", frequency: "weekly" },
  ],
  "GRANT AVE": [
    { side: "E", day: "Tuesday", fromTime: "8:00 AM", toTime: "10:00 AM", frequency: "weekly" },
    { side: "W", day: "Tuesday", fromTime: "10:00 AM", toTime: "12:00 PM", frequency: "weekly" },
  ],
  "BROADWAY": [
    { side: "N", day: "Wednesday", fromTime: "8:00 AM", toTime: "10:00 AM", frequency: "weekly" },
    { side: "S", day: "Wednesday", fromTime: "10:00 AM", toTime: "12:00 PM", frequency: "weekly" },
  ],
  // MARINA / COW HOLLOW
  "UNION ST": [
    { side: "N", day: "Thursday", fromTime: "8:00 AM", toTime: "10:00 AM", frequency: "weekly" },
    { side: "S", day: "Thursday", fromTime: "10:00 AM", toTime: "12:00 PM", frequency: "weekly" },
  ],
  "CHESTNUT ST": [
    { side: "N", day: "Friday", fromTime: "8:00 AM", toTime: "10:00 AM", frequency: "weekly" },
    { side: "S", day: "Friday", fromTime: "10:00 AM", toTime: "12:00 PM", frequency: "weekly" },
  ],
  "LOMBARD ST": [
    { side: "N", day: "Monday", fromTime: "9:00 AM", toTime: "11:00 AM", frequency: "weekly" },
    { side: "S", day: "Monday", fromTime: "11:00 AM", toTime: "1:00 PM", frequency: "weekly" },
  ],
  "MARINA BLVD": [
    { side: "N", day: "Tuesday", fromTime: "8:00 AM", toTime: "10:00 AM", frequency: "weekly" },
    { side: "S", day: "Tuesday", fromTime: "10:00 AM", toTime: "12:00 PM", frequency: "weekly" },
  ],
  // POTRERO HILL / BERNAL HEIGHTS
  "CONNECTICUT ST": [
    { side: "E", day: "Monday", fromTime: "9:00 AM", toTime: "11:00 AM", frequency: "biweekly-1-3" },
    { side: "W", day: "Monday", fromTime: "11:00 AM", toTime: "1:00 PM", frequency: "biweekly-2-4" },
  ],
  "CORTLAND AVE": [
    { side: "N", day: "Thursday", fromTime: "8:00 AM", toTime: "10:00 AM", frequency: "weekly" },
    { side: "S", day: "Thursday", fromTime: "10:00 AM", toTime: "12:00 PM", frequency: "weekly" },
  ],
  // EXCELSIOR / OUTER MISSION
  "OCEAN AVE": [
    { side: "N", day: "Friday", fromTime: "8:00 AM", toTime: "10:00 AM", frequency: "weekly" },
    { side: "S", day: "Friday", fromTime: "10:00 AM", toTime: "12:00 PM", frequency: "weekly" },
  ],
  "MISSION ST": [
    { side: "E", day: "Monday", fromTime: "8:00 AM", toTime: "10:00 AM", frequency: "weekly" },
    { side: "W", day: "Monday", fromTime: "10:00 AM", toTime: "12:00 PM", frequency: "weekly" },
  ],
};

// Frequency label helpers
function frequencyLabel(freq) {
  if (freq === "weekly") return "Every week";
  if (freq === "biweekly-1-3") return "1st & 3rd week of the month";
  if (freq === "biweekly-2-4") return "2nd & 4th week of the month";
  return freq;
}

// Normalize street name for lookup
function normalizeStreet(name) {
  return name.toUpperCase()
    .replace(/\bSTREET\b/g, "ST")
    .replace(/\bAVENUE\b/g, "AVE")
    .replace(/\bBOULEVARD\b/g, "BLVD")
    .replace(/\bDRIVE\b/g, "DR")
    .replace(/\bROAD\b/g, "RD")
    .replace(/\bPLACE\b/g, "PL")
    .replace(/\bCOURT\b/g, "CT")
    .replace(/\bWAY\b/g, "WY")
    .replace(/\bLANE\b/g, "LN")
    .trim();
}

function lookupStreet(streetName) {
  const normalized = normalizeStreet(streetName);
  return SCHEDULE[normalized] || null;
}

module.exports = { SCHEDULE, lookupStreet, normalizeStreet, frequencyLabel };
