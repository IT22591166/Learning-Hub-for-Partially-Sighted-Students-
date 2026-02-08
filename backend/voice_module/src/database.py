
"""
Database Module - SQLite Setup
Manages student profiles, learning sessions, and progress data
"""

import sqlite3
import json
from datetime import datetime
from pathlib import Path

class Database:
    """SQLite database handler for Voice Learning Module"""
    
    def __init__(self, db_path='data/voice_learning.db'):
        """Initialize database connection"""
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = None
        self.init_db()
    
    def connect(self):
        """Open database connection"""
        self.conn = sqlite3.connect(str(self.db_path))
        self.conn.row_factory = sqlite3.Row
        return self.conn
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
    
    def init_db(self):
        """Initialize database schema"""
        conn = self.connect()
        cursor = conn.cursor()
        
        # Students table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS students (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                age INTEGER,
                special_needs TEXT,
                language TEXT DEFAULT 'en-US',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Learning sessions table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                student_id TEXT NOT NULL,
                activity_id TEXT NOT NULL,
                start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                end_time TIMESTAMP,
                duration_seconds INTEGER,
                status TEXT DEFAULT 'in_progress',
                FOREIGN KEY (student_id) REFERENCES students(id)
            )
        ''')
        
        # Student responses table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS responses (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                student_id TEXT NOT NULL,
                question_id TEXT NOT NULL,
                response_text TEXT,
                response_audio BLOB,
                correct BOOLEAN,
                confidence REAL,
                emotion_state TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES sessions(id),
                FOREIGN KEY (student_id) REFERENCES students(id)
            )
        ''')
        
        # Student progress table (IRT scores)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS progress (
                id TEXT PRIMARY KEY,
                student_id TEXT NOT NULL,
                activity_id TEXT NOT NULL,
                ability REAL DEFAULT 0.0,
                standard_error REAL DEFAULT 0.5,
                accuracy REAL DEFAULT 0.5,
                attempts INTEGER DEFAULT 0,
                correct_count INTEGER DEFAULT 0,
                xp_earned INTEGER DEFAULT 0,
                level INTEGER DEFAULT 1,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id)
            )
        ''')
        
        # Badges table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS badges (
                id TEXT PRIMARY KEY,
                student_id TEXT NOT NULL,
                badge_type TEXT NOT NULL,
                badge_name TEXT NOT NULL,
                earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id)
            )
        ''')
        
        # Analytics table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS analytics (
                id TEXT PRIMARY KEY,
                student_id TEXT NOT NULL,
                metric_name TEXT NOT NULL,
                metric_value REAL,
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id)
            )
        ''')
        
        conn.commit()
        self.close()

    def create_student(self, student_id, name, age=None, special_needs=None, language='en-US'):
        """Create a new student"""
        conn = self.connect()
        cursor = conn.cursor()
        try:
            cursor.execute('''
                INSERT INTO students (id, name, age, special_needs, language)
                VALUES (?, ?, ?, ?, ?)
            ''', (student_id, name, age, special_needs, language))
            conn.commit()
            return True
        except sqlite3.IntegrityError:
            return False
        finally:
            self.close()

    def get_student(self, student_id):
        """Get student info"""
        conn = self.connect()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM students WHERE id = ?', (student_id,))
        result = cursor.fetchone()
        self.close()
        return dict(result) if result else None

    def create_session(self, session_id, student_id, activity_id):
        """Create a new learning session"""
        conn = self.connect()
        cursor = conn.cursor()
        try:
            cursor.execute('''
                INSERT INTO sessions (id, student_id, activity_id)
                VALUES (?, ?, ?)
            ''', (session_id, student_id, activity_id))
            conn.commit()
            return True
        except Exception as e:
            print(f"Error creating session: {e}")
            return False
        finally:
            self.close()

    def end_session(self, session_id):
        """End a learning session"""
        conn = self.connect()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE sessions 
            SET end_time = CURRENT_TIMESTAMP, status = 'completed'
            WHERE id = ?
        ''', (session_id,))
        conn.commit()
        self.close()

    def record_response(self, response_id, session_id, student_id, question_id, 
                       response_text, correct, confidence, emotion_state):
        """Record a student response"""
        conn = self.connect()
        cursor = conn.cursor()
        try:
            cursor.execute('''
                INSERT INTO responses 
                (id, session_id, student_id, question_id, response_text, correct, confidence, emotion_state)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (response_id, session_id, student_id, question_id, response_text, correct, confidence, emotion_state))
            conn.commit()
            return True
        except Exception as e:
            print(f"Error recording response: {e}")
            return False
        finally:
            self.close()

    def update_progress(self, student_id, activity_id, ability, standard_error, 
                       accuracy, attempts, correct_count, xp_earned, level):
        """Update or create student progress"""
        conn = self.connect()
        cursor = conn.cursor()
        
        # Check if record exists
        cursor.execute('SELECT id FROM progress WHERE student_id = ? AND activity_id = ?', 
                      (student_id, activity_id))
        exists = cursor.fetchone()
        
        if exists:
            cursor.execute('''
                UPDATE progress 
                SET ability = ?, standard_error = ?, accuracy = ?, 
                    attempts = ?, correct_count = ?, xp_earned = ?, level = ?,
                    last_updated = CURRENT_TIMESTAMP
                WHERE student_id = ? AND activity_id = ?
            ''', (ability, standard_error, accuracy, attempts, correct_count, xp_earned, level, student_id, activity_id))
        else:
            import uuid
            progress_id = str(uuid.uuid4())
            cursor.execute('''
                INSERT INTO progress 
                (id, student_id, activity_id, ability, standard_error, accuracy, attempts, correct_count, xp_earned, level)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (progress_id, student_id, activity_id, ability, standard_error, accuracy, attempts, correct_count, xp_earned, level))
        
        conn.commit()
        self.close()

    def get_progress(self, student_id, activity_id):
        """Get student progress for activity"""
        conn = self.connect()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM progress WHERE student_id = ? AND activity_id = ?', 
                      (student_id, activity_id))
        result = cursor.fetchone()
        self.close()
        return dict(result) if result else None

    def award_badge(self, badge_id, student_id, badge_type, badge_name):
        """Award a badge to student"""
        conn = self.connect()
        cursor = conn.cursor()
        try:
            cursor.execute('''
                INSERT INTO badges (id, student_id, badge_type, badge_name)
                VALUES (?, ?, ?, ?)
            ''', (badge_id, student_id, badge_type, badge_name))
            conn.commit()
            return True
        except Exception as e:
            print(f"Error awarding badge: {e}")
            return False
        finally:
            self.close()

    def get_badges(self, student_id):
        """Get all badges for a student"""
        conn = self.connect()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM badges WHERE student_id = ? ORDER BY earned_at DESC', (student_id,))
        results = cursor.fetchall()
        self.close()
        return [dict(row) for row in results]

    def get_session_stats(self, student_id):
        """Get statistics for a student"""
        conn = self.connect()
        cursor = conn.cursor()
        
        # Total sessions
        cursor.execute('SELECT COUNT(*) as total FROM sessions WHERE student_id = ?', (student_id,))
        total_sessions = cursor.fetchone()['total']
        
        # Total responses
        cursor.execute('SELECT COUNT(*) as total FROM responses WHERE student_id = ?', (student_id,))
        total_responses = cursor.fetchone()['total']
        
        # Accuracy
        cursor.execute('SELECT AVG(CAST(correct AS FLOAT)) as accuracy FROM responses WHERE student_id = ?', (student_id,))
        accuracy = cursor.fetchone()['accuracy'] or 0
        
        # Total XP
        cursor.execute('SELECT COALESCE(SUM(xp_earned), 0) as total_xp FROM progress WHERE student_id = ?', (student_id,))
        total_xp = cursor.fetchone()['total_xp']
        
        self.close()
        
        return {
            'student_id': student_id,
            'total_sessions': total_sessions,
            'total_responses': total_responses,
            'accuracy': round(accuracy * 100, 2),
            'total_xp': total_xp
        }

    def export_student_data(self, student_id):
        """Export all data for a student (for research)"""
        conn = self.connect()
        cursor = conn.cursor()
        
        # Get student info
        cursor.execute('SELECT * FROM students WHERE id = ?', (student_id,))
        student = dict(cursor.fetchone()) if cursor.fetchone() else None
        
        # Get sessions
        cursor.execute('SELECT * FROM sessions WHERE student_id = ?', (student_id,))
        sessions = [dict(row) for row in cursor.fetchall()]
        
        # Get responses
        cursor.execute('SELECT * FROM responses WHERE student_id = ?', (student_id,))
        responses = [dict(row) for row in cursor.fetchall()]
        
        # Get progress
        cursor.execute('SELECT * FROM progress WHERE student_id = ?', (student_id,))
        progress = [dict(row) for row in cursor.fetchall()]
        
        # Get badges
        cursor.execute('SELECT * FROM badges WHERE student_id = ?', (student_id,))
        badges = [dict(row) for row in cursor.fetchall()]
        
        self.close()
        
        return {
            'student': student,
            'sessions': sessions,
            'responses': responses,
            'progress': progress,
            'badges': badges,
            'exported_at': datetime.now().isoformat()
        }


