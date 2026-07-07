// LocalStorage Key
const STORAGE_KEY = 'citizen_complaints';

// Mock Data to seed the dashboard on first visit
const MOCK_COMPLAINTS = [
  {
    id: 'COM-847291',
    name: 'Aarav Sharma',
    city: 'Mumbai',
    mobile: '9876543210',
    address: 'Flat 402, Sea Breeze Apartments, Bandra West',
    complaint: 'Streetlights along the Bandra Promenade have been flickering and shutting off completely after 9 PM. It makes the walkway unsafe for citizens at night.',
    aiQuestion: 'Are the streetlights out along the entire promenade, or is it isolated to a specific section?',
    aiAnswer: 'It is mostly near the main entrance plaza and extending about 200 meters north.',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    status: 'pending'
  },
  {
    id: 'COM-103948',
    name: 'Priya Patel',
    city: 'Bengaluru',
    mobile: '8765432109',
    address: '12, 4th Cross, Koramangala 3rd Block',
    complaint: 'Significant waterlogging occurred outside our building after yesterday\'s heavy rain. The drainage system seems completely clogged with plastic waste.',
    aiQuestion: 'Has the waterlogging subsided now, or is there still standing water blocking the street?',
    aiAnswer: 'It has receded slightly, but there is still about 6 inches of muddy water and plastic debris blocking the sidewalk.',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    status: 'resolved'
  },
  {
    id: 'COM-395847',
    name: 'Rahul Verma',
    city: 'New Delhi',
    mobile: '7654321098',
    address: 'H-32, First Floor, Sector 15, Rohini',
    complaint: 'Garbage dump near the local primary school is overflowing. It has not been cleared for over a week, resulting in an unhygienic environment and stray animal gathering.',
    aiQuestion: 'Have there been any sicknesses reported or is the smell entering the school classrooms?',
    aiAnswer: 'The smell is very strong in the front classrooms, and students are complaining of headaches.',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    status: 'pending'
  }
];

// Initialize database
function initDatabase() {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_COMPLAINTS));
    return MOCK_COMPLAINTS;
  }
  try {
    return JSON.parse(existing);
  } catch (e) {
    console.error('Error parsing complaints database', e);
    return [];
  }
}

let complaints = initDatabase();

// Save complaints back to localStorage
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
}

// Generate a random tracking ID (COM-XXXXXX)
function generateTrackingId() {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `COM-${randomNum}`;
}

