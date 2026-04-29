const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('./index');
const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, 'uploads');

// Manage the uploads directory for tests
test.before(() => {
  // Create the directory before any tests run
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
  }
});

test.beforeEach(() => {
  // Clean the directory before each test
  const files = fs.readdirSync(UPLOAD_DIR);
  for (const file of files) {
    fs.unlinkSync(path.join(UPLOAD_DIR, file));
  }
});

test.after(() => {
  // Remove the directory after all tests have run
  if (fs.existsSync(UPLOAD_DIR)) {
    fs.rmdirSync(UPLOAD_DIR, { recursive: true });
  }
});

test('GET / should return the HTML form', async () => {
  await request(app)
    .get('/')
    .expect(200)
    .expect('Content-Type', /html/)
    .expect((res) => {
      assert(res.text.includes('<h1>File Upload and Download</h1>'));
    });
});

test('POST /upload should upload a file', async () => {
  const filePath = path.join(__dirname, 'test-file.txt');
  fs.writeFileSync(filePath, 'test content');

  await request(app)
    .post('/upload')
    .attach('file', filePath)
    .expect(302) // Redirect
    .expect('Location', '/');

  assert(fs.existsSync(path.join(UPLOAD_DIR, 'test-file.txt')));
  fs.unlinkSync(filePath); // Clean up the temp file in the root
});

test('GET /files should return a list of uploaded files', async () => {
  const filePath = path.join(UPLOAD_DIR, 'test-file.txt');
  fs.writeFileSync(filePath, 'test content');

  await request(app)
    .get('/files')
    .expect(200)
    .expect('Content-Type', /json/)
    .expect((res) => {
      assert.deepStrictEqual(res.body, ['test-file.txt']);
    });
});

test('GET /download/:filename should download an existing file', async () => {
  const filePath = path.join(UPLOAD_DIR, 'test-file.txt');
  fs.writeFileSync(filePath, 'test content');

  await request(app)
    .get('/download/test-file.txt')
    .expect(200)
    .expect('Content-Disposition', 'attachment; filename="test-file.txt"')
    .expect((res) => {
      assert.strictEqual(res.text, 'test content');
    });
});

test('GET /download/:filename should return 404 for a non-existent file', async () => {
  await request(app)
    .get('/download/non-existent-file.txt')
    .expect(404);
});

test('GET / should contain a file upload form', async () => {
  await request(app)
    .get('/')
    .expect(200)
    .expect('Content-Type', /html/)
    .expect((res) => {
      assert(res.text.includes('<form action="/upload" method="post" enctype="multipart/form-data">'));
    });
});