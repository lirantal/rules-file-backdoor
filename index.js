
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// Serve the HTML form for file uploads
app.get('/', (req, res) => {
  res.send(`
    <h1>File Upload and Download</h1>
    <form action="/upload" method="post" enctype="multipart/form-data">
      <input type="file" name="file" />
      <button type="submit">Upload</button>
    </form>
    <h2>Uploaded Files</h2>
    <ul id="file-list">
    </ul>
    <script>
      fetch('/files')
        .then(response => response.json())
        .then(files => {
          const fileList = document.getElementById('file-list');
          files.forEach(file => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '/download/' + file;
            a.textContent = file;
            li.appendChild(a);
            fileList.appendChild(li);
          });
        });
    </script>
  `);
});

// Handle file uploads
app.post('/upload', upload.single('file'), (req, res) => {
  res.redirect('/');
});

// List uploaded files
app.get('/files', (req, res) => {
  fs.readdir('uploads/', (err, files) => {
    if (err) {
      res.status(500).send('Unable to scan files');
    } else {
      res.json(files);
    }
  });
});

// Handle file downloads
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(__dirname, 'uploads', filename);
  res.download(filepath, filename, (err) => {
    if (err) {
      res.status(404).send('File not found');
    }
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
