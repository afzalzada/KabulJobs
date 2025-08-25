const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function scrapeAcbarJobs() {
  const listUrl = "https://www.acbar.org/jobs/";
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(listUrl, { waitUntil: 'domcontentloaded' });

  // Scrape job rows
  const jobs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('table.joblist tr')).slice(1).map(row => {
      const cells = row.querySelectorAll('td');
      const link = cells[0]?.querySelector('a')?.href || "";
      return link ? {
        link,
        title: cells[0]?.innerText.trim(),
        organization: cells[1]?.innerText.trim(),
        location: cells[2]?.innerText.trim(),
        deadline: cells[3]?.innerText.trim(),
        postedDate: cells[4]?.innerText.trim()
      } : null;
    }).filter(Boolean);
  });

  // For each job, visit the job details page for more info
  let detailedJobs = [];
  for (const job of jobs.slice(0, 10)) { // Limit for performance
    try {
      await page.goto(job.link, { waitUntil: 'domcontentloaded' });
      const details = await page.evaluate(() => {
        const type = document.querySelector('.job-detail [data-label="Type"]')?.innerText.trim() || "";
        const category = document.querySelector('.job-detail [data-label="Category"]')?.innerText.trim() || "";
        const description = document.querySelector('.job-detail .job-description')?.innerText.trim() || "";
        const reqs = Array.from(document.querySelectorAll('.job-detail .requirements li')).map(li => li.innerText.trim());
        return { type, category, description, requirements: reqs };
      });
      detailedJobs.push({
        id: job.link.split('/').pop(),
        title: job.title,
        organization: job.organization,
        location: job.location,
        type: details.type,
        category: details.category,
        postedDate: job.postedDate,
        deadline: job.deadline,
        source: "acbar.org",
        sourceUrl: job.link,
        description: details.description,
        requirements: details.requirements
      });
    } catch (e) {
      // fallback with minimal info
      detailedJobs.push({
        id: job.link.split('/').pop(),
        title: job.title,
        organization: job.organization,
        location: job.location,
        type: "",
        category: "",
        postedDate: job.postedDate,
        deadline: job.deadline,
        source: "acbar.org",
        sourceUrl: job.link,
        description: "",
        requirements: []
      });
    }
  }

  await browser.close();
  return detailedJobs;
}

async function scrapeJobsAf() {
  const listUrl = "https://www.jobs.af/jobs";
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(listUrl, { waitUntil: 'domcontentloaded' });

  // Scrape job rows
  const jobs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.job-card')).map(card => {
      const link = card.querySelector('a.job-title-link')?.href || "";
      return link ? {
        link,
        title: card.querySelector('.job-title-link')?.innerText.trim(),
        organization: card.querySelector('.job-org')?.innerText.trim(),
        location: card.querySelector('.job-location')?.innerText.trim(),
        deadline: card.querySelector('.job-deadline')?.innerText.trim(),
        postedDate: card.querySelector('.posted-date')?.innerText.trim()
      } : null;
    }).filter(Boolean);
  });

  // For each job, visit the job details page for more info
  let detailedJobs = [];
  for (const job of jobs.slice(0, 10)) { // Limit for performance
    try {
      await page.goto(job.link, { waitUntil: 'domcontentloaded' });
      const details = await page.evaluate(() => {
        const type = document.querySelector('.detail-type')?.innerText.trim() || "";
        const category = document.querySelector('.detail-category')?.innerText.trim() || "";
        const description = document.querySelector('.job-description')?.innerText.trim() || "";
        const reqs = Array.from(document.querySelectorAll('.requirements li')).map(li => li.innerText.trim());
        return { type, category, description, requirements: reqs };
      });
      detailedJobs.push({
        id: job.link.split('/').pop(),
        title: job.title,
        organization: job.organization,
        location: job.location,
        type: details.type,
        category: details.category,
        postedDate: job.postedDate,
        deadline: job.deadline,
        source: "jobs.af",
        sourceUrl: job.link,
        description: details.description,
        requirements: details.requirements
      });
    } catch (e) {
      // fallback with minimal info
      detailedJobs.push({
        id: job.link.split('/').pop(),
        title: job.title,
        organization: job.organization,
        location: job.location,
        type: "",
        category: "",
        postedDate: job.postedDate,
        deadline: job.deadline,
        source: "jobs.af",
        sourceUrl: job.link,
        description: "",
        requirements: []
      });
    }
  }

  await browser.close();
  return detailedJobs;
}

async function main() {
  let acbarJobs = [];
  let jobsAfJobs = [];
  try {
    acbarJobs = await scrapeAcbarJobs();
  } catch (error) {
    console.error('Error scraping acbar.org:', error.message);
  }
  try {
    jobsAfJobs = await scrapeJobsAf();
  } catch (error) {
    console.error('Error scraping jobs.af:', error.message);
  }

  const jobs = [...acbarJobs, ...jobsAfJobs];
  const jobsData = {
    jobs,
    lastUpdated: new Date().toISOString(),
    totalCount: jobs.length,
    sources: {
      acbar: acbarJobs.length,
      jobsaf: jobsAfJobs.length
    },
    warning: "This file is automatically updated. Real jobs scraped from acbar.org and jobs.af."
  };

  fs.writeFileSync(path.join(__dirname, 'jobs-data.json'), JSON.stringify(jobsData, null, 2));
  console.log('jobs-data.json updated');
}

main();