// Format timestamp beautifully
function formatDateTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Display Toast Notifications
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'danger' ? 'toast-danger' : ''}`;

  // Custom icons based on toast type
  const icon = type === 'danger' ? '⚠️' : '✓';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

  container.appendChild(toast);

  // Fade out and remove after 3.5s
  setTimeout(() => {
    toast.classList.add('fadeOut');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 3500);
}

// UI HANDLER - HOME VIEW (index.html)
function setupHomeView() {
  const complaintsGrid = document.getElementById('complaints-list');
  const searchInput = document.getElementById('search-complaint');
  const cityFilter = document.getElementById('city-filter');

  if (!complaintsGrid) return; // Exit if not on home page

  // Populate City Filter Options dynamically
  function updateCityFilterOptions() {
    const cities = [...new Set(complaints.map(c => c.city))].sort();

    // Clear and restore default option
    cityFilter.innerHTML = '<option value="">All Cities</option>';
    cities.forEach(city => {
      const option = document.createElement('option');
      option.value = city;
      option.textContent = city;
      cityFilter.appendChild(option);
    });
  }

  // Calculate and Render Dashboard Stats
  function updateStats() {
    const totalCount = complaints.length;
    const pendingCount = complaints.filter(c => c.status === 'pending').length;
    const resolvedCount = complaints.filter(c => c.status === 'resolved').length;

    document.getElementById('stat-total').textContent = totalCount;
    document.getElementById('stat-pending').textContent = pendingCount;
    document.getElementById('stat-resolved').textContent = resolvedCount;
  }

  // Render Complaints Grid
  function renderComplaints(filteredComplaints) {
    complaintsGrid.innerHTML = '';

    if (filteredComplaints.length === 0) {
      complaintsGrid.innerHTML = `
        <div class="empty-state glass-card">
          <div class="empty-icon">📁</div>
          <h3>No Complaints Found</h3>
          <p>No complaints match your search filters. Try clearing inputs or file a new grievance.</p>
        </div>
      `;
      return;
    }

    filteredComplaints.forEach(complaint => {
      const card = document.createElement('div');
      card.className = 'glass-card complaint-card';

      const formattedDate = formatDateTime(complaint.timestamp);
      const isPending = complaint.status === 'pending';

      // Build AI follow-up HTML if present
      let aiFollowupHtml = '';
      if (complaint.aiQuestion && complaint.aiAnswer) {
        aiFollowupHtml = `
          <div class="ai-followup-box">
            <div class="ai-card-question">
              <span>🤖</span> <span>${escapeHTML(complaint.aiQuestion)}</span>
            </div>
            <div class="ai-card-answer">
              <span>💬</span> <span>${escapeHTML(complaint.aiAnswer)}</span>
            </div>
          </div>
        `;
      }

      card.innerHTML = `
        <div>
          <div class="card-header">
            <span class="tracking-id">${complaint.id}</span>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span class="card-date">${formattedDate}</span>
              <button class="btn-icon-delete delete-btn" title="Delete complaint" aria-label="Delete complaint ${complaint.id}" data-id="${complaint.id}">🗑</button>
            </div>
          </div>
          <div class="card-body">
            <p class="complaint-desc">${escapeHTML(complaint.complaint)}</p>
            <div class="complaint-meta">
              <div class="meta-item">
                <span class="label">Filed By:</span>
                <span class="val">${escapeHTML(complaint.name)}</span>
              </div>
              <div class="meta-item">
                <span class="label">City:</span>
                <span class="val">${escapeHTML(complaint.city)}</span>
              </div>
              <div class="meta-item">
                <span class="label">Mobile:</span>
                <span class="val">${escapeHTML(complaint.mobile)}</span>
              </div>
              <div class="meta-item">
                <span class="label">Address:</span>
                <span class="val">${escapeHTML(complaint.address)}</span>
              </div>
            </div>
            ${aiFollowupHtml}
          </div>
        </div>
        <div class="card-footer">
          <span class="status-badge ${complaint.status}" data-id="${complaint.id}">
            ${complaint.status.charAt(0).toUpperCase() + complaint.status.slice(1)}
          </span>
          <button class="btn btn-secondary toggle-status-btn" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" data-id="${complaint.id}">
            ${isPending ? 'Mark Resolved' : 'Mark Pending'}
          </button>
        </div>
      `;


      complaintsGrid.appendChild(card);
    });

    // Attach Event Listeners to toggle and delete buttons
    document.querySelectorAll('.toggle-status-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        toggleComplaintStatus(id);
      });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        deleteComplaint(id);
      });
    });
  }

  // Filter complaints based on Search Input & City Select
  function filterAndRender() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedCity = cityFilter.value;

    const filtered = complaints.filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm) ||
        c.id.toLowerCase().includes(searchTerm) ||
        c.complaint.toLowerCase().includes(searchTerm) ||
        c.city.toLowerCase().includes(searchTerm);

      const matchesCity = selectedCity === '' || c.city === selectedCity;

      return matchesSearch && matchesCity;
    });

    renderComplaints(filtered);
  }

  // Toggle Pending / Resolved
  function toggleComplaintStatus(id) {
    const index = complaints.findIndex(c => c.id === id);
    if (index !== -1) {
      const newStatus = complaints[index].status === 'pending' ? 'resolved' : 'pending';
      complaints[index].status = newStatus;
      saveToStorage();
      updateStats();
      filterAndRender();
      showToast(`Complaint ${id} status updated to ${newStatus}!`);
    }
  }

  // Delete Complaint
  function deleteComplaint(id) {
    if (confirm(`Are you sure you want to delete complaint ${id}?`)) {
      complaints = complaints.filter(c => c.id !== id);
      saveToStorage();
      updateStats();
      updateCityFilterOptions();
      filterAndRender();
      showToast(`Complaint ${id} deleted successfully.`, 'danger');
    }
  }

  // Event Listeners for controls
  searchInput.addEventListener('input', filterAndRender);
  cityFilter.addEventListener('change', filterAndRender);

  // Initial load
  updateCityFilterOptions();
  updateStats();
  renderComplaints(complaints);
}

// Call Gemini API to generate a follow-up clarification question
async function fetchAIQuestion(complaintText, apiKey) {
  if (apiKey === 'mock-key') {
    // Simulate network delay for loading spinner
    await new Promise(resolve => setTimeout(resolve, 1000));
    return "Could you please specify the exact street address/landmarks and how long this issue has been occurring?";
  }

  // Use the current stable model - gemini-2.0-flash
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const prompt = `Complaint Details: ${complaintText}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      // system_instruction is a top-level field per the Gemini API spec
      system_instruction: {
        parts: [{
          text: "You are a helpful civic assistant. Based on the complaint details provided, generate exactly one direct, specific, and concise follow-up question for the citizen that would clarify the issue or gather critical missing information (e.g. precise location details, severity, duration). Do not include any greeting, intro, formatting, or polite filler. Output ONLY the question itself."
        }]
      },
      contents: [{
        role: 'user',
        parts: [{
          text: prompt
        }]
      }]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error?.message || `HTTP error ${response.status}`;
    throw new Error(message);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Invalid API response format");
  }

  return text.trim();
}

