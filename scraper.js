// scraper.js
const fs = require('fs');
const path = require('path');

// Mock data for demonstration
const mockJobs = [
  {
    "id": `acbar-${Date.now()}-1`,
    "title": "Safeguarding Officer",
    "organization": "AADA",
    "location": "Kabul",
    "type": "Full Time",
    "category": "Health Care",
    "postedDate": new Date().toISOString().split('T')[0],
    "deadline": "2025-09-05",
    "source": "acbar.org",
    "sourceUrl": "https://www.acbar.org/jobs/123",
    "description": "Organize and implement continuous training on child protection and gender-based violence for all staff and partners.",
    "requirements": ["Experience in safeguarding", "Knowledge of child protection standards"]
  },
  {
    "id": `jobsaf-${Date.now()}-2`,
    "title": "Senior Accountant",
    "organization": "UNICEF",
    "location": "Kabul",
    "type": "Contract",
    "category": "Finance",
    "postedDate": new Date().toISOString().split('T')[0],
    "deadline": "2025-09-10",
    "source": "jobs.af",
    "sourceUrl": "https://www.jobs.af/job/456",
    "description": "Oversee financial operations and ensure compliance with international accounting standards.",
    "requirements": ["Professional accounting qualification", "Experience with ERP systems"]
  }
];

// Create jobs-data.json file
const jobsData = {
  jobs: mockJobs,
  lastUpdated: new Date().toISOString(),
  totalCount: mockJobs.length,
  sources: {
    acbar: 1,
    jobsaf: 1
  },
  warning: "This is mock data. In a production system, this would be replaced with real scraped data."
};

// Write to file
fs.writeFileSync(path.join(__dirname, 'jobs-data.json'), JSON.stringify(jobsData, null, 2));
console.log('Successfully created jobs-data.json with mock data');
