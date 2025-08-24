// scraper.js - This will run as a GitHub Action
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Function to scrape ACBAR jobs
async function scrapeACBARJobs() {
  try {
    const response = await axios.get('https://www.acbar.org/jobs/');
    const $ = cheerio.load(response.data);
    const jobs = [];
    
    // You'll need to inspect the actual HTML structure and update these selectors
    $('.job-listing, .vacancy-item').each((index, element) => {
      const title = $(element).find('.job-title, h3').first().text().trim();
      const organization = $(element).find('.organization, .company').first().text().trim() || 'ACBAR';
      const location = $(element).find('.location, .job-location').first().text().trim() || 'Afghanistan';
      const type = $(element).find('.job-type, .employment-type').first().text().trim() || 'Full-time';
      const category = $(element).find('.category, .job-category').first().text().trim() || 'Humanitarian';
      const postedDate = $(element).find('.posted-date, .date-posted').first().text().trim();
      const deadline = $(element).find('.deadline, .application-deadline').first().text().trim();
      const description = $(element).find('.description, .job-description').first().text().trim().substring(0, 200) + '...';
      const link = $(element).find('a').first().attr('href');
      
      if (title && link) {
        jobs.push({
          id: `acbar-${Date.now()}-${index}`,
          title,
          organization,
          location,
          type,
          category,
          postedDate: formatDate(postedDate),
          deadline: formatDate(deadline),
          source: 'acbar.org',
          sourceUrl: link.startsWith('http') ? link : `https://www.acbar.org${link}`,
          description,
          requirements: []
        });
      }
    });
    
    return jobs;
  } catch (error) {
    console.error('Error scraping ACBAR:', error.message);
    return [];
  }
}

// Function to scrape jobs.af
async function scrapeJobsAF() {
  try {
    const response = await axios.get('https://www.jobs.af');
    const $ = cheerio.load(response.data);
    const jobs = [];
    
    // You'll need to inspect the actual HTML structure and update these selectors
    $('.job-item, .listing-item').each((index, element) => {
      const title = $(element).find('.job-title, h2').first().text().trim();
      const organization = $(element).find('.company, .organization').first().text().trim() || 'Various';
      const location = $(element).find('.job-location, .location').first().text().trim() || 'Afghanistan';
      const type = $(element).find('.job-type, .employment-type').first().text().trim() || 'Full-time';
      const category = $(element).find('.job-category, .category').first().text().trim() || 'General';
      const postedDate = $(element).find('.posted-date, .date-posted').first().text().trim();
      const deadline = $(element).find('.application-deadline, .deadline').first().text().trim();
      const description = $(element).find('.job-description, .description').first().text().trim().substring(0, 200) + '...';
      const link = $(element).find('a').first().attr('href');
      
      if (title && link) {
        jobs.push({
          id: `jobsaf-${Date.now()}-${index}`,
          title,
          organization,
          location,
          type,
          category,
          postedDate: formatDate(postedDate),
          deadline: formatDate(deadline),
          source: 'jobs.af',
          sourceUrl: link.startsWith('http') ? link : `https://www.jobs.af${link}`,
          description,
          requirements: []
        });
      }
    });
    
    return jobs;
  } catch (error) {
    console.error('Error scraping jobs.af:', error.message);
    return [];
  }
}

// Helper function to format dates
function formatDate(dateString) {
  if (!dateString) return new Date().toISOString().split('T')[0];
  
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? new Date().toISOString().split('T')[0] : date.toISOString().split('T')[0];
}

// Main function to fetch and save jobs
async function fetchAndSaveJobs() {
  console.log('Starting job aggregation...');
  
  try {
    const [acbarJobs, jobsAFJobs] = await Promise.all([
      scrapeACBARJobs(),
      scrapeJobsAF()
    ]);
    
    // Combine jobs and remove duplicates
    const allJobs = [...acbarJobs, ...jobsAFJobs];
    
    // Remove duplicates based on title and organization
    const uniqueJobs = Array.from(new Map(
      allJobs.map(job => [job.title + job.organization, job])
    ).values());
    
    const jobsData = {
      jobs: uniqueJobs,
      lastUpdated: new Date().toISOString(),
      totalCount: uniqueJobs.length
    };
    
    // Save to JSON file
    fs.writeFileSync(path.join(__dirname, 'jobs-data.json'), JSON.stringify(jobsData, null, 2));
    
    console.log(`Successfully saved ${uniqueJobs.length} jobs to jobs-data.json`);
    
  } catch (error) {
    console.error('Error in job aggregation:', error);
    // Create minimal data file even if scraping fails
    const fallbackData = {
      jobs: [],
      lastUpdated: new Date().toISOString(),
      totalCount: 0,
      error: error.message
    };
    fs.writeFileSync(path.join(__dirname, 'jobs-data.json'), JSON.stringify(fallbackData, null, 2));
  }
}

// Run the scraper
fetchAndSaveJobs();
