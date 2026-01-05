const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// اطمینان از وجود فایل دیتابیس
const dbPath = './gpu_test.db';
if (fs.existsSync(dbPath)) {
    console.log('Database already exists');
    process.exit(0);
}

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log('Setting up database...');
    
    // ایجاد جداول
    db.run(`CREATE TABLE test_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id VARCHAR(100) NOT NULL,
        username VARCHAR(50) NOT NULL,
        test_name VARCHAR(50) NOT NULL,
        overall_score INTEGER NOT NULL,
        avg_fps INTEGER NOT NULL,
        max_fps INTEGER NOT NULL,
        min_fps INTEGER NOT NULL,
        stability INTEGER NOT NULL,
        duration REAL NOT NULL,
        quality_level INTEGER NOT NULL,
        pressure_level INTEGER NOT NULL,
        fps_limit INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45),
        user_agent TEXT
    )`);

    db.run(`CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id VARCHAR(100) UNIQUE NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_active DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id VARCHAR(50) NOT NULL,
        achievement_id VARCHAR(50) NOT NULL,
        achievement_title VARCHAR(100) NOT NULL,
        achievement_desc TEXT NOT NULL,
        unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE admin_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_key VARCHAR(100) NOT NULL,
        action VARCHAR(50) NOT NULL,
        details TEXT,
        ip_address VARCHAR(45),
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // ایجاد ایندکس‌ها
    db.run('CREATE INDEX idx_results_user_id ON test_results(user_id)');
    db.run('CREATE INDEX idx_results_score ON test_results(overall_score DESC)');
    db.run('CREATE INDEX idx_users_username ON users(username)');

    console.log('Database setup completed successfully!');
});

db.close();