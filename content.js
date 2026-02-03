// Add function to check if we're on the correct page
function isSchedulePage() {
    const isSchedulerURL = window.location.href.includes('berkeley.collegescheduler.com');
    const hasScheduleElements = !!(
        document.querySelector('.css-1erwsnx-blockCalendarCss') ||
        document.querySelector('.css-bs8qup-calendarCss') ||
        document.querySelector('.css-1k99v3t-headerCss')
    );
    
    console.log('URL check:', isSchedulerURL);
    console.log('Elements check:', hasScheduleElements);
    return isSchedulerURL && hasScheduleElements;
}

function extractScheduleData() {
    const schedule = [];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    console.log('Starting schedule extraction...');
    
    // Get the header row to extract time information
    const headerRow = document.querySelector('.css-1k99v3t-headerCss');
    const dayHeaders = headerRow ? headerRow.querySelectorAll('.css-uegwnu-columnCss') : [];
    
    // Get all day columns
    const columns = document.querySelectorAll('.css-1hyowku-columnCss');
    console.log('Found columns:', columns.length);
    
    columns.forEach((column, dayIndex) => {
        if (dayIndex >= days.length) return;
        
        const day = days[dayIndex];
        
        // Get time info from the header's sr-only span for this day
        let dayTimeInfo = '';
        if (dayHeaders[dayIndex]) {
            const srOnlySpan = dayHeaders[dayIndex].querySelector('.sr-only');
            if (srOnlySpan) {
                dayTimeInfo = srOnlySpan.textContent || '';
            }
        }
        
        // Parse all courses from the sr-only span first
        // Format: "This day has Subject - CourseNumber COURSE_NAME from 8:00am to 8:59am Subject2 - CourseNumber2..."
        const courseTimeEntries = [];
        if (dayTimeInfo) {
            // Match pattern: "Subject - CourseNumber [COURSE_NAME] from TIME to TIME"
            // Use (.+?) to match the full subject (including dashes) until we hit " - " before course number
            // Course number can be like "142", "153B", or "192PF" (digits followed by optional letters)
            const coursePattern = /(.+?)\s*-\s*(\d+[A-Z]*)\s+.*?\s+from\s+(\d+:\d+(?:am|pm))\s+to\s+(\d+:\d+(?:am|pm))/gi;
            let match;
            while ((match = coursePattern.exec(dayTimeInfo)) !== null) {
                const entry = {
                    subject: match[1].trim(),
                    courseNumber: match[2].trim(),
                    startTime: match[3],
                    endTime: match[4]
                };
                console.log(`Parsed time entry for ${day}:`, entry);
                courseTimeEntries.push(entry);
            }
        } else {
            console.log(`No time info found for ${day}`);
        }
        
        // Find all course chips in this column
        const courseChips = column.querySelectorAll('[class*="chipCss"]');
        console.log(`Day ${day} has ${courseChips.length} classes`);
        
        // Track which time entries have been used to handle multiple sections of same course
        const usedTimeEntryIndices = new Set();
        
        courseChips.forEach((chip, chipIndex) => {
            // Extract course details from the detail div
            const detailDiv = chip.querySelector('.css-14x2cgx-tabletDescrCss-descrCss');
            if (!detailDiv) {
                console.log('No detail div found for chip');
                return;
            }
            
            const detailLines = detailDiv.querySelectorAll('div');
            
            if (detailLines.length < 1) {
                console.log('Insufficient detail lines');
                return;
            }
            
            // First line: "Public Health-142   Dwinelle 155" or "Business Admin-Undergrad-192PF   Internet/Online"
            const firstLine = detailLines[0].textContent.trim();
            
            // Parse subject, course number, and location from first line
            // Format: "Subject-CourseNumber   Location" (with multiple spaces)
            // Course number can be like "142", "153B", or "192PF" (digits followed by optional letters)
            const firstLineMatch = firstLine.match(/^(.+?)-(\d+[A-Z]*)\s{2,}(.+)$/);
            let subject, courseNumber, location;
            if (!firstLineMatch) {
                // Try alternative format with single space
                const altMatch = firstLine.match(/^(.+?)-(\d+[A-Z]*)\s+(.+)$/);
                if (!altMatch) {
                    console.log('Could not parse first line:', firstLine);
                    return;
                }
                subject = altMatch[1].trim();
                courseNumber = altMatch[2].trim();
                location = altMatch[3].trim();
            } else {
                subject = firstLineMatch[1].trim();
                courseNumber = firstLineMatch[2].trim();
                location = firstLineMatch[3].trim();
            }
            
            // Find matching time entry from the parsed courseTimeEntries
            // Match by subject and course number, and use first unused match to handle duplicates
            let matchingEntry = null;
            let matchingIndex = -1;
            
            // Normalize subject names for comparison (remove extra spaces, handle dashes)
            const normalizeSubject = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();
            const normalizedSubject = normalizeSubject(subject);
            
            console.log(`Looking for match: subject="${subject}", courseNumber="${courseNumber}"`);
            console.log(`Available time entries:`, courseTimeEntries.map(e => `${e.subject} ${e.courseNumber} (${e.startTime}-${e.endTime})`));
            
            for (let i = 0; i < courseTimeEntries.length; i++) {
                if (usedTimeEntryIndices.has(i)) continue;
                const entry = courseTimeEntries[i];
                const normalizedEntrySubject = normalizeSubject(entry.subject);
                
                if (normalizedEntrySubject === normalizedSubject && 
                    entry.courseNumber === courseNumber) {
                    matchingEntry = entry;
                    matchingIndex = i;
                    break;
                }
            }
            
            if (matchingEntry) {
                usedTimeEntryIndices.add(matchingIndex);
                const classInfo = {
                    subject: subject,
                    courseNumber: courseNumber,
                    location: location,
                    day: day,
                    startTime: matchingEntry.startTime,
                    endTime: matchingEntry.endTime
                };
                console.log('Extracted class:', classInfo);
                schedule.push(classInfo);
            } else {
                console.log('Could not find time for:', subject, courseNumber, 'in dayTimeInfo');
                console.log(`Normalized subject: "${normalizedSubject}"`);
                console.log(`Available entries:`, courseTimeEntries.map(e => `"${normalizeSubject(e.subject)}" ${e.courseNumber}`));
                // If we can't find the time, we still add it but without time info
                // This shouldn't happen, but it's a fallback
            }
        });
    });
    
    console.log('Final schedule:', schedule);
    return schedule;
}

