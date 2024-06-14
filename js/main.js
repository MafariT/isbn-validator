const { app, BrowserWindow } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true
    },
    autoHideMenuBar: true,
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});


/*

MAIN LOGIC

*/
async function validateISBN() {
  let isbn = document.getElementById('isbn').value;
  isbn = isbn.replace(/[^\dX]/gi, ''); // Remove non-numeric characters

  const isValid = checkISBN(isbn);

  const resultElement = document.getElementById('result');
  const bookLinkElement = document.getElementById('book-link');
  const bookInfoContainer = document.getElementById('book-info');

  resultElement.textContent = isValid ? 'Valid ISBN' : 'Invalid ISBN';
  resultElement.style.backgroundColor = isValid ? '#4CAF50' : 'red'; // Change background color
  resultElement.style.display = 'block';
  bookLinkElement.innerHTML = '';

  if (isValid) {
    try {
      const bookInfo = await fetchBookInfo(isbn);
      if (bookInfo) {
        displayBookInfo(bookInfo, bookLinkElement);
        bookInfoContainer.style.display = 'block';
      }
    } catch (error) {
      console.error('Error fetching book information:', error);
    }
  } else {
    bookInfoContainer.style.display = 'none'; 
  }
}


function displayBookInfo(bookInfo, bookLinkElement) {
  const bookLink = document.createElement('a');
  bookLink.href = bookInfo.previewLink;
  bookLink.target = '_blank';
  bookLink.textContent = 'View Book Details';
  bookLinkElement.appendChild(bookLink);

  document.getElementById('title').value = bookInfo.title;
  document.getElementById('authors').value = bookInfo.authors.join(', ');
}

function checkISBN(isbn) {
  isbn = isbn.replace(/[^\dX]/gi, '');
  if (isbn.length !== 10 && isbn.length !== 13) return false;

  if (isbn.length === 10) {
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(isbn[i]) * (10 - i);
    }
    let checksum = isbn[9].toUpperCase() === 'X' ? 10 : parseInt(isbn[9]);
    sum += checksum;
    return sum % 11 === 0;
  } else { 
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(isbn[i]) * (i % 2 === 0 ? 1 : 3);
    }
    let checksum = (10 - (sum % 10)) % 10;
    return parseInt(isbn[12]) === checksum;
  }
}

async function fetchBookInfo(isbn) {
  const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
  const data = await response.json();
  if (data && data.items && data.items.length > 0) {
    return {
      title: data.items[0].volumeInfo.title,
      authors: data.items[0].volumeInfo.authors,
      previewLink: data.items[0].volumeInfo.previewLink
    };
  } else {
    throw new Error('No book information found.');
  }
}
