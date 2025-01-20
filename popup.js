const academicCalendar = {
    "Fall 2024": {
        start: "2024-08-28",
        end: "2024-12-06",
        holidays: [
            { name: "Labor Day", date: "2024-09-02" },
            { name: "Veterans Day", date: "2024-11-11" },
            { name: "Non-Instructional Day", date: "2024-11-27" },
            { name: "Thanksgiving Holiday", date: "2024-11-28" },
            { name: "Thanksgiving Holiday", date: "2024-11-29" }
        ]
    },
    "Spring 2025": {
        start: "2025-01-21",
        end: "2025-05-02",
        holidays: [
            { name: "Martin Luther King Jr. Day", date: "2025-01-20" },
            { name: "Presidents Day", date: "2025-02-17" },
            { name: "Spring Recess", date: "2025-03-24" },
            { name: "Spring Recess", date: "2025-03-25" },
            { name: "Spring Recess", date: "2025-03-26" },
            { name: "Spring Recess", date: "2025-03-27" },
            { name: "Cesar Chavez Holiday", date: "2025-03-28" }
        ]
    },
    "Fall 2025": {
        start: "2025-08-27",
        end: "2025-12-05",
        holidays: [
            { name: "Labor Day", date: "2025-09-01" },
            { name: "Veterans Day", date: "2025-11-11" },
            { name: "Non-Instructional Day", date: "2025-11-26" },
            { name: "Thanksgiving Holiday", date: "2025-11-27" },
            { name: "Thanksgiving Holiday", date: "2025-11-28" }
        ]
    },
    "Spring 2026": {
        start: "2026-01-20",
        end: "2026-05-01",
        holidays: [
            { name: "Martin Luther King Jr. Day", date: "2026-01-19" },
            { name: "Presidents Day", date: "2026-02-16" },
            { name: "Spring Recess", date: "2026-03-23" },
            { name: "Spring Recess", date: "2026-03-24" },
            { name: "Spring Recess", date: "2026-03-25" },
            { name: "Spring Recess", date: "2026-03-26" },
            { name: "Cesar Chavez Holiday", date: "2026-03-27" }
        ]
    },
    "Fall 2026": {
        start: "2026-08-26",
        end: "2026-12-04",
        holidays: [
            { name: "Labor Day", date: "2026-09-07" },
            { name: "Veterans Day", date: "2026-11-11" },
            { name: "Non-Instructional Day", date: "2026-11-25" },
            { name: "Thanksgiving Holiday", date: "2026-11-26" },
            { name: "Thanksgiving Holiday", date: "2026-11-27" }
        ]
    },
    "Spring 2027": {
        start: "2027-01-19",
        end: "2027-05-07",
        holidays: [
            { name: "Martin Luther King Jr. Day", date: "2027-01-18" },
            { name: "Presidents Day", date: "2027-02-15" },
            { name: "Spring Recess", date: "2027-03-22" },
            { name: "Spring Recess", date: "2027-03-23" },
            { name: "Spring Recess", date: "2027-03-24" },
            { name: "Spring Recess", date: "2027-03-25" },
            { name: "Cesar Chavez Holiday", date: "2027-03-26" }
        ]
    },
    "Fall 2027": {
        start: "2027-08-25",
        end: "2027-12-03",
        holidays: [
            { name: "Labor Day", date: "2027-09-06" },
            { name: "Veterans Day", date: "2027-11-11" },
            { name: "Non-Instructional Day", date: "2027-11-24" },
            { name: "Thanksgiving Holiday", date: "2027-11-25" },
            { name: "Thanksgiving Holiday", date: "2027-11-26" }
        ]
    },
    "Spring 2028": {
        start: "2028-01-18",
        end: "2028-05-05",
        holidays: [
            { name: "Martin Luther King Jr. Day", date: "2028-01-17" },
            { name: "Presidents Day", date: "2028-02-21" },
            { name: "Spring Recess", date: "2028-03-27" },
            { name: "Spring Recess", date: "2028-03-28" },
            { name: "Spring Recess", date: "2028-03-29" },
            { name: "Spring Recess", date: "2028-03-30" },
            { name: "Cesar Chavez Holiday", date: "2028-03-31" }
        ]
    },
    "Fall 2028": {
        start: "2028-08-23",
        end: "2028-12-01",
        holidays: [
            { name: "Labor Day", date: "2028-09-04" },
            { name: "Veterans Day", date: "2028-11-10" },
            { name: "Non-Instructional Day", date: "2028-11-22" },
            { name: "Thanksgiving Holiday", date: "2028-11-23" },
            { name: "Thanksgiving Holiday", date: "2028-11-24" }
        ]
    },
    "Spring 2029": {
        start: "2029-01-16",
        end: "2029-05-04",
        holidays: [
            { name: "Martin Luther King Jr. Day", date: "2029-01-15" },
            { name: "Presidents Day", date: "2029-02-19" },
            { name: "Spring Recess", date: "2029-03-26" },
            { name: "Spring Recess", date: "2029-03-27" },
            { name: "Spring Recess", date: "2029-03-28" },
            { name: "Spring Recess", date: "2029-03-29" },
            { name: "Cesar Chavez Holiday", date: "2029-03-30" }
        ]
    }
};

document.addEventListener('DOMContentLoaded', async function() {

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    
    
    const isValidSite = currentTab.url.startsWith('https://berkeley.collegescheduler.com/terms/');
    

    const errorMessage = document.getElementById('errorMessage');
    const semesterSelect = document.getElementById('semesterSelect');
    const convertButton = document.getElementById('convert');
    
    if (!isValidSite) {
        errorMessage.style.display = 'block';
        semesterSelect.style.display = 'none';
        convertButton.style.display = 'none';
    } else {
        errorMessage.style.display = 'none';
        semesterSelect.style.display = 'block';
        convertButton.style.display = 'block';
    }
    
    const currentDate = new Date();
    
    
    const availableSemesters = getAvailableSemesters(currentDate);
    

    availableSemesters.forEach(semester => {
        const option = document.createElement('option');
        option.value = semester;
        option.textContent = semester;
        semesterSelect.appendChild(option);
    });

    convertButton.addEventListener('click', async () => {
        const selectedSemester = semesterSelect.value;
        if (!selectedSemester) {
            alert('Please select a semester');
            return;
        }

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            console.log('Current tab:', tab);
            
       
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'checkPage' });
            console.log('Page check response:', response);
            
            if (!response || !response.isSchedulePage) {
                alert('Please navigate to your class schedule page first');
                return;
            }

            
            chrome.tabs.sendMessage(tab.id, {
                action: 'extractSchedule',
                semester: selectedSemester,
                calendar: academicCalendar[selectedSemester]
            });
        } catch (error) {
            console.error('Connection error:', error);
            alert('Please refresh the page and try again');
        }
    });
});

function getAvailableSemesters(currentDate) {
    const availableSemesters = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    if (month >= 1 && month <= 5) {
        
        availableSemesters.push(`Spring ${year}`);
        availableSemesters.push(`Fall ${year}`);
    } else if (month >= 6 && month <= 7) {
        
        availableSemesters.push(`Fall ${year}`);
        availableSemesters.push(`Spring ${year + 1}`);
    } else if (month >= 8 && month <= 12) {
        
        availableSemesters.push(`Fall ${year}`);
        availableSemesters.push(`Spring ${year + 1}`);
    }

    
    return availableSemesters.filter(semester => academicCalendar.hasOwnProperty(semester));
}