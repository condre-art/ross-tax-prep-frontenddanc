-- Ross Tax Prep LMS (Learning Management System)
-- Migration: 003_lms_system.sql
-- Implements online university system for tax professional education

-- Programs table: Degree and certificate programs
CREATE TABLE IF NOT EXISTS lms_programs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL, -- e.g., 'AA-ACCT', 'BA-TAX', 'CERT-CPA1'
    type TEXT NOT NULL CHECK(type IN ('associates', 'bachelors', 'certificate', 'diploma', 'minor')),
    category TEXT NOT NULL CHECK(category IN ('accounting', 'taxation', 'business', 'applied_science')),
    description TEXT,
    duration_months INTEGER NOT NULL, -- Total months to complete
    credit_hours INTEGER, -- Total credit hours required
    cost_usd REAL NOT NULL,
    textbook_required INTEGER DEFAULT 1, -- Ross Tax and Bookkeeping textbook
    textbook_cost_usd REAL DEFAULT 0,
    requirements TEXT, -- JSON array of prerequisites
    learning_outcomes TEXT, -- JSON array of learning outcomes
    fast_track_available INTEGER DEFAULT 0,
    distance_learning INTEGER DEFAULT 1, -- All programs support distance learning
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Courses table: Individual courses within programs
CREATE TABLE IF NOT EXISTS lms_courses (
    id TEXT PRIMARY KEY,
    program_id TEXT,
    course_code TEXT UNIQUE NOT NULL, -- e.g., 'TAX101', 'ACCT201'
    course_name TEXT NOT NULL,
    description TEXT,
    credit_hours INTEGER NOT NULL DEFAULT 3,
    prerequisites TEXT, -- JSON array of course codes
    syllabus TEXT, -- Course syllabus content
    learning_objectives TEXT, -- JSON array of objectives
    assignment_count INTEGER DEFAULT 0,
    has_final_exam INTEGER DEFAULT 1,
    passing_grade INTEGER DEFAULT 70, -- Percentage
    is_core INTEGER DEFAULT 1, -- Core course vs elective
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (program_id) REFERENCES lms_programs(id) ON DELETE SET NULL
);

-- Staff table: AI-generated and human staff (professors, deans, registrar)
CREATE TABLE IF NOT EXISTS lms_staff (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL, -- Links to users table
    staff_type TEXT NOT NULL CHECK(staff_type IN ('professor', 'dean', 'registrar', 'advisor', 'admin', 'teaching_assistant')),
    department TEXT NOT NULL CHECK(department IN ('accounting', 'taxation', 'business', 'applied_science', 'administration')),
    title TEXT NOT NULL, -- e.g., "Professor of Taxation", "Dean of Accounting"
    specialization TEXT, -- Areas of expertise
    office_hours TEXT, -- JSON schedule of office hours
    bio TEXT,
    qualifications TEXT, -- JSON array of degrees and certifications
    ai_generated INTEGER DEFAULT 0, -- 1 if AI-generated staff
    is_active INTEGER DEFAULT 1,
    hire_date TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Student enrollments table: Student program enrollments
CREATE TABLE IF NOT EXISTS lms_enrollments (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL, -- References users table
    program_id TEXT NOT NULL,
    enrollment_status TEXT NOT NULL DEFAULT 'active' CHECK(enrollment_status IN ('active', 'withdrawn', 'completed', 'suspended', 'on_hold')),
    enrollment_date TEXT NOT NULL DEFAULT (datetime('now')),
    expected_graduation_date TEXT,
    actual_graduation_date TEXT,
    gpa REAL DEFAULT 0.0,
    credits_completed INTEGER DEFAULT 0,
    credits_required INTEGER,
    textbook_purchased INTEGER DEFAULT 0,
    textbook_purchase_date TEXT,
    payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'partial', 'delinquent', 'scholarship')),
    advisor_id TEXT, -- Assigned academic advisor
    notes TEXT, -- Advisor notes
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (program_id) REFERENCES lms_programs(id) ON DELETE RESTRICT,
    FOREIGN KEY (advisor_id) REFERENCES lms_staff(id) ON DELETE SET NULL
);