// UI HANDLER - NEW COMPLAINT FORM VIEW (new-complaint.html)
function setupFormView() {
  const form = document.getElementById('complaint-form');
  if (!form) return; // Exit if not on form page

  // API Config elements
  const apiToggleBtn = document.getElementById('api-toggle-btn');
  const apiContent = document.getElementById('api-content');
  const keyInput = document.getElementById('gemini-key-input');
  const saveKeyBtn = document.getElementById('save-key-btn');
  const keyStatus = document.getElementById('api-key-status');

  if (apiToggleBtn && apiContent && keyInput && saveKeyBtn && keyStatus) {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      keyInput.value = savedKey;
      keyStatus.innerHTML = '✓ API Key Saved';
      keyStatus.className = 'api-status stored';
    }

    apiToggleBtn.addEventListener('click', () => {
      const isExpanded = apiToggleBtn.getAttribute('aria-expanded') === 'true';
      apiToggleBtn.setAttribute('aria-expanded', !isExpanded);
      apiContent.classList.toggle('collapsed');
    });

    saveKeyBtn.addEventListener('click', () => {
      const key = keyInput.value.trim();
      if (!key) {
        showToast('Please enter a valid key.', 'danger');
        return;
      }
      localStorage.setItem('gemini_api_key', key);
      keyStatus.innerHTML = '✓ API Key Saved';
      keyStatus.className = 'api-status stored';
      showToast('Gemini API Key saved successfully.');
      apiToggleBtn.setAttribute('aria-expanded', 'false');
      apiContent.classList.add('collapsed');
    });
  }

  // Form Fields & Navigation Buttons
  const nameInput = document.getElementById('name');
  const cityInput = document.getElementById('city');
  const mobileInput = document.getElementById('mobile');
  const addressInput = document.getElementById('address');
  const complaintInput = document.getElementById('complaint');

  const generateBtn = document.getElementById('generate-question-btn');
  const submitBtn = document.getElementById('submit-complaint-btn');
  const editBtn = document.getElementById('edit-details-btn');
  const clearBtn = document.getElementById('clear-form-btn');
  const loaderContainer = document.getElementById('ai-loader-container');
  const questionSection = document.getElementById('ai-question-section');
  const questionText = document.getElementById('ai-question-text');
  const aiAnswerInput = document.getElementById('ai-answer');

  let generatedQuestion = '';

  function setInputsDisabled(disabled) {
    nameInput.disabled = disabled;
    cityInput.disabled = disabled;
    mobileInput.disabled = disabled;
    addressInput.disabled = disabled;
    complaintInput.disabled = disabled;
  }

  generateBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    const city = cityInput.value.trim();
    const mobile = mobileInput.value.trim();
    const address = addressInput.value.trim();
    const complaintText = complaintInput.value.trim();

    if (!name || !city || !mobile || !address || !complaintText) {
      showToast('Please fill out all required fields before generating the question.', 'danger');
      return;
    }

    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      showToast('Please enter a valid 10-digit mobile number starting with 6-9.', 'danger');
      return;
    }

    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
      apiToggleBtn.setAttribute('aria-expanded', 'true');
      apiContent.classList.remove('collapsed');
      keyInput.focus();
      showToast('Please enter and save your Gemini API Key first.', 'danger');
      return;
    }

    // Toggle loader
    loaderContainer.classList.remove('hidden');
    generateBtn.classList.add('hidden');
    clearBtn.classList.add('hidden');

    try {
      const question = await fetchAIQuestion(complaintText, apiKey);
      generatedQuestion = question;
      questionText.textContent = question;

      loaderContainer.classList.add('hidden');
      questionSection.classList.remove('hidden');
      setInputsDisabled(true);

      submitBtn.classList.remove('hidden');
      editBtn.classList.remove('hidden');

      aiAnswerInput.focus();
      showToast('Follow-up question generated!');
    } catch (err) {
      console.error(err);
      loaderContainer.classList.add('hidden');
      generateBtn.classList.remove('hidden');
      clearBtn.classList.remove('hidden');
      showToast(`AI generation failed: ${err.message}`, 'danger');
    }
  });

  editBtn.addEventListener('click', () => {
    setInputsDisabled(false);
    questionSection.classList.add('hidden');
    aiAnswerInput.value = '';

    submitBtn.classList.add('hidden');
    editBtn.classList.add('hidden');
    generateBtn.classList.remove('hidden');
    clearBtn.classList.remove('hidden');

    generatedQuestion = '';
  });

  form.addEventListener('reset', () => {
    setTimeout(() => {
      setInputsDisabled(false);
      questionSection.classList.add('hidden');
      loaderContainer.classList.add('hidden');
      aiAnswerInput.value = '';

      submitBtn.classList.add('hidden');
      editBtn.classList.add('hidden');
      generateBtn.classList.remove('hidden');
      clearBtn.classList.remove('hidden');

      generatedQuestion = '';
    }, 0);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const name = nameInput.value.trim();
    const city = cityInput.value.trim();
    const mobile = mobileInput.value.trim();
    const address = addressInput.value.trim();
    const complaintText = complaintInput.value.trim();
    const aiAnswer = aiAnswerInput.value.trim();

    if (!name || !city || !mobile || !address || !complaintText) {
      showToast('Please fill out all required fields.', 'danger');
      return;
    }

    if (!generatedQuestion) {
      showToast('Please generate the follow-up question first.', 'danger');
      return;
    }

    if (!aiAnswer) {
      showToast('Please provide an answer to the follow-up question.', 'danger');
      aiAnswerInput.focus();
      return;
    }

    // Create complaint object
    const newComplaint = {
      id: generateTrackingId(),
      name: name,
      city: city,
      mobile: mobile,
      address: address,
      complaint: complaintText,
      aiQuestion: generatedQuestion,
      aiAnswer: aiAnswer,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    // Save to Database Array and localStorage
    complaints.unshift(newComplaint);
    saveToStorage();

    showToast(`Complaint filed successfully! ID: ${newComplaint.id}`);

    form.reset();

    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1200);
  });
}

// Helpers
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g,
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}

// Initialize View Handlers on DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
  setupHomeView();
  setupFormView();
});
