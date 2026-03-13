const Job = require('../models/jobModel');

exports.getJobs = async (req, res) => {
    try {
        const { search, type, location, minSalary } = req.query;
        const jobs = await Job.getAll({ search, type, location, minSalary });
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching jobs', details: error.message });
    }
};

exports.getJobById = async (req, res) => {
    try {
        const job = await Job.getById(req.params.id);
        if (!job) {
            return res.status(404).json({ error: 'Job offer not found' });
        }
        res.json(job);
    } catch (error) {
        res.status(500).json({ error: 'Server error fetching job details', details: error.message });
    }
};