-- Course enrollments table: Student course registrations
CREATE TABLE IF NOT EXISTS lms_course_enrollments (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    semester TEXT NOT NULL, -- e.g., 'Fall 2026', 'Spring 2027'
    enrollment_status TEXT NOT NULL DEFAULT 'enrolled' CHECK(enrollment_status IN ('enrolled', 'dropped', 'completed', 'failed', 'incomplete', 'audit')),
    instructor_id TEXT, -- Assigned instructor
    enrolled_date TEXT NOT NULL DEFAULT (datetime('now')),
    completion_date TEXT,
    grade_letter TEXT, -- A, B, C, D, F
    grade_percentage REAL,
    grade_points REAL, -- For GPA calculation
    attendance_percentage REAL DEFAULT 100,
    assignments_completed INTEGER DEFAULT 0,
    assignments_total INTEGER DEFAULT 0,
    final_exam_score REAL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES lms_courses(id) ON DELETE RESTRICT,
    FOREIGN KEY (instructor_id) REFERENCES lms_staff(id) ON DELETE SET NULL
);

-- Assignments table: Course assignments and tasks
CREATE TABLE IF NOT EXISTS lms_assignments (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    assignment_type TEXT NOT NULL CHECK(assignment_type IN ('homework', 'quiz', 'exam', 'project', 'paper', 'discussion', 'case_study')),
    points_possible INTEGER NOT NULL DEFAULT 100,
    due_date TEXT,
    available_from TEXT,
    available_until TEXT,
    submission_type TEXT CHECK(submission_type IN ('online_text', 'file_upload', 'online_quiz', 'discussion_post', 'external_tool')),
    rubric TEXT, -- JSON rubric criteria
    is_required INTEGER DEFAULT 1,
    allows_late_submission INTEGER DEFAULT 0,
    late_penalty_percentage REAL DEFAULT 10,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (course_id) REFERENCES lms_courses(id) ON DELETE CASCADE
);