function generateICS(schedule, semesterInfo) {
    if (!semesterInfo || !semesterInfo.start || !semesterInfo.end) {
        console.error('Invalid semester info:', semesterInfo);
        throw new Error('Missing semester dates');
    }

    console.log('Semester period:', {
        start: semesterInfo.start,
        end: semesterInfo.end,
        holidays: semesterInfo.holidays
    });

    let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Schedule to ICS//Berkeley//EN',
        'CALSCALE:GREGORIAN'
    ].join('\r\n') + '\r\n';

    function formatDateTime(date, timeStr) {
        const [_, hours, minutes, period] = timeStr.match(/(\d+):(\d+)(am|pm)/i);
    
        let hour = parseInt(hours);
        if (period.toLowerCase() === 'pm' && hour !== 12) {
            hour += 12;
        } else if (period.toLowerCase() === 'am' && hour === 12) {
            hour = 0;
        }
        
        if (hour < 8) {
            hour += 12;
        }
        
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const formattedHours = hour.toString().padStart(2, '0');
        const formattedMinutes = minutes.toString().padStart(2, '0');
        
        return `${year}${month}${day}T${formattedHours}${formattedMinutes}00`;
    }

    function getRecurrenceRule(dayName) {
        const days = {
            'Monday': 'MO',
            'Tuesday': 'TU',
            'Wednesday': 'WE',
            'Thursday': 'TH',
            'Friday': 'FR'
        };
        return `FREQ=WEEKLY;BYDAY=${days[dayName]}`;
    }

    function getExcludeDates(dayName, startDate, endDate, holidays) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const targetDay = days.indexOf(dayName);
        const excludeDates = [];
        
        let currentDate = new Date(startDate + 'T00:00:00');
        const semesterEnd = new Date(endDate + 'T23:59:59');
        
        while (currentDate <= semesterEnd) {
            if (currentDate.getDay() === targetDay) {
                const dateStr = currentDate.toISOString().split('T')[0];
                const isHoliday = holidays.some(holiday => holiday.date === dateStr);
                
                if (isHoliday) {
                    excludeDates.push(new Date(currentDate));
                }
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return excludeDates;
    }

    function getFirstClassDate(startDate, dayName) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const targetDay = days.indexOf(dayName);
        const date = new Date(startDate + 'T00:00:00');
        
        // Adjust the date until we hit the right day of the week
        while (date.getDay() !== targetDay) {
            date.setDate(date.getDate() + 1);
        }
        
        return date;
    }

    schedule.forEach(course => {
        // Get the first actual date this class occurs
        const firstClassDate = getFirstClassDate(semesterInfo.start, course.day);
        const excludeDates = getExcludeDates(
            course.day,
            semesterInfo.start,
            semesterInfo.end,
            semesterInfo.holidays || []
        );

        // Create event with recurrence
        const eventLines = [
            'BEGIN:VEVENT',
            `UID:${course.subject.replace(/\s+/g, '')}${course.courseNumber.replace(/\s+/g, '')}-${course.day}@berkeley.edu`,
            `DTSTAMP:${new Date().toISOString().split('.')[0].replace(/[-:]/g, '')}Z`,
            `DTSTART;TZID=America/Los_Angeles:${formatDateTime(firstClassDate, course.startTime)}`,
            `DTEND;TZID=America/Los_Angeles:${formatDateTime(firstClassDate, course.endTime)}`,
            `RRULE:${getRecurrenceRule(course.day)};UNTIL=${semesterInfo.end.replace(/-/g, '')}T235959Z`
        ];

        // Add EXDATE for holidays
        if (excludeDates.length > 0) {
            const exdates = excludeDates
                .map(date => formatDateTime(date, course.startTime))
                .join(',');
            eventLines.push(`EXDATE;TZID=America/Los_Angeles:${exdates}`);
        }

        eventLines.push(
            `SUMMARY:${course.subject} ${course.courseNumber}`,
            `LOCATION:${course.location}`,
            'END:VEVENT'
        );

        icsContent += eventLines.join('\r\n') + '\r\n';
    });

    icsContent += 'END:VCALENDAR\r\n';
    return icsContent;
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkPage') {
        const result = { isSchedulePage: isSchedulePage() };
        console.log('Page check result:', result);
        sendResponse(result);
        return true;
    }
    
    if (request.action === 'extractSchedule') {
        try {
            if (!request.calendar || !request.calendar.start || !request.calendar.end) {
                throw new Error('Invalid semester information provided');
            }
            
            console.log('Raw calendar data received:', request.calendar);
            
            const schedule = extractScheduleData();
            if (!schedule.length) {
                throw new Error('No classes found in schedule');
            }
            
            const icsContent = generateICS(schedule, request.calendar);
            

            const blob = new Blob([icsContent], { type: 'text/calendar' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `schedule_${request.semester.replace(' ', '_')}.ics`;
            a.click();
            
            // Clean up
            URL.revokeObjectURL(url);
            sendResponse({ success: true });
        } catch (error) {
            sendResponse({ success: false, error: error.message });
        }
        return true;
    }
});