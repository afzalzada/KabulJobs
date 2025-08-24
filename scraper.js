// scraper.js
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Function to scrape jobs from acbar.org using Puppeteer
async function scrapeACBARJobs() {
  let browser;
  try {
    console.log('Starting to scrape ACBAR jobs...');
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // Navigate to the jobs page
    await page.goto('https://www.acbar.org/jobs/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for job listings to load
    await page.waitForSelector('.job-title', { timeout: 10000 });
    
    // Extract job data using evaluate (runs in browser context)
    const jobs = await page.evaluate(() => {
      const jobs = [];
      
      // Extract all job listings
      document.querySelectorAll('.job-title').forEach((element, index) => {
        const titleText = element.textContent.trim();
        const title = titleText.replace(/^Position Title:\s*/, '');
        
        // Find parent container and extract other details
        const container = element.closest('.block--main, .content-wrapper');
        
        let organization = 'Not specified';
        if (container) {
          const orgElement = container.querySelector('.list-group-item');
          if (orgElement && orgElement.textContent.includes('Organization:')) {
            organization = orgElement.textContent.replace('Organization:', '').trim();
          }
        }
        
        let location = 'Not specified';
        if (container) {
          const locElement = container.querySelector('.list-group-item');
          if (locElement && locElement.textContent.includes('Job Location:')) {
            location = locElement.textContent.replace('Job Location:', '').trim();
          }
        }
        
        // Find link
        const link = element.querySelector('a');
        const href = link ? link.href : '';
        
        if (title && href) {
          jobs.push({
            id: `acbar-${Date.now()}-${index}`,
            title,
            organization,
            location,
            type: 'Not specified',
            category: 'Not specified',
            postedDate: new Date().toISOString().split('T')[0],
            deadline: '',
            source: 'acbar.org',
            sourceUrl: href,
            description: `Job opportunity: ${title}`,
            requirements: []
          });
        }
      });
      
      return jobs;
    });
    
    console.log(`Found ${jobs.length} jobs from ACBAR`);
    return jobs;
  } catch (error) {
    console.error('Error scraping ACBAR:', error.message);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Function to scrape jobs from jobs.af using Puppeteer
async function scrapeJobsAF() {
  let browser;
  try {
    console.log('Starting to scrape jobs.af...');
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process'
      ]
    });
    
    const page = await browser.newPage();
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // Navigate to the jobs page
    await page.goto('https://www.jobs.af', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for job listings to load
    await page.waitForSelector('[class*="job-"], [class*="position"], [class*="listing"]', { timeout: 10000 });
    
    // Extract job data using evaluate
    const jobs = await page.evaluate(() => {
      const jobs = [];
      
      // Extract job listings based on common patterns
      document.querySelectorAll('[class*="job-"], [class*="position"], [class*="listing"]').forEach((element, index) => {
        const title = element.querySelector('[class*="title"], h2, h3')?.textContent.trim() || 'Not specified';
        const organization = element.querySelector('[class*="company"], [class*="organization"]')?.textContent.trim() || 'Various';
        const location = element.querySelector('[class*="location"], [class*="city"]')?.textContent.trim() || 'Afghanistan';
        const type = element.querySelector('[class*="type"], [class*="employment"]')?.textContent.trim() || 'Full-time';
        const category = element.querySelector('[class*="category"], [class*="field"]')?.textContent.trim() || 'General';
        
        const description = element.querySelector('p, [class*="description"]')?.textContent.trim().substring(0, 200) + '...' || '';
        
        // Find link
        const link = element.querySelector('a');
        const href = link ? link.href : '';
        
        if (title && href) {
          jobs.push({
            id: `jobsaf-${Date.now()}-${index}`,
            title,
            organization,
            location,
            type,
            category,
            postedDate: new Date().toISOString().split('T')[0],
            deadline: '',
            source: 'jobs.af',
            sourceUrl: href,
            description,
            requirements: []
          });
        }
      });
      
      return jobs;
    });
    
    console.log(`Found ${jobs.length} jobs from jobs.af`);
    return jobs;
  } catch (error) {
    console.error('Error scraping jobs.af:', error.message);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Helper function to format dates
function formatDate(dateString) {
  if (!dateString) return new Date().toISOString().split('T')[0];
  
  // Handle various date formats
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString;
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