-- Submissions table: Student assignment submissions
CREATE TABLE IF NOT EXISTS lms_submissions (
    id TEXT PRIMARY KEY,
    assignment_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    submission_date TEXT NOT NULL DEFAULT (datetime('now')),
    submission_text TEXT,
    file_path TEXT, -- R2 bucket path for uploaded files
    score REAL,
    grade_letter TEXT,
    graded_by TEXT, -- Staff member who graded
    graded_at TEXT,
    feedback TEXT,
    is_late INTEGER DEFAULT 0,
    attempt_number INTEGER DEFAULT 1,
    status TEXT DEFAULT 'submitted' CHECK(status IN ('draft', 'submitted', 'graded', 'returned', 'resubmitted')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (assignment_id) REFERENCES lms_assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (graded_by) REFERENCES lms_staff(id) ON DELETE SET NULL
);

-- Transcripts table: Official academic records
CREATE TABLE IF NOT EXISTS lms_transcripts (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    program_id TEXT NOT NULL,
    issue_date TEXT NOT NULL DEFAULT (datetime('now')),
    transcript_type TEXT NOT NULL CHECK(transcript_type IN ('unofficial', 'official', 'final')),
    cumulative_gpa REAL NOT NULL DEFAULT 0.0,
    total_credits_earned REAL NOT NULL DEFAULT 0.0,
    total_credits_attempted REAL NOT NULL DEFAULT 0.0,
    academic_standing TEXT CHECK(academic_standing IN ('good_standing', 'probation', 'dismissed', 'honors', 'deans_list')),
    honors TEXT, -- JSON array of honors and awards
    degree_conferred TEXT, -- Degree name if graduated
    conferral_date TEXT, -- Graduation date
    seal_verified INTEGER DEFAULT 0, -- Official seal applied
    requested_by TEXT, -- Who requested the transcript
    delivered_to TEXT, -- Where transcript was sent
    delivery_method TEXT CHECK(delivery_method IN ('email', 'mail', 'electronic', 'in_person', 'fax')),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (program_id) REFERENCES lms_programs(id) ON DELETE RESTRICT
);

-- Schedule table: Course schedules and sessions
CREATE TABLE IF NOT EXISTS lms_schedule (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    instructor_id TEXT,
    semester TEXT NOT NULL,
    session_type TEXT NOT NULL CHECK(session_type IN ('lecture', 'lab', 'discussion', 'office_hours', 'exam', 'webinar')),
    day_of_week TEXT, -- Monday, Tuesday, etc.
    start_time TEXT, -- HH:MM format
    end_time TEXT,
    timezone TEXT DEFAULT 'America/New_York',
    location TEXT, -- Virtual room link or physical location
    recurring INTEGER DEFAULT 1, -- Weekly recurring
    max_students INTEGER DEFAULT 30,
    enrolled_count INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (course_id) REFERENCES lms_courses(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES lms_staff(id) ON DELETE SET NULL
);

-- Announcements table: Course and program announcements
CREATE TABLE IF NOT EXISTS lms_announcements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    announcement_type TEXT NOT NULL CHECK(announcement_type IN ('course', 'program', 'university', 'emergency')),
    course_id TEXT,
    program_id TEXT,
    author_id TEXT NOT NULL,
    priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
    publish_date TEXT NOT NULL DEFAULT (datetime('now')),
    expiry_date TEXT,
    is_pinned INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (course_id) REFERENCES lms_courses(id) ON DELETE CASCADE,
    FOREIGN KEY (program_id) REFERENCES lms_programs(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Discussion forums table
CREATE TABLE IF NOT EXISTS lms_discussions (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_by TEXT NOT NULL,
    is_pinned INTEGER DEFAULT 0,
    is_locked INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    last_post_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (course_id) REFERENCES lms_courses(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Discussion posts table
CREATE TABLE IF NOT EXISTS lms_discussion_posts (
    id TEXT PRIMARY KEY,
    discussion_id TEXT NOT NULL,
    parent_post_id TEXT, -- For threaded replies
    author_id TEXT NOT NULL,
    content TEXT NOT NULL,
    is_instructor_post INTEGER DEFAULT 0,
    is_endorsed INTEGER DEFAULT 0, -- Instructor endorsement
    upvotes INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (discussion_id) REFERENCES lms_discussions(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_post_id) REFERENCES lms_discussion_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lms_programs_type ON lms_programs(type);
CREATE INDEX IF NOT EXISTS idx_lms_programs_category ON lms_programs(category);
CREATE INDEX IF NOT EXISTS idx_lms_courses_program_id ON lms_courses(program_id);
CREATE INDEX IF NOT EXISTS idx_lms_courses_course_code ON lms_courses(course_code);
CREATE INDEX IF NOT EXISTS idx_lms_staff_user_id ON lms_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_lms_staff_staff_type ON lms_staff(staff_type);
CREATE INDEX IF NOT EXISTS idx_lms_staff_department ON lms_staff(department);
CREATE INDEX IF NOT EXISTS idx_lms_enrollments_student_id ON lms_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_lms_enrollments_program_id ON lms_enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_lms_enrollments_status ON lms_enrollments(enrollment_status);
CREATE INDEX IF NOT EXISTS idx_lms_course_enrollments_student_id ON lms_course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_lms_course_enrollments_course_id ON lms_course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lms_assignments_course_id ON lms_assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_lms_submissions_assignment_id ON lms_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_lms_submissions_student_id ON lms_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_lms_transcripts_student_id ON lms_transcripts(student_id);
CREATE INDEX IF NOT EXISTS idx_lms_schedule_course_id ON lms_schedule(course_id);
CREATE INDEX IF NOT EXISTS idx_lms_schedule_instructor_id ON lms_schedule(instructor_id);
CREATE INDEX IF NOT EXISTS idx_lms_announcements_course_id ON lms_announcements(course_id);
CREATE INDEX IF NOT EXISTS idx_lms_announcements_program_id ON lms_announcements(program_id);
CREATE INDEX IF NOT EXISTS idx_lms_discussions_course_id ON lms_discussions(course_id);
CREATE INDEX IF NOT EXISTS idx_lms_discussion_posts_discussion_id ON lms_discussion_posts(discussion_id);

-- Insert default programs as specified in requirements

-- AA Applied Science - Accounting
INSERT OR IGNORE INTO lms_programs (id, name, code, type, category, description, duration_months, credit_hours, cost_usd, textbook_cost_usd, requirements, fast_track_available, distance_learning) VALUES (
    'prog_aa_acct',
    'Associate of Applied Science - Accounting',
    'AA-ACCT',
    'associates',
    'accounting',
    'Two-year associate degree program focused on accounting principles, tax preparation, and bookkeeping for tax professionals.',
    24,
    60,
    12500.00,
    299.00,
    '["High school diploma or GED", "Basic computer skills", "Ross Tax and Bookkeeping textbook required"]',
    1,
    1
);

-- BA Applied Science - Taxation
INSERT OR IGNORE INTO lms_programs (id, name, code, type, category, description, duration_months, credit_hours, cost_usd, textbook_cost_usd, requirements, fast_track_available, distance_learning) VALUES (
    'prog_ba_tax',
    'Bachelor of Applied Science - Taxation',
    'BA-TAX',
    'bachelors',
    'taxation',
    'Four-year bachelor degree program in taxation with emphasis on tax law, tax planning, and professional tax practice.',
    48,
    120,
    28500.00,
    299.00,
    '["High school diploma or AA degree", "Ross Tax and Bookkeeping textbook required"]',
    1,
    1
);

-- Taxation Minor
INSERT OR IGNORE INTO lms_programs (id, name, code, type, category, description, duration_months, credit_hours, cost_usd, textbook_cost_usd, requirements, fast_track_available, distance_learning) VALUES (
    'prog_minor_tax',
    'Minor in Taxation',
    'MINOR-TAX',
    'minor',
    'taxation',
    'Minor program in taxation to complement business or accounting degrees.',
    12,
    18,
    4500.00,
    299.00,
    '["Currently enrolled in bachelor degree program", "Ross Tax and Bookkeeping textbook required"]',
    1,
    1
);

-- CPA Certificate 1
INSERT OR IGNORE INTO lms_programs (id, name, code, type, category, description, duration_months, credit_hours, cost_usd, textbook_cost_usd, requirements, fast_track_available, distance_learning) VALUES (
    'prog_cpa1',
    'CPA Certificate Level 1',
    'CERT-CPA1',
    'certificate',
    'accounting',
    'First level CPA preparation certificate covering financial accounting and auditing fundamentals.',
    6,
    12,
    2800.00,
    299.00,
    '["Bachelor degree or equivalent", "Ross Tax and Bookkeeping textbook required"]',
    1,
    1
);

-- CPA Certificate 2
INSERT OR IGNORE INTO lms_programs (id, name, code, type, category, description, duration_months, credit_hours, cost_usd, textbook_cost_usd, requirements, fast_track_available, distance_learning) VALUES (
    'prog_cpa2',
    'CPA Certificate Level 2',
    'CERT-CPA2',
    'certificate',
    'accounting',
    'Advanced CPA preparation certificate covering business law, taxation, and professional ethics.',
    6,
    12,
    2800.00,
    299.00,
    '["CPA Certificate Level 1 or equivalent", "Ross Tax and Bookkeeping textbook required"]',
    1,
    1
);

-- Tax Professional Diploma
INSERT OR IGNORE INTO lms_programs (id, name, code, type, category, description, duration_months, credit_hours, cost_usd, textbook_cost_usd, requirements, fast_track_available, distance_learning) VALUES (
    'prog_tax_prof_diploma',
    'Tax Professional Diploma',
    'DIPL-TAX',
    'diploma',
    'taxation',
    'Professional diploma program for tax preparers and practitioners seeking comprehensive tax education.',
    12,
    24,
    5500.00,
    299.00,
    '["High school diploma or GED", "Ross Tax and Bookkeeping textbook required"]',
    1,
    1
);

-- Associates in Business (18 months)
INSERT OR IGNORE INTO lms_programs (id, name, code, type, category, description, duration_months, credit_hours, cost_usd, textbook_cost_usd, requirements, fast_track_available, distance_learning) VALUES (
    'prog_aa_business',
    'Associate of Science - Business',
    'AA-BUS',
    'associates',
    'business',
    'Accelerated 18-month associate degree in business with focus on tax and accounting applications.',
    18,
    60,
    10800.00,
    299.00,
    '["High school diploma or GED", "Ross Tax and Bookkeeping textbook required"]',
    1,
    1
);

-- Tax Practitioner Path (Fast Track)
INSERT OR IGNORE INTO lms_programs (id, name, code, type, category, description, duration_months, credit_hours, cost_usd, textbook_cost_usd, requirements, fast_track_available, distance_learning) VALUES (
    'prog_tax_practitioner',
    'Tax Practitioner Fast Track',
    'CERT-PRAC',
    'certificate',
    'taxation',
    'Intensive fast-track certification for aspiring tax practitioners. Distance learning program designed for working professionals.',
    6,
    15,
    3500.00,
    299.00,
    '["High school diploma or GED", "Basic accounting knowledge", "Ross Tax and Bookkeeping textbook required"]',
    1,
    1
);

-- Insert sample courses for programs
INSERT OR IGNORE INTO lms_courses (id, program_id, course_code, course_name, description, credit_hours, learning_objectives) VALUES
    ('course_tax101', 'prog_aa_acct', 'TAX101', 'Fundamentals of Tax Preparation', 'Introduction to individual tax return preparation and IRS regulations.', 3, '["Understand Form 1040", "Apply tax law basics", "Use tax software"]'),
    ('course_acct101', 'prog_aa_acct', 'ACCT101', 'Financial Accounting Principles', 'Fundamental principles of financial accounting and bookkeeping.', 3, '["Understand debits and credits", "Prepare financial statements", "Analyze accounts"]'),
    ('course_tax201', 'prog_ba_tax', 'TAX201', 'Advanced Individual Taxation', 'Advanced topics in individual taxation including itemized deductions and credits.', 3, '["Master Schedule A", "Calculate tax credits", "Optimize deductions"]'),
    ('course_tax301', 'prog_ba_tax', 'TAX301', 'Business Taxation', 'Taxation of business entities including partnerships, S-corps, and C-corporations.', 3, '["Prepare Form 1120", "Understand entity taxation", "Calculate business income"]'),
    ('course_audit101', 'prog_cpa1', 'AUDIT101', 'Auditing Fundamentals', 'Introduction to auditing standards and procedures.', 3, '["Apply audit standards", "Perform audit procedures", "Document findings"]'),
    ('course_ethics101', 'prog_cpa2', 'ETHICS101', 'Professional Ethics for CPAs', 'Ethical standards and professional responsibility for accounting professionals.', 3, '["Apply ethical standards", "Understand professional conduct", "Handle ethical dilemmas"]'),
    ('course_tax150', 'prog_tax_practitioner', 'TAX150', 'Tax Practitioner Bootcamp', 'Intensive training for tax practitioners covering all aspects of tax preparation.', 5, '["Prepare complete tax returns", "Handle IRS correspondence", "Serve clients professionally"]');
