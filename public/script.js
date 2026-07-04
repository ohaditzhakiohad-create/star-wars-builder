let screens;
let builderGrid;
let roundLabel;
let resultsList;
let totalScoreEl;
let percentileScoreEl;
let leaderboardBody;
let usernameInput;

let startBtn;
let viewLeaderboardBtn;
let submitScoreBtn;
let playAgainBtn;
let backHomeBtn;
let aboutHomeBtn;

const categoryOrder = [
  'forceStrength',
  'master',
  'lightsaberSkills',
  'pilotingSkills',
  'tacticalIntelligence'
];

let gameState = {
  locked: {},
  currentState: {},
  finished: false
};

function setScreenVisibility(name) {
  Object.entries(screens || {}).forEach(([key, screen]) => {
    if (!screen) return;

    const isActive = key === name;
    screen.classList.toggle('hidden', !isActive);
    screen.classList.toggle('active', isActive);
    screen.style.display = isActive ? 'block' : 'none';
  });
}

function showScreen(name) {
  if (!screens || !screens[name]) return;
  setScreenVisibility(name);
}

function resetAllScreens() {
  Object.values(screens || {}).forEach(screen => {
    if (screen) {
      screen.classList.add('hidden');
      screen.classList.remove('active');
      screen.style.display = 'none';
    }
  });
}

function navigateTo(route) {
  const cleanRoute = route.startsWith('/') ? route : `/${route}`;
  window.history.pushState({}, '', cleanRoute);
  handleRoute(cleanRoute);
}

function updateNavState(route) {
  const normalizedRoute = route === '/' ? '/' : route.replace(/\/$/, '');

  document.querySelectorAll('.nav-btn').forEach(button => {
    const targetRoute = button.dataset.route || '/';
    button.classList.toggle('active', targetRoute === normalizedRoute);
  });
}

async function handleRoute(route) {
  const normalizedRoute = route === '/' ? '/' : route.replace(/\/$/, '');
  updateNavState(normalizedRoute);

  if (normalizedRoute === '/builder') {
    resetGame();
    resetAllScreens();
    showScreen('builder');
    await randomizeState();
    return;
  }

  if (normalizedRoute === '/about') {
    resetAllScreens();
    showScreen('about');
    return;
  }

  if (normalizedRoute === '/leaderboard') {
    resetAllScreens();
    await loadLeaderboard();
    showScreen('leaderboard');
    return;
  }

  resetAllScreens();
  showScreen('home');
}

function showError(message) {
  alert(message);
}

async function randomizeState() {
  try {
    const response = await fetch('/api/randomize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ locked: gameState.locked })
    });

    if (!response.ok) {
      throw new Error(`Server request failed with status ${response.status}`);
    }

    const data = await response.json();
    gameState.currentState = data.state;
    renderBuilder();
  } catch (error) {
    showError('Unable to load game data. Make sure the server is running, then refresh the page.');
    console.error(error);
  }
}

function renderBuilder() {
  const lockedCount = Object.keys(gameState.locked).length;
  const activeRound = lockedCount + 1;

  roundLabel.textContent = lockedCount < 5 ? `Round ${activeRound} of 5` : 'Build Complete';
  builderGrid.innerHTML = '';

  categoryOrder.forEach(key => {
    const item = gameState.currentState[key];
    if (!item) return;

    const card = document.createElement('article');
    card.className = `category-card ${item.locked ? 'locked' : ''}`;

    const canChoose = !item.locked && !gameState.finished;
    const imageHtml = item.image
      ? `<div class="character-face-wrap">
           <img
             class="character-face"
             src="${item.image}"
             alt="${item.name}"
             onerror="this.style.display='none'; this.parentElement.classList.add('image-missing');"
           />
         </div>`
      : '';

    card.innerHTML = `
      <span class="status">${item.locked ? 'Locked In' : 'Available'}</span>
      <h3>${item.category}</h3>
      ${imageHtml}
      <p class="option-name">${item.name}</p>
      <p class="points">${item.points}/20 points</p>
      <button class="lock-btn" type="button" ${canChoose ? '' : 'disabled'} data-category="${key}">
        ${item.locked ? 'Locked' : 'Choose This'}
      </button>
    `;

    builderGrid.appendChild(card);
  });

  document.querySelectorAll('.lock-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      lockCategory(btn.dataset.category);
    });
  });
}

async function lockCategory(categoryKey) {
  if (gameState.locked[categoryKey] || gameState.finished) return;

  gameState.locked[categoryKey] = gameState.currentState[categoryKey];
  const lockedCount = Object.keys(gameState.locked).length;

  if (lockedCount === 5) {
    gameState.finished = true;
    showResults();
    return;
  }

  await randomizeState();
}

