import { GET_USER_INFO, GET_XP_TRANSACTIONS, GET_SKILLS, queryGraphQL, signin } from './queries.js';
import { drawSkillsBarChart, drawXPLineGraph } from './graphs.js';

document.addEventListener('DOMContentLoaded', async () => {
  const jwt = localStorage.getItem('jwt');
  console.log('JWT:', jwt);
  if (jwt && isJwtValid(jwt)) {
    console.log('JWT is valid, fetching user info');
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('profile-section').style.display = 'block';
    await fetchAndDisplayUserInfo(jwt);
  } else if (jwt && !isJwtValid(jwt)) {
    console.log('JWT is invalid or expired');
    sessionExpired();
  } else {
    console.log('No JWT found, showing login section');
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('profile-section').style.display = 'none';
  }
});

export const isJwtValid = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp && payload.exp > currentTime;
  } catch (e) {
    console.error('JWT validation error:', e.message);
    return false;
  }
};

const sessionExpired = (message = 'Your session has expired. Please log in again.') => {
  localStorage.removeItem('jwt');
  document.getElementById('login-section').style.display = 'block';
  document.getElementById('profile-section').style.display = 'none';
  const loginError = document.getElementById('login-error');
  if (loginError) {
    loginError.textContent = message;
    loginError.style.display = 'block';
  }
};

// Login handler
document.getElementById('login-button').addEventListener('click', async () => {
  const loginInput = document.getElementById('login-input').value;
  const passwordInput = document.getElementById('password-input').value;
  const errorElement = document.getElementById('login-error');
  try {
    if (!loginInput || !passwordInput) {
      throw new Error('Username and password are required');
    }
    const jwt = await signin(loginInput, passwordInput);
    console.log('JWT stored:', jwt);
    localStorage.setItem('jwt', jwt);
    errorElement.style.display = 'none';
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('profile-section').style.display = 'block';
    await fetchAndDisplayUserInfo(jwt);
  } catch (err) {
    console.error('Login error:', err.message);
    errorElement.textContent = err.message;
    errorElement.style.display = 'block';
  }
});

// Displaying the user info in the profile section
export async function fetchAndDisplayUserInfo(jwt) {
  try {
    const data = await queryGraphQL(GET_USER_INFO, jwt);
    console.log('User info response:', data);
    const user = data?.user?.[0];
    if (!user) {
      console.warn('No user data found');
      document.getElementById('profile-section').innerHTML = '<p>No user data available</p>';
      return;
    }

    document.getElementById('username').textContent = `Username: ${user.login || 'Unknown'}`;
    document.getElementById('userid').textContent = `User ID: ${user.id || 'Unknown'}`;
    document.getElementById('nationality').textContent = `Nationality: ${user.attrs?.nationality || 'Unknown'}`;
    document.getElementById('fullname').textContent = `Full name: ${(user.firstName || '') + ' ' + (user.lastName || '')}`;
    document.getElementById('audit-ratio').textContent = `Audit Ratio: ${user.auditRatio ? (user.auditRatio * 1).toFixed(1) : '0'}`;
    document.getElementById('email').textContent = `Email: ${user.attrs?.email || 'Unknown'}`;
    document.getElementById('campus').textContent = `Campus: ${user.campus || 'Unknown'}`;
    
    await Promise.all([
      fetchAndDisplayXP(jwt),
      fetchAndDisplaySkills(jwt)
    ]);
  } catch (err) {
    console.error('Error fetching user info:', err.message);
    document.getElementById('profile-section').innerHTML = `<p>Error loading profile: ${err.message}</p>`;
  }
}

async function fetchAndDisplaySkills(jwt) {
  try {
    const data = await queryGraphQL(GET_SKILLS, jwt);
    console.log('Skills response:', data);
    const skillTransactions = data?.user?.[0]?.skills || [];
    if (skillTransactions.length === 0) {
      console.warn('No skills data found');
      document.getElementById('skills-chart').innerHTML = '<p>No skills data available</p>';
      return;
    }
    drawSkillsBarChart(skillTransactions, 'skills-chart');
  } catch (err) {
    console.error('Error fetching skills:', err.message);
    document.getElementById('skills-chart').innerHTML = `<p>Error loading skills: ${err.message}</p>`;
  }
}

async function fetchAndDisplayXP(jwt) {
  try {
    const data = await queryGraphQL(GET_XP_TRANSACTIONS, jwt);
    console.log('XP response:', data);
    const transaction = data?.transaction || [];
    if (transaction.length === 0) {
      console.warn('No XP data found');
      document.getElementById('xp-graph').innerHTML = '<p>No XP data available</p>';
      return;
    }

    // Calculate total XP with the specified filter (includes checkpoints, excludes piscine except piscine-js)
    const totalXP = transaction
      .filter(xp =>
        (xp.path.startsWith('/gritlab/school-curriculum') && !xp.path.includes('/gritlab/school-curriculum/piscine-')) ||
        xp.path.endsWith('piscine-js')
      )
      .reduce((sum, xp) => sum + (xp.amount || 0), 0);
    const totalKB = totalXP / 1000;
    document.getElementById('total-xp').textContent =
      `Total XP: ${totalKB.toLocaleString(undefined, { maximumFractionDigits: 0 })} KB`;

    // Filter transactions for the graph (exclude checkpoints and piscine except piscine-js)
    const filteredXP = transaction.filter(xp =>
      (xp.path.startsWith('/gritlab/school-curriculum') &&
        !xp.path.includes('/gritlab/school-curriculum/checkpoint') &&
        !xp.path.includes('/gritlab/school-curriculum/piscine-')) ||
      xp.path.endsWith('piscine-js')
    );

    // Sort filtered transactions by date
    const sortedXP = filteredXP.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Build progression data for the graph
    const progression = [];
    let cumulative = 0;
    for (const xp of sortedXP) {
      cumulative += xp.amount || 0;
      progression.push({
        cumulativeAmount: cumulative, // For graph y-axis
        projectAmount: xp.amount || 0, // For tooltip
        createdAt: xp.createdAt,
        path: xp.path
      });
    }

    // Draw graph or show warning
    if (progression.length > 0) {
      drawXPLineGraph(progression, 'xp-graph');
    } else {
      console.warn('No valid XP progression data');
      document.getElementById('xp-graph').innerHTML = '<p>No XP progression data available</p>';
    }
  } catch (err) {
    console.error('Error fetching XP:', err.message);
    document.getElementById('xp-graph').innerHTML = `<p>Error loading XP: ${err.message}</p>`;
  }
}

// Logout handler
document.getElementById('logout-button').addEventListener('click', () => {
  localStorage.removeItem('jwt');
  document.getElementById('profile-section').style.display = 'none';
  document.getElementById('login-section').style.display = 'block';
  window.location.reload(); // Reload page to clear inputs and profile details
});