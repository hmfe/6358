function formatDate(date) {
  // Year/month/day
  const d = new Date(date);
  let month = `${d.getMonth() + 1}`;
  let day = `${d.getDate()}`;
  const year = d.getFullYear();
  if (month.length < 2) month = `0${month}`;
  if (day.length < 2) day = `0${day}`;
  const yearMonthDay = [year, month, day].join('-');

  // Time
  let hours = date.getHours();
  let minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours %= 12;
  hours = hours || 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? `0${minutes}` : minutes;
  const time = `${hours}:${minutes} ${ampm}`;

  return `${yearMonthDay}, ${time}`;
}

function isKeyAlphabetic(keyCode) {
  return keyCode >= 65 && keyCode <= 90;
}

function deleteHistoryRow(e) {
  const historyRow = e.target.parentNode.parentNode;
  historyRow.remove();
}

function renderHistoryRowHTML(title, timestamp) {
  let row = '';

  row += '<li class="history__row flex-space-between">';
  row += `<p class="history__row-title">${title}</p>`;
  row += '<div class="flex-space-between">';
  row += `<p class="history__row-timestamp">${formatDate(timestamp)}</p>`;
  row
    += '<button class="btn btn--delete-row" aria-label="Delete history item" onclick="deleteHistoryRow(event)">&times;</button>';
  row += '</div>';
  row += '</li>';

  return row;
}

function renderLoaderHTML() {
  let loader = '';

  loader += '<div class="loader">';
  loader += '<div class="bounce bounce--1"></div>';
  loader += '<div class="bounce bounce--2"></div>';
  loader += '<div class="bounce bounce--3"></div>';
  loader += '</div>';

  return loader;
}

// https://davidwalsh.name/javascript-debounce-function
function debounce(func, wait, immediate) {
  let timeout;

  return function bounce(...args) {
    const context = this;

    function later() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    }
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

document.addEventListener('DOMContentLoaded', () => {
  const $searchInput = document.getElementById('search__input');
  const $searchResults = document.getElementById('search__results');
  const $btnClearHistory = document.getElementById('btn--clear-history');
  const $historyList = document.getElementById('history__list');

  function selectItem(e) {
    const title = e.target.innerHTML;
    const timestamp = new Date();

    const historyRowMarkup = renderHistoryRowHTML(title, timestamp);

    $historyList.insertAdjacentHTML('beforeend', historyRowMarkup);
  }

  // Debounce fetch in order to avoid unnecessary amount of requests.
  const fetchData = debounce(async (url, value) => {
    const response = await fetch(url).then((res) => res.json());

    if (!response.length) {
      $searchResults.innerHTML = 'No results...';
      return;
    }

    $searchResults.innerHTML = '';
    const countryNames = response.map((country) => country.name);

    countryNames.forEach((countryName) => {
      if (
        countryName.substr(0, value.length).toLowerCase()
        === value.toLowerCase()
      ) {
        const li = document.createElement('li');
        li.className = 'search__results-item';
        li.innerHTML = `<strong>${countryName.substr(
          0,
          value.length,
        )}</strong>`;
        li.innerHTML += countryName.substr(value.length);

        $searchResults.appendChild(li);
        li.onclick = selectItem;
      }
    });
  }, 300);

  function handleInput(e) {
    // We are only interested in letters A-Z.
    if (!isKeyAlphabetic(e.keyCode)) {
      return;
    }

    const { value } = e.target;

    if (!value.length) {
      $searchResults.innerHTML = '';

      if ($searchResults.classList.contains('visible')) {
        $searchResults.classList.remove('visible');
      }

      return;
    }

    $searchResults.classList.add('visible');
    $searchResults.innerHTML = renderLoaderHTML();

    const searchValue = value.split(' ').join('+');
    const url = `https://restcountries.eu/rest/v2/name/${searchValue}`;

    fetchData(url, value);
  }

  $searchInput.addEventListener('keyup', handleInput);
  $btnClearHistory.addEventListener('click', () => {
    $historyList.innerHTML = '';
  });
});
