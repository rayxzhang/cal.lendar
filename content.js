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
    
    const columns = document.querySelectorAll('.css-1hyowku-columnCss');
    console.log('Found columns:', columns.length);
    
    columns.forEach((column, dayIndex) => {
        const buttons = column.querySelectorAll('[role="button"]');
        console.log(`Day ${days[dayIndex]} has ${buttons.length} classes`);
        
        buttons.forEach(class_ => {
            const info = class_.getAttribute('aria-label');
            console.log('Class info:', info);
            
            if (!info) return;

            const match = info.match(/(.+?)-(\d+[^\s]+(?:\s+[^\s]+)?)\s+(?:br>)?\s+(.+?)\s+(\w+)\s+from\s+(\d+:\d+(?:am|pm))\s+to\s+(\d+:\d+(?:am|pm))/i);
            if (match) {
                // Split course number at the space if it exists
                const fullCourseNumber = match[2].trim();
                const courseNumber = fullCourseNumber.split(' ')[0];
                
                const classInfo = {
                    subject: match[1].trim(),
                    courseNumber: courseNumber,
                    location: match[3].trim(),
                    day: days[dayIndex],
                    startTime: match[5],
                    endTime: match[6]
                };
                console.log('Extracted class:', classInfo);
                schedule.push(classInfo);
            } else {
                console.log('No match found for:', info);
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