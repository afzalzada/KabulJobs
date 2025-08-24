// scraper.js
const fs = require('fs');
const path = require('path');

// Simple function to create mock job data
function createMockJobs() {
  const jobs = [
    {
      id: `job-${Date.now()}-1`,
      title: "Safeguarding Officer",
      organization: "AADA",
      location: "Kabul",
      type: "Full Time",
      category: "Health Care",
      postedDate: new Date().toISOString().split('T')[0],
      deadline: "2025-09-05",
      source: "acbar.org",
      sourceUrl: "https://www.acbar.org/jobs/",
      description: "Position available for Safeguarding Officer. Visit the website for details.",
      requirements: []
    },
    {
      id: `job-${Date.now()}-2`,
      title: "Senior Accountant",
      organization: "UNICEF",
      location: "Kabul",
      type: "Contract",
      category: "Finance",
      postedDate: new Date().toISOString().split('T')[0],
      deadline: "2025-09-10",
      source: "jobs.af",
      sourceUrl: "https://www.jobs.af/",
      description: "Senior Accountant position available. Visit the website for details.",
      requirements: []
    }
  ];

  return {
    jobs: jobs,
    lastUpdated: new Date().toISOString(),
    totalCount: jobs.length,
    sources: {
      acbar: 1,
      jobsaf: 1
    },
    warning: "This is a simplified version. In production, this would fetch real data from the websites."
  };
}

// Create and save the data
try {
  const jobsData = createMockJobs();
  fs.writeFileSync(path.join(__dirname, 'jobs-data.json'), JSON.stringify(jobsData, null, 2));
  console.log('Successfully created jobs-data.json');
} catch (error) {
  console.error('Error creating jobs-data.json:', error.message);
  
  // Create a minimal fallback file
  const fallbackData = {
    jobs: [],
    lastUpdated: new Date().toISOString(),
    totalCount: 0,
    error: error.message
  };
  
  fs.writeFileSync(path.join(__dirname, 'jobs-data.json'), JSON.stringify(fallbackData, null, 2));
  console.log('Created fallback jobs-data.json');
}
