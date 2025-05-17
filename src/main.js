import { GET_USER_INFO, GET_XP_TRANSACTIONS, GET_PROJECT_RESULTS, queryGraphQL } from './queries.js';
import { renderXPLineGraph, renderPassFailPieChart } from './graphs.js';

// Show/hide pages
function showLoginPage() {
  document.getElementById('login-page').classList.remove('hidden');
  document.getElementById('profile-page').classList.add('hidden');
}

function showProfilePage() {
  document.getElementById('login-page').classList.add('hidden');
  document.getElementById('profile-page').classList.remove('hidden');
}

// Login handler
document.getElementById('login-button').addEventListener('click', async () => {
  const loginInput = document.getElementById('login-input').value;
  const passwordInput = document.getElementById('password-input').value;
  const errorElement = document.getElementById('login-error');

  try {
    const authString = btoa(`${loginInput}:${passwordInput}`);
    const response = await fetch('https://01.gritlab.ax/api/auth/signin', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authString}`,
        'Content-Type': 'application/json',
      },
    });
    const responseText = await response.text();
    console.log('Signin response:', {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseText,
    }); // Debug: Log full response
    if (!response.ok) {
      throw new Error(`Signin failed: ${response.status} ${responseText || 'Invalid credentials'}`);
    }
    // Clean the JWT: remove all double quotes and trim
    let jwt = responseText.trim().replace(/"/g, '');
    // Fallback: Try parsing as JSON in case response is an object
    try {
      const parsed = JSON.parse(responseText);
      if (parsed.token) jwt = parsed.token;
    } catch (e) {
      // Not JSON, use cleaned text
    }
    console.log('Cleaned JWT:', jwt); // Debug: Log cleaned JWT
    // Validate JWT format (three parts separated by dots)
    if (!jwt.includes('.') || jwt.split('.').length !== 3) {
      throw new Error(`Invalid JWT format: ${jwt}`);
    }
    localStorage.setItem('jwt', jwt);
    errorElement.classList.add('hidden');
    await loadProfile();
    showProfilePage();
  } catch (err) {
    console.error('Login error:', err.message);
    errorElement.textContent = err.message;
    errorElement.classList.remove('hidden');
  }
});

// Logout handler
document.getElementById('logout-button').addEventListener('click', () => {
  localStorage.removeItem('jwt');
  showLoginPage();
});

// Load profile data and render
async function loadProfile() {
  try {
    // Fetch data
    const [userData, xpData, progressData] = await Promise.all([
      queryGraphQL(GET_USER_INFO),
      queryGraphQL(GET_XP_TRANSACTIONS),
      queryGraphQL(GET_PROJECT_RESULTS),
    ]);

    // Process data
    const user = userData.user[0];
    const totalXP = xpData.transaction.reduce((sum, tx) => sum + tx.amount, 0);
    const auditRatio = xpData.transaction.length
      ? (xpData.transaction.filter(tx => tx.path.includes('audit')).length / xpData.transaction.length).toFixed(2)
      : 0;
    const xpOverTime = xpData.transaction
      .map(tx => ({ date: new Date(tx.createdAt), amount: tx.amount }))
      .sort((a, b) => a.date - b.date);
    const passCount = progressData.progress.filter(p => p.grade === 1).length;
    const failCount = progressData.progress.filter(p => p.grade === 0).length;

    // Render profile info
    const profileInfo = document.getElementById('profile-info');
    profileInfo.innerHTML = `
      <div class="bg-white p-4 rounded-lg shadow">
        <h2 class="text-xl font-semibold">User</h2>
        <p>${user.login}</p>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <h2 class="text-xl font-semibold">Total XP</h2>
        <p>${totalXP}</p>
      </div>
      <div class="bg-white p-4 rounded-lg shadow">
        <h2 class="text-xl font-semibold">Audit Ratio</h2>
        <p>${auditRatio}</p>
      </div>
    `;

    // Render graphs
    renderXPLineGraph(xpOverTime);
    renderPassFailPieChart(passCount, failCount);
  } catch (err) {
    console.error('Error loading profile:', err);
    alert('Failed to load profile data: ' + err.message);
    localStorage.removeItem('jwt');
    showLoginPage();
  }
}

// Check for existing JWT on page load
if (localStorage.getItem('jwt')) {
  loadProfile().then(() => showProfilePage());
}