const viteEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
const API_BASE_URL = viteEnv.VITE_API_URL || 'http://localhost:5000/api';

const state = {
  jobs: [],
  services: [],
  searchText: '',
  activeApplicationJobId: '',
};

const el = {
  apiStatus: document.querySelector('#api-status'),
  recheckApiBtn: document.querySelector('#recheck-api'),
  notice: document.querySelector('#notice'),
  postJobForm: document.querySelector('#post-job-form'),
  searchInput: document.querySelector('#job-search'),
  refreshJobsBtn: document.querySelector('#refresh-jobs'),
  jobsList: document.querySelector('#jobs-list'),
  servicesList: document.querySelector('#services-list'),
  serviceForm: document.querySelector('#service-form'),
};

function showNotice(type, text) {
  if (!el.notice) {
    return;
  }

  el.notice.textContent = text;
  el.notice.hidden = false;
  el.notice.className = `notice ${type === 'error' ? 'is-error' : 'is-success'}`;
  window.setTimeout(() => {
    el.notice.hidden = true;
    el.notice.textContent = '';
    el.notice.className = 'notice';
  }, 3500);
}

function renderServices() {
  if (!el.servicesList) {
    return;
  }

  if (state.services.length === 0) {
    el.servicesList.innerHTML = '<p class="muted">No service providers yet.</p>';
    return;
  }

  el.servicesList.innerHTML = state.services
    .map(
      (provider) => `
      <article class="card">
        <h3>${provider.serviceType || 'Service'}</h3>
        <p><strong>${provider.name || 'Unknown'}</strong></p>
        <p class="muted">${provider.location || '-'}</p>
        <p>${provider.phone || '-'}</p>
        <span class="status-badge ${provider.availableNow ? 'status-ok' : 'status-down'}">
          ${provider.availableNow ? 'Available now' : 'Currently busy'}
        </span>
      </article>
    `,
    )
    .join('');
}

function filteredJobs() {
  if (!state.searchText) {
    return state.jobs;
  }

  const query = state.searchText.toLowerCase();
  return state.jobs.filter((job) => {
    return (
      (job.title || '').toLowerCase().includes(query) ||
      (job.location || '').toLowerCase().includes(query) ||
      (job.category || '').toLowerCase().includes(query)
    );
  });
}

function renderJobs() {
  if (!el.jobsList) {
    return;
  }

  const jobs = filteredJobs();

  if (jobs.length === 0) {
    el.jobsList.innerHTML = '<p class="muted">No jobs found.</p>';
    return;
  }

  el.jobsList.innerHTML = jobs
    .map((job) => {
      const showApplyForm = state.activeApplicationJobId === job._id;
      return `
      <article class="card">
        <div class="card-top">
          <div>
            <h3>${job.title || 'Untitled job'}</h3>
            <p class="muted">${job.location || '-'} • ${job.category || 'General'}</p>
          </div>
          <span class="chip">${job.salary || '-'}</span>
        </div>
        ${job.description ? `<p>${job.description}</p>` : ''}
        <p><strong>Contact:</strong> ${job.contactNumber || '-'}</p>
        <button class="btn-primary toggle-apply" type="button" data-id="${job._id}">
          ${showApplyForm ? 'Cancel' : 'Apply Now'}
        </button>
        ${
          showApplyForm
            ? `
          <form class="apply-form" data-apply-form="${job._id}">
            <input class="field" name="applicantName" placeholder="Your name" required />
            <input class="field" name="applicantPhone" placeholder="Your phone number" required />
            <textarea class="field" name="note" placeholder="Short message (optional)"></textarea>
            <button class="btn-primary" type="submit">Submit Application</button>
          </form>
        `
            : ''
        }
      </article>
    `;
    })
    .join('');

  Array.from(document.querySelectorAll('.toggle-apply')).forEach((button) => {
    button.addEventListener('click', () => {
      const { id } = button.dataset;
      state.activeApplicationJobId = state.activeApplicationJobId === id ? '' : id;
      renderJobs();
    });
  });

  Array.from(document.querySelectorAll('[data-apply-form]')).forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());
      const jobId = form.getAttribute('data-apply-form');

      try {
        await request('/applications', {
          method: 'POST',
          body: JSON.stringify({ jobId, ...payload }),
        });
        state.activeApplicationJobId = '';
        showNotice('success', 'Application submitted successfully.');
        renderJobs();
      } catch (error) {
        showNotice('error', error.message || 'Failed to submit application.');
      }
    });
  });
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new Error(body?.message || 'Request failed.');
  }

  return body;
}

async function checkHealth() {
  if (!el.apiStatus) {
    return;
  }

  try {
    await request('/health');
    el.apiStatus.textContent = 'API Connected';
    el.apiStatus.classList.remove('status-down');
    el.apiStatus.classList.add('status-ok');
  } catch {
    el.apiStatus.textContent = 'API Offline';
    el.apiStatus.classList.remove('status-ok');
    el.apiStatus.classList.add('status-down');
  }
}

async function loadJobs() {
  try {
    state.jobs = await request('/jobs');
    renderJobs();
  } catch (error) {
    showNotice('error', error.message || 'Could not load jobs right now.');
  }
}

async function loadServices() {
  try {
    state.services = await request('/services');
    renderServices();
  } catch (error) {
    showNotice('error', error.message || 'Could not load services right now.');
  }
}

if (el.recheckApiBtn) {
  el.recheckApiBtn.addEventListener('click', checkHealth);
}

if (el.searchInput) {
  el.searchInput.addEventListener('input', () => {
    state.searchText = el.searchInput.value.trim();
    renderJobs();
  });
}

if (el.refreshJobsBtn) {
  el.refreshJobsBtn.addEventListener('click', loadJobs);
}

if (el.postJobForm) {
  el.postJobForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(el.postJobForm);
    const payload = Object.fromEntries(formData.entries());

    try {
      await request('/jobs', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      el.postJobForm.reset();
      showNotice('success', 'Job posted successfully.');
    } catch (error) {
      showNotice('error', error.message || 'Failed to post job.');
    }
  });
}

if (el.serviceForm) {
  el.serviceForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(el.serviceForm);
    const payload = Object.fromEntries(formData.entries());

    try {
      await request('/services', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      el.serviceForm.reset();
      showNotice('success', 'Service provider added successfully.');
      await loadServices();
    } catch (error) {
      showNotice('error', error.message || 'Failed to add service provider.');
    }
  });
}

checkHealth();

if (el.jobsList) {
  loadJobs();
}

if (el.servicesList) {
  loadServices();
}
