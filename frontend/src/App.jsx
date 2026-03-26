import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const api = axios.create({ baseURL: API_BASE_URL });

const initialForm = {
  title: '',
  salary: '',
  location: '',
  contactNumber: '',
  category: '',
  description: '',
};

const initialApplicationForm = {
  applicantName: '',
  applicantPhone: '',
  note: '',
};

const initialServiceForm = {
  name: '',
  serviceType: '',
  location: '',
  phone: '',
};

const tabs = [
  { key: 'post', label: 'Post a Job' },
  { key: 'find', label: 'Find a Job' },
  { key: 'service', label: 'Services' },
];

function App() {
  const [activeTab, setActiveTab] = useState('post');
  const [form, setForm] = useState(initialForm);
  const [jobs, setJobs] = useState([]);
  const [services, setServices] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [submittingApplicationFor, setSubmittingApplicationFor] = useState('');
  const [postingJob, setPostingJob] = useState(false);
  const [addingProvider, setAddingProvider] = useState(false);
  const [applicationForm, setApplicationForm] = useState(initialApplicationForm);
  const [activeApplicationJobId, setActiveApplicationJobId] = useState('');
  const [serviceForm, setServiceForm] = useState(initialServiceForm);
  const [notice, setNotice] = useState({ type: '', text: '' });
  const [apiHealthy, setApiHealthy] = useState(false);

  const setSuccess = (text) => setNotice({ type: 'success', text });
  const setError = (text) => setNotice({ type: 'error', text });

  useEffect(() => {
    if (!notice.text) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setNotice({ type: '', text: '' });
    }, 3500);

    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && tabs.find((tab) => tab.key === hash)) {
      setActiveTab(hash);
    }
  }, []);

  const activateTab = (tabKey) => {
    setActiveTab(tabKey);
    window.history.replaceState(null, '', `#${tabKey}`);
  };

  const checkHealth = useCallback(async () => {
    try {
      await api.get('/health');
      setApiHealthy(true);
    } catch {
      setApiHealthy(false);
      setError('Backend is not reachable. Start backend server and check API URL.');
    }
  }, []);

  const fetchJobs = useCallback(async (query = '') => {
    setLoadingJobs(true);
    try {
      const { data } = await api.get('/jobs', {
        params: query ? { q: query } : {},
      });
      setJobs(data);
    } catch (error) {
      setError(error.response?.data?.message || 'Could not load jobs right now.');
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  const fetchServices = useCallback(async () => {
    setLoadingServices(true);
    try {
      const { data } = await api.get('/services');
      setServices(data);
    } catch (error) {
      setError(error.response?.data?.message || 'Could not load services right now.');
    } finally {
      setLoadingServices(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    fetchJobs();
    fetchServices();
  }, [checkHealth, fetchJobs, fetchServices]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePostJob = async (event) => {
    event.preventDefault();
    setPostingJob(true);

    try {
      await api.post('/jobs', form);
      setSuccess('Job posted successfully.');
      setForm(initialForm);
      fetchJobs();
      activateTab('find');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to post job.');
    } finally {
      setPostingJob(false);
    }
  };

  const handleOpenApplication = (jobId) => {
    setActiveApplicationJobId((prev) => (prev === jobId ? '' : jobId));
    setApplicationForm(initialApplicationForm);
    setNotice({ type: '', text: '' });
  };

  const handleApplicationInput = (event) => {
    const { name, value } = event.target;
    setApplicationForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyForJob = async (event, jobId) => {
    event.preventDefault();
    setSubmittingApplicationFor(jobId);

    try {
      await api.post('/applications', {
        jobId,
        ...applicationForm,
      });
      setSuccess('Application submitted successfully.');
      setApplicationForm(initialApplicationForm);
      setActiveApplicationJobId('');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit application.');
    } finally {
      setSubmittingApplicationFor('');
    }
  };

  const handleServiceInput = (event) => {
    const { name, value } = event.target;
    setServiceForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddServiceProvider = async (event) => {
    event.preventDefault();
    setAddingProvider(true);

    try {
      await api.post('/services', serviceForm);
      setSuccess('Service provider added successfully.');
      setServiceForm(initialServiceForm);
      fetchServices();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add service provider.');
    } finally {
      setAddingProvider(false);
    }
  };

  const filteredJobs = useMemo(() => {
    if (!searchText) {
      return jobs;
    }

    const query = searchText.toLowerCase();
    return jobs.filter((job) => {
      return (
        (job.title || '').toLowerCase().includes(query) ||
        (job.location || '').toLowerCase().includes(query) ||
        (job.category || '').toLowerCase().includes(query)
      );
    });
  }, [jobs, searchText]);

  const stats = useMemo(() => {
    const availableServices = services.filter((s) => s.availableNow).length;
    return [
      { label: 'Open Jobs', value: jobs.length },
      { label: 'Service Providers', value: services.length },
      { label: 'Available Now', value: availableServices },
    ];
  }, [jobs.length, services]);

  return (
    <main className="min-h-screen bg-work-gradient px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto w-full max-w-6xl rounded-3xl border border-white/40 bg-white/75 p-6 shadow-2xl backdrop-blur lg:p-10">
        <header className="mb-8 flex flex-col gap-4 border-b border-slate-200/80 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-display text-sm uppercase tracking-[0.3em] text-orange-600">Kaam-Do Platform</p>
            <h1 className="font-display text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
              WorkLink
            </h1>
            <p className="mt-2 max-w-2xl text-slate-700">
              Post jobs, find work, and reach urgent local services in one place.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className={`status-badge ${apiHealthy ? 'status-ok' : 'status-down'}`}>
                {apiHealthy ? 'API Connected' : 'API Offline'}
              </span>
              <button className="refresh-btn" type="button" onClick={checkHealth}>
                Recheck API
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`tab-btn ${activeTab === tab.key ? 'tab-btn-active' : ''}`}
                onClick={() => activateTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        <section className="mb-6 grid gap-3 sm:grid-cols-3">
          {stats.map((stat) => (
            <article key={stat.label} className="stat-card">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{stat.label}</p>
              <p className="mt-2 font-display text-3xl font-bold text-slate-900">{stat.value}</p>
            </article>
          ))}
        </section>

        {notice.text ? (
          <p
            className={`mb-6 rounded-lg px-4 py-3 text-sm ${
              notice.type === 'error'
                ? 'border border-rose-300 bg-rose-50 text-rose-800'
                : 'border border-emerald-300 bg-emerald-50 text-emerald-800'
            }`}
          >
            {notice.text}
          </p>
        ) : null}

        {activeTab === 'post' ? (
          <section className="rounded-2xl bg-white p-5 shadow-lg ring-1 ring-slate-100 sm:p-8">
            <h2 className="font-display text-2xl font-semibold">Post a Local Job</h2>
            <p className="mt-1 text-slate-600">Share openings quickly for nearby workers.</p>
            <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={handlePostJob}>
              <input
                className="field"
                name="title"
                value={form.title}
                onChange={handleInputChange}
                placeholder="Job title"
                required
              />
              <input
                className="field"
                name="salary"
                value={form.salary}
                onChange={handleInputChange}
                placeholder="Salary"
                required
              />
              <input
                className="field"
                name="location"
                value={form.location}
                onChange={handleInputChange}
                placeholder="Location"
                required
              />
              <input
                className="field"
                name="contactNumber"
                value={form.contactNumber}
                onChange={handleInputChange}
                placeholder="Contact number"
                required
              />
              <input
                className="field sm:col-span-2"
                name="category"
                value={form.category}
                onChange={handleInputChange}
                placeholder="Category (Electrician, Driver, Cook...)"
              />
              <textarea
                className="field min-h-28 resize-y sm:col-span-2"
                name="description"
                value={form.description}
                onChange={handleInputChange}
                placeholder="Job description"
              />
              <button className="btn-primary sm:col-span-2" type="submit">
                {postingJob ? 'Publishing...' : 'Publish Job'}
              </button>
            </form>
          </section>
        ) : null}

        {activeTab === 'find' ? (
          <section className="rounded-2xl bg-white p-5 shadow-lg ring-1 ring-slate-100 sm:p-8">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-display text-2xl font-semibold">Find a Job</h2>
              <div className="flex w-full gap-2 sm:w-auto">
                <input
                  className="field w-full sm:w-72"
                  placeholder="Search by title, location or category"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                />
                <button className="refresh-btn" type="button" onClick={() => fetchJobs(searchText)}>
                  Refresh
                </button>
              </div>
            </div>

            {loadingJobs ? <p>Loading jobs...</p> : null}

            <div className="grid gap-4">
              {!loadingJobs && filteredJobs.length === 0 ? <p>No jobs found.</p> : null}
              {filteredJobs.map((job) => (
                <article
                  key={job._id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold text-slate-900">{job.title}</h3>
                    <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-800">
                      {job.salary}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-700">{job.location}</p>
                  <p className="mt-1 text-sm text-slate-600">{job.category || 'General'}</p>
                  {job.description ? <p className="mt-3 text-slate-700">{job.description}</p> : null}
                  <p className="mt-3 text-sm font-medium text-slate-800">Contact: {job.contactNumber}</p>

                  <button
                    type="button"
                    className="mt-4 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                    onClick={() => handleOpenApplication(job._id)}
                  >
                    {activeApplicationJobId === job._id ? 'Cancel' : 'Apply Now'}
                  </button>

                  {activeApplicationJobId === job._id ? (
                    <form className="mt-4 grid gap-3" onSubmit={(event) => handleApplyForJob(event, job._id)}>
                      <input
                        className="field"
                        name="applicantName"
                        value={applicationForm.applicantName}
                        onChange={handleApplicationInput}
                        placeholder="Your name"
                        required
                      />
                      <input
                        className="field"
                        name="applicantPhone"
                        value={applicationForm.applicantPhone}
                        onChange={handleApplicationInput}
                        placeholder="Your phone number"
                        required
                      />
                      <textarea
                        className="field min-h-24"
                        name="note"
                        value={applicationForm.note}
                        onChange={handleApplicationInput}
                        placeholder="Short message (optional)"
                      />
                      <button className="btn-primary" type="submit" disabled={submittingApplicationFor === job._id}>
                        {submittingApplicationFor === job._id ? 'Submitting...' : 'Submit Application'}
                      </button>
                    </form>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === 'service' ? (
          <section className="rounded-2xl bg-white p-5 shadow-lg ring-1 ring-slate-100 sm:p-8">
            <h2 className="font-display text-2xl font-semibold">On-Demand Services</h2>
            <p className="mt-1 text-slate-700">Call available workers directly for urgent tasks.</p>

            {loadingServices ? <p className="mt-4">Loading services...</p> : null}

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((provider) => (
                <article key={provider._id || provider.phone} className="service-card">
                  <h3 className="font-display text-xl text-slate-900">{provider.serviceType}</h3>
                  <p className="mt-1 font-semibold text-slate-800">{provider.name}</p>
                  <p className="mt-1 text-slate-700">{provider.location}</p>
                  <p className="mt-3 text-sm text-slate-800">{provider.phone}</p>
                  <span
                    className={`mt-3 inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                      provider.availableNow
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {provider.availableNow ? 'Available now' : 'Currently busy'}
                  </span>
                </article>
              ))}
            </div>

            <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-display text-xl font-semibold text-slate-900">Join as a Service Provider</h3>
              <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={handleAddServiceProvider}>
                <input
                  className="field"
                  name="name"
                  value={serviceForm.name}
                  onChange={handleServiceInput}
                  placeholder="Full name or shop name"
                  required
                />
                <input
                  className="field"
                  name="serviceType"
                  value={serviceForm.serviceType}
                  onChange={handleServiceInput}
                  placeholder="Service type"
                  required
                />
                <input
                  className="field"
                  name="location"
                  value={serviceForm.location}
                  onChange={handleServiceInput}
                  placeholder="Location"
                  required
                />
                <input
                  className="field"
                  name="phone"
                  value={serviceForm.phone}
                  onChange={handleServiceInput}
                  placeholder="Phone number"
                  required
                />
                <button className="btn-primary sm:col-span-2" type="submit">
                  {addingProvider ? 'Adding...' : 'Add Service Profile'}
                </button>
              </form>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

export default App;
