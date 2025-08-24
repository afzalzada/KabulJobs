// scraper.js
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Function to scrape jobs from acbar.org
async function scrapeACBARJobs() {
  try {
    console.log('Starting to scrape ACBAR jobs...');
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const response = await axios.get('https://www.acbar.org/jobs/', {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    console.log('Successfully fetched ACBAR page');
    const $ = cheerio.load(response.data);
    const jobs = [];
    
    // Extract job information from acbar.org
    $('.job-title').each((index, element) => {
      try {
        const titleText = $(element).text().trim();
        const title = titleText.replace(/^Position Title:\s*/, '');
        
        // Find parent container and extract other details
        const container = $(element).closest('.block--main, .content-wrapper');
        
        let organization = 'Not specified';
        container.find('.list-group-item').each((i, item) => {
          const label = $(item).find('span').first().text().trim();
          if (label === 'Organization:') {
            organization = $(item).contents().last().text().trim() || 'Not specified';
            return false;
          }
        });
        
        let location = 'Not specified';
        container.find('.list-group-item').each((i, item) => {
          const label = $(item).find('span').first().text().trim();
          if (label === 'Job Location:') {
            location = $(item).contents().last().text().trim() || 'Not specified';
            return false;
          }
        });
        
        let type = 'Not specified';
        container.find('.list-group-item').each((i, item) => {
          const label = $(item).find('span').first().text().trim();
          if (label === 'Employment Type:') {
            type = $(item).contents().last().text().trim() || 'Not specified';
            return false;
          }
        });
        
        let category = 'Not specified';
        container.find('.list-group-item').each((i, item) => {
          const label = $(item).find('span').first().text().trim();
          if (label === 'Category:') {
            category = $(item).contents().last().text().trim() || 'Not specified';
            return false;
          }
        });
        
        let deadline = '';
        container.find('.list-group-item').each((i, item) => {
          const label = $(item).find('span').first().text().trim();
          if (label === 'Close date:') {
            const dateText = $(item).contents().last().text().trim();
            deadline = formatDate(dateText);
            return false;
          }
        });
        
        // If no deadline found, check date_posted
        if (!deadline) {
          const datePosted = container.find('.date_posted').text().trim();
          const expireMatch = datePosted.match(/Expire Date: ([^&]+)/);
          if (expireMatch && expireMatch[1]) {
            deadline = formatDate(expireMatch[1].trim());
          }
        }
        
        // Find link
        let sourceUrl = '';
        const link = $(element).find('a').first().attr('href');
        if (link) {
          sourceUrl = link.startsWith('http') ? link : `https://www.acbar.org${link}`;
        }
        
        if (title && sourceUrl) {
          jobs.push({
            id: `acbar-${Date.now()}-${index}`,
            title,
            organization,
            location,
            type,
            category,
            postedDate: formatDate(new Date().toISOString().split('T')[0]),
            deadline,
            source: 'acbar.org',
            sourceUrl,
            description: `Job opening for ${title} at ${organization} in ${location}.`,
            requirements: []
          });
        }
      } catch (error) {
        console.error(`Error processing job ${index}:`, error.message);
      }
    });
    
    console.log(`Found ${jobs.length} jobs from ACBAR`);
    return jobs;
  } catch (error) {
    console.error('Error scraping ACBAR:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return [];
  }
}

// Function to scrape jobs from jobs.af
async function scrapeJobsAF() {
  try {
    console.log('Starting to scrape jobs.af...');
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const response = await axios.get('https://www.jobs.af', {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    console.log('Successfully fetched jobs.af page');
    const $ = cheerio.load(response.data);
    const jobs = [];
    
    // Extract job information from jobs.af based on Tailwind CSS classes
    $('[class*="job-"], [class*="position"], [class*="listing"]').each((index, element) => {
      try {
        const title = $(element).find('[class*="title"], h2, h3').first().text().trim();
        const organization = $(element).find('[class*="company"], [class*="organization"]').first().text().trim() || 'Various';
        const location = $(element).find('[class*="location"], [class*="city"]').first().text().trim() || 'Afghanistan';
        const type = $(element).find('[class*="type"], [class*="employment"]').first().text().trim() || 'Full-time';
        const category = $(element).find('[class*="category"], [class*="field"]').first().text().trim() || 'General';
        
        const description = $(element).find('p, [class*="description"]').first().text().trim().substring(0, 200) + '...';
        
        // Find link
        let sourceUrl = '';
        const link = $(element).find('a').first().attr('href');
        if (link) {
          sourceUrl = link.startsWith('http') ? link : `https://www.jobs.af${link}`;
        }
        
        if (title && sourceUrl) {
          jobs.push({
            id: `jobsaf-${Date.now()}-${index}`,
            title,
            organization,
            location,
            type,
            category,
            postedDate: formatDate(new Date().toISOString().split('T')[0]),
            deadline: '',
            source: 'jobs.af',
            sourceUrl,
            description,
            requirements: []
          });
        }
      } catch (error) {
        console.error(`Error processing job ${index}:`, error.message);
      }
    });
    
    console.log(`Found ${jobs.length} jobs from jobs.af`);
    return jobs;
  } catch (error) {
    console.error('Error scraping jobs.af:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return [];
  }
}

// Helper function to format dates
function formatDate(dateString) {
  if (!dateString) return new Date().toISOString().split('T')[0];
  
  // Handle various date formats
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString;
  } else if (dateString.match(/\d{1,2} [A-Za-z]+,? \d{4}/)) {
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? new Date().toISOString().split('T')[0] : date.toISOString().split('T')[0];
    } catch (e) {
      return new Date().toISOString().split('T')[0];
    }
  } else {
    return new Date().toISOString().split('T')[0];
  }
}

// Main function to fetch and save jobs
async function fetchAndSaveJobs() {
  console.log('Starting job aggregation...');
  
  try {
    const [acbarJobs, jobsAFJobs] = await Promise.all([
      scrapeACBARJobs(),
      scrapeJobsAF()
    ]);
    
    console.log(`Found ${acbarJobs.length} jobs from ACBAR`);
    console.log(`Found ${jobsAFJobs.length} jobs from jobs.af`);
    
    // Combine jobs and remove duplicates
    const allJobs = [...acbarJobs, ...jobsAFJobs];
    
    // Remove duplicates based on title and organization
    const seen = new Set();
    const uniqueJobs = allJobs.filter(job => {
      const key = `${job.title.toLowerCase()}-${job.organization.toLowerCase()}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
    
    const jobsData = {
      jobs: uniqueJobs,
      lastUpdated: new Date().toISOString(),
      totalCount: uniqueJobs.length,
      sources: {
        acbar: acbarJobs.length,
        jobsaf: jobsAFJobs.length
      }
    };
    
    // Save to JSON file
    fs.writeFileSync(path.join(__dirname, 'jobs-data.json'), JSON.stringify(jobsData, null, 2));
    
    console.log(`Successfully saved ${uniqueJobs.length} unique jobs to jobs-data.json`);
    
  } catch (error) {
    console.error('Error in job aggregation:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Create fallback data even if scraping fails
    const fallbackData = {
      jobs: [],
      lastUpdated: new Date().toISOString(),
      totalCount: 0,
      error: error.message,
      sources: {
        acbar: 0,
        jobsaf: 0
      },
      warning: 'Failed to scrape job data. The websites may be using dynamic loading or have changed their structure.'
    };
    
    fs.writeFileSync(path.join(__dirname, 'jobs-data.json'), JSON.stringify(fallbackData, null, 2));
  }
}

// Run the scraper
fetchAndSaveJobs();