# Initialize database on import
if __name__ == '__main__':
    db = Database()
    print("✓ Database initialized successfully")
    print(f"✓ Location: {db.db_path}")
    
    def create_student(self, student_id, name, age=None, special_needs=None, language='en-US'):
        """Create a new student"""
        conn = self.connect()
        cursor = conn.cursor()
        try:
            cursor.execute('''
                INSERT INTO students (id, name, age, special_needs, language)
                VALUES (?, ?, ?, ?, ?)
            ''', (student_id, name, age, special_needs, language))
            conn.commit()
            return True
        except sqlite3.IntegrityError:
            return False
        finally:
            self.close()
    
    def get_student(self, student_id):
        """Get student info"""
        conn = self.connect()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM students WHERE id = ?', (student_id,))
        result = cursor.fetchone()
        self.close()
        return dict(result) if result else None
    
    def create_session(self, session_id, student_id, activity_id):
        """Create a new learning session"""
        conn = self.connect()
        cursor = conn.cursor()
        try:
            cursor.execute('''
                INSERT INTO sessions (id, student_id, activity_id)
                VALUES (?, ?, ?)
            ''', (session_id, student_id, activity_id))
            conn.commit()
            return True
        except Exception as e:
            print(f"Error creating session: {e}")
            return False
        finally:
            self.close()
    
    def end_session(self, session_id):
        """End a learning session"""
        conn = self.connect()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE sessions 
            SET end_time = CURRENT_TIMESTAMP, status = 'completed'
            WHERE id = ?
        ''', (session_id,))
        conn.commit()
        self.close()
    
    def record_response(self, response_id, session_id, student_id, question_id, 
                       response_text, correct, confidence, emotion_state):
        """Record a student response"""
        conn = self.connect()
        cursor = conn.cursor()
        try:
            cursor.execute('''
                INSERT INTO responses 
                (id, session_id, student_id, question_id, response_text, correct, confidence, emotion_state)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (response_id, session_id, student_id, question_id, response_text, correct, confidence, emotion_state))
            conn.commit()
            return True
        except Exception as e:
            print(f"Error recording response: {e}")
            return False
        finally:
            self.close()
    
    def update_progress(self, student_id, activity_id, ability, standard_error, 
                       accuracy, attempts, correct_count, xp_earned, level):
        """Update or create student progress"""
        conn = self.connect()
        cursor = conn.cursor()
        
        # Check if record exists
        cursor.execute('SELECT id FROM progress WHERE student_id = ? AND activity_id = ?', 
                      (student_id, activity_id))
        exists = cursor.fetchone()
        
        if exists:
            cursor.execute('''
                UPDATE progress 
                SET ability = ?, standard_error = ?, accuracy = ?, 
                    attempts = ?, correct_count = ?, xp_earned = ?, level = ?,
                    last_updated = CURRENT_TIMESTAMP
                WHERE student_id = ? AND activity_id = ?
            ''', (ability, standard_error, accuracy, attempts, correct_count, xp_earned, level, student_id, activity_id))
        else:
            import uuid
            progress_id = str(uuid.uuid4())
            cursor.execute('''
                INSERT INTO progress 
                (id, student_id, activity_id, ability, standard_error, accuracy, attempts, correct_count, xp_earned, level)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (progress_id, student_id, activity_id, ability, standard_error, accuracy, attempts, correct_count, xp_earned, level))
        
        conn.commit()
        self.close()
    
    def get_progress(self, student_id, activity_id):
        """Get student progress for activity"""
        conn = self.connect()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM progress WHERE student_id = ? AND activity_id = ?', 
                      (student_id, activity_id))
        result = cursor.fetchone()
        self.close()
        return dict(result) if result else None
    
    def award_badge(self, badge_id, student_id, badge_type, badge_name):
        """Award a badge to student"""
        conn = self.connect()
        cursor = conn.cursor()
        try:
            cursor.execute('''
                INSERT INTO badges (id, student_id, badge_type, badge_name)
                VALUES (?, ?, ?, ?)
            ''', (badge_id, student_id, badge_type, badge_name))
            conn.commit()
            return True
        except Exception as e:
            print(f"Error awarding badge: {e}")
            return False
        finally:
            self.close()
    
    def get_badges(self, student_id):
        """Get all badges for a student"""
        conn = self.connect()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM badges WHERE student_id = ? ORDER BY earned_at DESC', (student_id,))
        results = cursor.fetchall()
        self.close()
        return [dict(row) for row in results]
    
    def get_session_stats(self, student_id):
        """Get statistics for a student"""
        conn = self.connect()
        cursor = conn.cursor()
        
        # Total sessions
        cursor.execute('SELECT COUNT(*) as total FROM sessions WHERE student_id = ?', (student_id,))
        total_sessions = cursor.fetchone()['total']
        
        # Total responses
        cursor.execute('SELECT COUNT(*) as total FROM responses WHERE student_id = ?', (student_id,))
        total_responses = cursor.fetchone()['total']
        
        # Accuracy
        cursor.execute('SELECT AVG(CAST(correct AS FLOAT)) as accuracy FROM responses WHERE student_id = ?', (student_id,))
        accuracy = cursor.fetchone()['accuracy'] or 0
        
        # Total XP
        cursor.execute('SELECT COALESCE(SUM(xp_earned), 0) as total_xp FROM progress WHERE student_id = ?', (student_id,))
        total_xp = cursor.fetchone()['total_xp']
        
        self.close()
        
        return {
            'student_id': student_id,
            'total_sessions': total_sessions,
            'total_responses': total_responses,
            'accuracy': round(accuracy * 100, 2),
            'total_xp': total_xp
        }
    
    def export_student_data(self, student_id):
        """Export all data for a student (for research)"""
        conn = self.connect()
        cursor = conn.cursor()
        
        # Get student info
        cursor.execute('SELECT * FROM students WHERE id = ?', (student_id,))
        student = dict(cursor.fetchone()) if cursor.fetchone() else None
        
        # Get sessions
        cursor.execute('SELECT * FROM sessions WHERE student_id = ?', (student_id,))
        sessions = [dict(row) for row in cursor.fetchall()]
        
        # Get responses
        cursor.execute('SELECT * FROM responses WHERE student_id = ?', (student_id,))
        responses = [dict(row) for row in cursor.fetchall()]
        
        # Get progress
        cursor.execute('SELECT * FROM progress WHERE student_id = ?', (student_id,))
        progress = [dict(row) for row in cursor.fetchall()]
        
        # Get badges
        cursor.execute('SELECT * FROM badges WHERE student_id = ?', (student_id,))
        badges = [dict(row) for row in cursor.fetchall()]
        
        self.close()
        
        return {
            'student': student,
            'sessions': sessions,
            'responses': responses,
            'progress': progress,
            'badges': badges,
            'exported_at': datetime.now().isoformat()
        }


# Initialize database on import
if __name__ == '__main__':
    db = Database()
    print("✓ Database initialized successfully")
    print(f"✓ Location: {db.db_path}")