function showResults() {
  showScreen('results');
  resultsList.innerHTML = '';

  const selections = categoryOrder.map(key => ({
    key,
    ...gameState.locked[key]
  }));

  const totalScore = selections.reduce((sum, item) => sum + item.points, 0);
  const percentile = totalScore;

  selections.forEach(item => {
    const row = document.createElement('div');
    row.className = 'result-item';

    const imageHtml = item.image
      ? `<img
           class="result-face"
           src="${item.image}"
           alt="${item.name}"
           onerror="this.style.display='none'"
         />`
      : '';

    row.innerHTML = `
      <span class="result-left">
        ${imageHtml}
        <span><strong>${item.category}:</strong> ${item.name}</span>
      </span>
      <span>${item.points}/20</span>
    `;

    resultsList.appendChild(row);
  });

  totalScoreEl.textContent = totalScore;
  percentileScoreEl.textContent = percentile;

  submitScoreBtn.onclick = async () => {
    const username = usernameInput.value.trim();

    if (!username) {
      alert('Please enter a username.');
      return;
    }

    const payload = {
      username,
      selections: selections.map(({ category, name, points, image }) => ({
        category,
        name,
        points,
        image
      })),
      totalScore,
      percentile
    };

    try {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Save failed with status ${response.status}`);
      }

      usernameInput.value = '';
      await loadLeaderboard();
      showScreen('leaderboard');
      window.history.pushState({}, '', '/leaderboard');
    } catch (error) {
      alert('There was a problem saving your score.');
      console.error(error);
    }
  };
}

async function loadLeaderboard() {
  try {
    const response = await fetch('/api/scores');

    if (!response.ok) {
      throw new Error(`Server request failed with status ${response.status}`);
    }

    const scores = await response.json();

    leaderboardBody.innerHTML = '';

    if (!scores.length) {
      leaderboardBody.innerHTML = '<tr><td colspan="5">No scores yet.</td></tr>';
      return;
    }

    scores.forEach((score, index) => {
      const row = document.createElement('tr');
      const date = new Date(score.createdAt).toLocaleDateString();

      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${score.username}</td>
        <td>${score.totalScore}</td>
        <td>${score.percentile}%</td>
        <td>${date}</td>
      `;

      leaderboardBody.appendChild(row);
    });
  } catch (error) {
    console.error('Failed to load leaderboard:', error);
  }
}

function resetGame() {
  gameState = {
    locked: {},
    currentState: {},
    finished: false
  };

  if (usernameInput) {
    usernameInput.value = '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  screens = {
    home: document.getElementById('home-screen'),
    builder: document.getElementById('builder-screen'),
    results: document.getElementById('results-screen'),
    about: document.getElementById('about-screen'),
    leaderboard: document.getElementById('leaderboard-screen')
  };

  builderGrid = document.getElementById('builder-grid');
  roundLabel = document.getElementById('round-label');
  resultsList = document.getElementById('results-list');
  totalScoreEl = document.getElementById('total-score');
  percentileScoreEl = document.getElementById('percentile-score');
  leaderboardBody = document.getElementById('leaderboard-body');
  usernameInput = document.getElementById('username');

  startBtn = document.getElementById('start-btn');
  viewLeaderboardBtn = document.getElementById('view-leaderboard-btn');
  submitScoreBtn = document.getElementById('submit-score-btn');
  playAgainBtn = document.getElementById('play-again-btn');
  backHomeBtn = document.getElementById('back-home-btn');
  aboutHomeBtn = document.getElementById('about-home-btn');

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      navigateTo('/builder');
    });
  }

  if (viewLeaderboardBtn) {
    viewLeaderboardBtn.addEventListener('click', () => {
      navigateTo('/leaderboard');
    });
  }

  if (playAgainBtn) {
    playAgainBtn.addEventListener('click', () => {
      navigateTo('/builder');
    });
  }

  if (backHomeBtn) {
    backHomeBtn.addEventListener('click', () => {
      navigateTo('/');
    });
  }

  if (aboutHomeBtn) {
    aboutHomeBtn.addEventListener('click', () => {
      navigateTo('/');
    });
  }

  document.querySelectorAll('.nav-btn').forEach(button => {
    button.addEventListener('click', () => {
      navigateTo(button.dataset.route || '/');
    });
  });

  resetAllScreens();
  handleRoute(window.location.pathname);

  window.addEventListener('popstate', () => {
    handleRoute(window.location.pathname);
  });
});
