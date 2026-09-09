const gameGrid = document.querySelector('#gameGrid');
const searchInput = document.querySelector('#searchInput');
const emptyState = document.querySelector('#emptyState');
const errorState = document.querySelector('#errorState');
const gameCount = document.querySelector('#gameCount');
const flaggedCount = document.querySelector('#flaggedCount');
const flaggedFilterCount = document.querySelector('#flaggedFilterCount');
const filterButtons = document.querySelectorAll('.filter-button');

const flaggedGames = new Set(JSON.parse(localStorage.getItem('whatnext-flagged') || '[]'));
let games = [];
let activeFilter = 'all';

function parseCsv(csv) {
  const rows = csv.trim().split(/\r?\n/).map((row) => {
    const values = [];
    let value = '';
    let quoted = false;

    for (let index = 0; index < row.length; index += 1) {
      const character = row[index];
      if (character === '"' && row[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = !quoted;
      } else if (character === ',' && !quoted) {
        values.push(value.trim());
        value = '';
      } else {
        value += character;
      }
    }
    values.push(value.trim());
    return values;
  });

  const headers = rows.shift();
  return rows.filter((row) => row.length && row[0]).map((row) => {
    const game = Object.fromEntries(headers.map((header, index) => [header, row[index] || '']));
    game.tags = headers.slice(5).filter((header, index) => row[index + 5] === 'x');
    return game;
  });
}

function saveFlags() {
  localStorage.setItem('whatnext-flagged', JSON.stringify([...flaggedGames]));
}

function gameMatches(game) {
  const query = searchInput.value.toLowerCase().trim();
  const searchable = `${game.game} ${game.id} ${game.steam_deck} ${game.tags.join(' ')}`.toLowerCase();
  return (!query || searchable.includes(query))
    && (activeFilter === 'all' || flaggedGames.has(game.id));
}

function renderGames() {
  const visibleGames = games.filter(gameMatches);
  gameGrid.innerHTML = visibleGames.map((game) => {
    const isFlagged = flaggedGames.has(game.id);
    const visibleTags = game.tags.slice(0, 4);
    const extraTagCount = game.tags.length - visibleTags.length;
    const tagMarkup = visibleTags.map((tag) => `<span class="tag">${tag}</span>`).join('');
    return `
      <tr class="${isFlagged ? 'is-flagged' : ''}">
        <td class="game-id">#${String(game.id).padStart(2, '0')}</td>
        <th scope="row" class="game-name">${game.game}</th>
        <td>${game.hours ? Number(game.hours).toFixed(1) : '0.0'}</td>
        <td>${game.last_played || 'Never'}</td>
        <td>${game.steam_deck || 'Unknown'}</td>
        <td class="tag-cell">${tagMarkup}${extraTagCount > 0 ? `<span class="tag tag-more">+${extraTagCount}</span>` : ''}</td>
        <td class="action-cell">
        <button class="flag-button" type="button" data-game-id="${game.id}" aria-pressed="${isFlagged}">
          <span class="flag-icon" aria-hidden="true">${isFlagged ? '★' : '☆'}</span>
          <span>${isFlagged ? 'Flagged' : 'Flag'}</span>
        </button>
        </td>
      </tr>`;
  }).join('');

  gameCount.textContent = visibleGames.length;
  flaggedCount.textContent = flaggedGames.size;
  flaggedFilterCount.textContent = flaggedGames.size;
  emptyState.hidden = visibleGames.length !== 0;
}

gameGrid.addEventListener('click', (event) => {
  const button = event.target.closest('.flag-button');
  if (!button) return;
  const gameId = button.dataset.gameId;
  flaggedGames.has(gameId) ? flaggedGames.delete(gameId) : flaggedGames.add(gameId);
  saveFlags();
  renderGames();
});

searchInput.addEventListener('input', renderGames);
filterButtons.forEach((button) => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter;
  filterButtons.forEach((filterButton) => filterButton.classList.toggle('is-active', filterButton === button));
  renderGames();
}));

fetch('../libraryTest.csv')
  .then((response) => {
    if (!response.ok) throw new Error('CSV request failed');
    return response.text();
  })
  .then((csv) => {
    games = parseCsv(csv);
    renderGames();
  })
  .catch(() => {
    errorState.hidden = false;
  });