const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.')); // سرو فایل‌های استاتیک

// ایجاد و اتصال به پایگاه داده SQLite
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        createTables();
    }
});

// ایجاد جداول
function createTables() {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS test_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        test_name TEXT,
        overall_score INTEGER,
        avg_fps INTEGER,
        max_fps INTEGER,
        min_fps INTEGER,
        stability INTEGER,
        duration REAL,
        settings TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        achievement_id TEXT,
        unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);
}

// Route برای بررسی نام کاربری تکراری
app.post('/api/check-username', (req, res) => {
    const { username } = req.body;
    
    db.get('SELECT id FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
            res.status(500).json({ error: 'Database error' });
            return;
        }
        
        res.json({ exists: !!row });
    });
});

// Route برای ذخیره نتیجه تست
app.post('/api/save-result', (req, res) => {
    const { username, testName, overallScore, avgFPS, maxFPS, minFPS, stability, duration, settings } = req.body;
    
    // ابتدا کاربر را پیدا یا ایجاد کنید
    db.get('SELECT id FROM users WHERE username = ?', [username], (err, user) => {
        if (err) {
            res.status(500).json({ error: 'Database error' });
            return;
        }
        
        if (!user) {
            // ایجاد کاربر جدید
            db.run('INSERT INTO users (username) VALUES (?)', [username], function(err) {
                if (err) {
                    res.status(500).json({ error: 'Error creating user' });
                    return;
                }
                
                const userId = this.lastID;
                saveTestResult(userId);
            });
        } else {
            saveTestResult(user.id);
        }
    });
    
    function saveTestResult(userId) {
        const stmt = db.prepare(`INSERT INTO test_results 
            (user_id, test_name, overall_score, avg_fps, max_fps, min_fps, stability, duration, settings) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        
        stmt.run(userId, testName, overallScore, avgFPS, maxFPS, minFPS, stability, duration, JSON.stringify(settings), function(err) {
            if (err) {
                res.status(500).json({ error: 'Error saving result' });
                return;
            }
            
            res.json({ 
                success: true, 
                message: 'Result saved successfully',
                resultId: this.lastID 
            });
        });
        
        stmt.finalize();
    }
});

// Route برای دریافت لیست برترین‌ها
app.get('/api/leaderboard', (req, res) => {
    const { testName = 'all' } = req.query;
    
    let query = `
        SELECT u.username, tr.test_name, tr.overall_score, tr.avg_fps, 
               tr.max_fps, tr.min_fps, tr.stability, tr.duration,
               tr.timestamp
        FROM test_results tr
        JOIN users u ON tr.user_id = u.id
    `;
    
    const params = [];
    if (testName !== 'all') {
        query += ' WHERE tr.test_name = ?';
        params.push(testName);
    }
    
    query += ' ORDER BY tr.overall_score DESC LIMIT 100';
    
    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: 'Database error' });
            return;
        }
        
        res.json(rows);
    });
});

// Route برای دریافت آمار کلی
app.get('/api/stats', (req, res) => {
    const queries = [
        'SELECT COUNT(DISTINCT user_id) as total_users FROM test_results',
        'SELECT MAX(overall_score) as top_score FROM test_results',
        'SELECT AVG(overall_score) as avg_score FROM test_results'
    ];
    
    db.serialize(() => {
        const results = {};
        
        db.get(queries[0], [], (err, row) => {
            if (!err) results.totalUsers = row.total_users || 0;
        });
        
        db.get(queries[1], [], (err, row) => {
            if (!err) results.topScore = row.top_score || 0;
        });
        
        db.get(queries[2], [], (err, row) => {
            if (!err) results.avgScore = Math.round(row.avg_score) || 0;
        });
        
        // کمی تاخیر برای اطمینان از اجرای تمام کوئری‌ها
        setTimeout(() => {
            res.json(results);
        }, 100);
    });
});

// Route برای تولید تصویر
app.post('/api/generate-image', (req, res) => {
    const { resultData } = req.body;
    
    // اینجا می‌توانید از پایتون برای تولید تصویر استفاده کنید
    // برای سادگی، یک URL ثابت برمی‌گردانیم
    res.json({ 
        imageUrl: `data:image/svg+xml;base64,${Buffer.from(`
            <svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="#0a0a2a"/>
                <text x="400" y="50" text-anchor="middle" fill="#00ffcc" font-size="24">GPU Stress Test Result</text>
                <text x="50" y="100" fill="#ffffff" font-size="18">User: ${resultData.username}</text>
                <text x="50" y="130" fill="#ffffff" font-size="18">Score: ${resultData.overallScore}</text>
                <text x="50" y="160" fill="#ffffff" font-size="18">Avg FPS: ${resultData.avgFPS}</text>
                <text x="50" y="190" fill="#ffffff" font-size="18">Stability: ${resultData.stability}%</text>
            </svg>
        `).toString('base64')}`
    });
});

// Route اصلی برای سرو فایل HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// شروع سرور
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Admin panel will be available at http://localhost:${PORT}/admin.html`);
});