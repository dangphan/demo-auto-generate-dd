export function isValidJsonString(str: any) {
  // Ensure the input is actually a string before attempting to parse
  if (typeof str !== "string") {
    return false;
  }
  try {
    // Attempt to parse the string.
    // If it's not valid JSON, JSON.parse will throw a SyntaxError.
    JSON.parse(str);
    // If parsing succeeds, it's valid JSON.
    return true;
  } catch (e) {
    // If an error is caught, it means the string is not valid JSON.
    // You could also log 'e' here for debugging purposes: console.error(e);
    return false;
  }
}

export function extractScheduleData(inputStrings) {
  let agreement = null;
  let originalSchedule = null;
  let idealSchedule = null;
  let requestSchedule = null;

  inputStrings.forEach((line) => {
    // Regular expression to match the key and capture the array part
    const agreementMatch = line.match(/Agreement: \[(.*?)\]/);
    const originalScheduleMatch = line.match(/Original schedule: \[(.*?)\]/);
    const idealScheduleMatch = line.match(/Ideal schedule: \[(.*?)\]/);
    const requestScheduleMatch = line.match(/Requested schedule: \[(.*?)\]/);

    if (agreementMatch && agreementMatch[1]) {
      try {
        const cleanedString = agreementMatch[1].replace(/\s+/g, " ").trim();
        agreement = cleanedString
          .split(" ")
          .filter((s) => s !== "")
          .map(Number);
      } catch (e) {
        console.error("Error parsing Agreement:", e);
      }
    } else if (originalScheduleMatch && originalScheduleMatch[1]) {
      try {
        const cleanedString = originalScheduleMatch[1]
          .replace(/\s+/g, " ")
          .trim();
        originalSchedule = cleanedString
          .split(" ")
          .filter((s) => s !== "")
          .map(Number);
      } catch (e) {
        console.error("Error parsing Original schedule:", e);
      }
    } else if (idealScheduleMatch && idealScheduleMatch[1]) {
      try {
        const cleanedString = idealScheduleMatch[1].replace(/\s+/g, " ").trim();
        idealSchedule = cleanedString
          .split(" ")
          .filter((s) => s !== "")
          .map(Number);
      } catch (e) {
        console.error("Error parsing Ideal schedule:", e);
      }
    } else if (requestScheduleMatch && requestScheduleMatch[1]) {
      try {
        const cleanedString = requestScheduleMatch[1]
          .replace(/\s+/g, " ")
          .trim();
        requestSchedule = cleanedString
          .split(" ")
          .filter((s) => s !== "")
          .map(Number);
      } catch (e) {
        console.error("Error parsing Requested schedule:", e);
      }
    }
  });

  // Return an object containing all extracted arrays
  return {
    agreement: agreement,
    originalSchedule: originalSchedule,
    idealSchedule: idealSchedule,
    requestSchedule: requestSchedule,
  };
}

export function roundToNearestTen(num: number | string): number {
  if (typeof num === "string") {
    num = parseFloat(num);
  }
  if (isNaN(num)) {
    throw new Error(
      "Input must be a valid number or a string representing a number."
    );
  }
  return Math.round(num / 10) * 10;
}
