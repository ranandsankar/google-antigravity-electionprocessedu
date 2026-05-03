import test from 'node:test';
import assert from 'node:assert';

process.env.NODE_ENV = 'test';

const PORT = process.env.TEST_PORT || 8081;
const BASE_URL = `http://localhost:${PORT}`;

// We need to start the server for testing and close it afterwards.
import app from '../server.js';
let server;

test.before((done) => {
    server = app.listen(PORT, done);
});

test.after((done) => {
    server.close(done);
});

test('GET /api/timeline returns default loksabha timeline', async () => {
    const response = await fetch(`${BASE_URL}/api/timeline`);
    assert.strictEqual(response.status, 200);
    const data = await response.json();
    assert.ok(data.timeline);
    assert.ok(data.timeline.length > 0);
    assert.strictEqual(data.timeline[0].title, "Election Schedule Announcement");
});

test('GET /api/timeline?type=assembly returns assembly timeline', async () => {
    const response = await fetch(`${BASE_URL}/api/timeline?type=assembly`);
    assert.strictEqual(response.status, 200);
    const data = await response.json();
    assert.ok(data.timeline);
    assert.strictEqual(data.timeline[1].title, "Nominations & Campaigning");
});

test('GET /api/timeline?type=invalid returns loksabha timeline as fallback', async () => {
    const response = await fetch(`${BASE_URL}/api/timeline?type=invalid`);
    assert.strictEqual(response.status, 200);
    const data = await response.json();
    assert.ok(data.timeline);
    assert.strictEqual(data.timeline[0].title, "Election Schedule Announcement"); // Lok Sabha timeline
});

test('GET /api/quiz returns quiz questions', async () => {
    const response = await fetch(`${BASE_URL}/api/quiz`);
    assert.strictEqual(response.status, 200);
    const data = await response.json();
    assert.ok(data.questions);
    assert.strictEqual(data.questions.length, 8);
});

test('GET /api/quiz structure is correct', async () => {
    const response = await fetch(`${BASE_URL}/api/quiz`);
    const data = await response.json();
    const q = data.questions[0];
    assert.ok(q.question);
    assert.ok(q.options.length === 4);
    assert.ok(typeof q.answer === 'number');
    assert.ok(q.explanation);
});

test('POST /api/chat returns error if message is missing', async () => {
    const response = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    });
    assert.strictEqual(response.status, 400);
    const data = await response.json();
    assert.strictEqual(data.error, 'Message is required');
});

test('POST /api/chat returns error if message is blank string', async () => {
    const response = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: "   " }) // Only spaces
    });
    // This requires server.js update to trim the message, but current server.js might not
    // We should test how the server handles it.
    // In our server.js: const { message } = req.body; if (!message) ...
    // A blank string is truthy, so it bypasses the `if (!message)` check.
    // Let's actually verify it returns 400 after we update server.js
    assert.strictEqual(response.status, 400);
});

test('POST /api/chat provides fallback and disclaimer when no API key is present', async () => {
    // Ensuring GEMINI_API_KEY is undefined for this test
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const response = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: "How do I vote?" })
    });
    
    assert.strictEqual(response.status, 200);
    const data = await response.json();
    assert.strictEqual(data.isFallback, true);
    assert.ok(data.aiData.topic);
    assert.ok(data.aiData.answer);
    assert.ok(data.aiData.indiaContext);
    assert.strictEqual(data.aiData.officialReminder, "Election rules, dates, voter lists, polling stations, and ID requirements can change. Always verify through the Election Commission of India, Voters’ Services Portal, or your official State Chief Electoral Officer website.");
    assert.strictEqual(data.aiData.neutralityNote, "This information is provided for nonpartisan educational purposes only. CivicPath India AI does not endorse any candidates or parties.");

    // Restore key if it existed
    if (originalKey) {
        process.env.GEMINI_API_KEY = originalKey;
    }
});
