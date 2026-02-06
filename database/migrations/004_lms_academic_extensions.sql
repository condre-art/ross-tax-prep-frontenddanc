-- Ross Tax Prep LMS - Extended Academic Features
-- Migration: 004_lms_academic_extensions.sql
-- Adds lesson plans, evaluations, proctored exams, study groups, AI personas

-- Lesson Plans table: Detailed lesson planning for courses
CREATE TABLE IF NOT EXISTS lms_lesson_plans (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    lesson_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    learning_objectives TEXT, -- JSON array of specific objectives
    duration_minutes INTEGER DEFAULT 60,
    lesson_type TEXT CHECK(lesson_type IN ('lecture', 'discussion', 'lab', 'workshop', 'guest_speaker', 'field_study', 'case_study', 'review')),
    required_readings TEXT, -- JSON array of readings
    required_materials TEXT, -- JSON array of materials needed
    activities TEXT, -- JSON array of activities
    homework_assigned TEXT, -- Reference to assignment IDs
    due_date TEXT,
    sequence_order INTEGER NOT NULL DEFAULT 0,
    is_published INTEGER DEFAULT 0,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (course_id) REFERENCES lms_courses(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES lms_staff(id)
);

-- Syllabuses table: Comprehensive course syllabi
CREATE TABLE IF NOT EXISTS lms_syllabuses (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    semester TEXT NOT NULL,
    instructor_id TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    course_description TEXT NOT NULL,
    learning_outcomes TEXT NOT NULL, -- JSON array
    grading_policy TEXT NOT NULL, -- JSON grading breakdown
    attendance_policy TEXT,
    late_work_policy TEXT,
    academic_integrity_policy TEXT,
    required_textbooks TEXT, -- JSON array
    recommended_materials TEXT, -- JSON array
    office_hours TEXT, -- JSON schedule
    course_calendar TEXT, -- JSON week-by-week breakdown
    assessment_methods TEXT, -- JSON array
    accessibility_statement TEXT,
    is_published INTEGER DEFAULT 0,
    published_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (course_id) REFERENCES lms_courses(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES lms_staff(id)
);

-- Lectures table: Individual lecture content and materials
CREATE TABLE IF NOT EXISTS lms_lectures (
    id TEXT PRIMARY KEY,
    lesson_plan_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    lecture_date TEXT,
    lecture_type TEXT CHECK(lecture_type IN ('live', 'recorded', 'hybrid', 'self_paced')),
    video_url TEXT, -- URL to recorded lecture video
    slides_url TEXT, -- URL to presentation slides
    notes_url TEXT, -- URL to lecture notes
    transcript_text TEXT, -- Full transcript of lecture
    duration_minutes INTEGER,
    attendance_required INTEGER DEFAULT 1,
    recording_available INTEGER DEFAULT 1,
    is_published INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (lesson_plan_id) REFERENCES lms_lesson_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES lms_courses(id) ON DELETE CASCADE
);

-- Quizzes table: Detailed quiz definitions
CREATE TABLE IF NOT EXISTS lms_quizzes (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    quiz_type TEXT CHECK(quiz_type IN ('practice', 'graded', 'midterm', 'final', 'pop_quiz')),
    time_limit_minutes INTEGER,
    passing_score REAL DEFAULT 70.0,
    points_possible INTEGER NOT NULL DEFAULT 100,
    attempts_allowed INTEGER DEFAULT 1,
    show_correct_answers INTEGER DEFAULT 0, -- After submission
    randomize_questions INTEGER DEFAULT 0,
    available_from TEXT,
    available_until TEXT,
    is_proctored INTEGER DEFAULT 0,
    proctoring_type TEXT CHECK(proctoring_type IN ('none', 'browser_lockdown', 'webcam', 'live_proctor', 'ai_proctor')),
    instructions TEXT,
    is_published INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (course_id) REFERENCES lms_courses(id) ON DELETE CASCADE
);

-- Quiz Questions table
CREATE TABLE IF NOT EXISTS lms_quiz_questions (
    id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL,
    question_text TEXT NOT NULL,
    question_type TEXT CHECK(question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay', 'matching', 'fill_blank')),
    points INTEGER NOT NULL DEFAULT 1,
    correct_answer TEXT, -- JSON for correct answer(s)
    answer_choices TEXT, -- JSON array for multiple choice
    explanation TEXT, -- Explanation of correct answer
    difficulty TEXT CHECK(difficulty IN ('easy', 'medium', 'hard')),
    question_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (quiz_id) REFERENCES lms_quizzes(id) ON DELETE CASCADE
);

-- Quiz Attempts table: Student quiz submissions
CREATE TABLE IF NOT EXISTS lms_quiz_attempts (
    id TEXT PRIMARY KEY,
    quiz_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    submitted_at TEXT,
    time_taken_minutes INTEGER,
    score REAL,
    percentage REAL,
    answers TEXT, -- JSON object of question_id: student_answer
    is_graded INTEGER DEFAULT 0,
    graded_by TEXT,
    graded_at TEXT,
    proctor_session_id TEXT, -- For proctored exams
    proctor_verification TEXT, -- JSON verification data
    flagged_for_review INTEGER DEFAULT 0,
    review_notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (quiz_id) REFERENCES lms_quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (graded_by) REFERENCES lms_staff(id)
);

-- Proctored Exams table: Proctoring sessions and monitoring
CREATE TABLE IF NOT EXISTS lms_proctored_exams (
    id TEXT PRIMARY KEY,
    quiz_attempt_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    exam_type TEXT NOT NULL CHECK(exam_type IN ('midterm', 'final', 'comprehensive', 'thesis_defense')),
    proctoring_method TEXT NOT NULL CHECK(proctoring_method IN ('browser_lockdown', 'webcam', 'live_proctor', 'ai_proctor')),
    proctor_id TEXT, -- Live proctor staff member
    session_start TEXT NOT NULL,
    session_end TEXT,
    webcam_recording_url TEXT,
    screen_recording_url TEXT,
    identity_verified INTEGER DEFAULT 0,
    identity_verification_method TEXT,
    suspicious_activity_detected INTEGER DEFAULT 0,
    activity_log TEXT, -- JSON log of activities
    violations TEXT, -- JSON array of detected violations
    proctor_notes TEXT,
    final_verification_status TEXT CHECK(final_verification_status IN ('verified', 'suspicious', 'flagged', 'invalidated')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (quiz_attempt_id) REFERENCES lms_quiz_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (proctor_id) REFERENCES lms_staff(id)
);

-- Thesis Projects table
CREATE TABLE IF NOT EXISTS lms_thesis_projects (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    program_id TEXT NOT NULL,
    title TEXT NOT NULL,
    topic_area TEXT,
    description TEXT,
    advisor_id TEXT NOT NULL,
    committee_members TEXT, -- JSON array of staff IDs
    proposal_status TEXT DEFAULT 'draft' CHECK(proposal_status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected')),
    defense_status TEXT DEFAULT 'not_scheduled' CHECK(defense_status IN ('not_scheduled', 'scheduled', 'completed', 'passed', 'failed')),
    proposal_submitted_date TEXT,
    proposal_approved_date TEXT,
    defense_date TEXT,
    defense_location TEXT,
    final_grade TEXT,
    abstract TEXT,
    keywords TEXT, -- JSON array
    document_url TEXT,
    is_published INTEGER DEFAULT 0,
    publication_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (program_id) REFERENCES lms_programs(id),
    FOREIGN KEY (advisor_id) REFERENCES lms_staff(id)
);

-- Case Studies table
CREATE TABLE IF NOT EXISTS lms_case_studies (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    industry TEXT,
    difficulty_level TEXT CHECK(difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    scenario TEXT NOT NULL, -- Full case study scenario
    questions TEXT, -- JSON array of discussion questions
    learning_objectives TEXT, -- JSON array
    required_readings TEXT, -- JSON array of related materials
    suggested_approach TEXT, -- Teaching guide
    sample_solution TEXT, -- Sample analysis/solution
    is_published INTEGER DEFAULT 0,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (course_id) REFERENCES lms_courses(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES lms_staff(id)
);

-- Study Groups table
CREATE TABLE IF NOT EXISTS lms_study_groups (
    id TEXT PRIMARY KEY,
    course_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    group_type TEXT CHECK(group_type IN ('course_specific', 'subject_area', 'exam_prep', 'thesis', 'general')),
    max_members INTEGER DEFAULT 10,
    current_member_count INTEGER DEFAULT 0,
    meeting_schedule TEXT, -- JSON schedule
    meeting_location TEXT, -- Virtual room link
    is_public INTEGER DEFAULT 1,
    requires_approval INTEGER DEFAULT 0,
    facilitator_id TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (course_id) REFERENCES lms_courses(id) ON DELETE SET NULL,
    FOREIGN KEY (facilitator_id) REFERENCES users(id)
);

-- Study Group Members table
CREATE TABLE IF NOT EXISTS lms_study_group_members (
    id TEXT PRIMARY KEY,
    study_group_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT DEFAULT 'member' CHECK(role IN ('member', 'facilitator', 'moderator')),
    joined_date TEXT NOT NULL DEFAULT (datetime('now')),
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (study_group_id) REFERENCES lms_study_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(study_group_id, user_id)
);

-- Evaluations table: Course and instructor evaluations
CREATE TABLE IF NOT EXISTS lms_evaluations (
    id TEXT PRIMARY KEY,
    evaluation_type TEXT NOT NULL CHECK(evaluation_type IN ('course', 'instructor', 'program', 'peer')),
    course_id TEXT,
    instructor_id TEXT,
    program_id TEXT,
    semester TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    questions TEXT NOT NULL, -- JSON array of evaluation questions
    is_anonymous INTEGER DEFAULT 1,
    is_published INTEGER DEFAULT 0,
    available_from TEXT,
    available_until TEXT,
    response_count INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (course_id) REFERENCES lms_courses(id) ON DELETE CASCADE,
    FOREIGN KEY (instructor_id) REFERENCES lms_staff(id) ON DELETE CASCADE,
    FOREIGN KEY (program_id) REFERENCES lms_programs(id) ON DELETE CASCADE
);

-- Evaluation Responses table
CREATE TABLE IF NOT EXISTS lms_evaluation_responses (
    id TEXT PRIMARY KEY,
    evaluation_id TEXT NOT NULL,
    respondent_id TEXT, -- NULL if anonymous
    responses TEXT NOT NULL, -- JSON object of question_id: answer
    comments TEXT,
    submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (evaluation_id) REFERENCES lms_evaluations(id) ON DELETE CASCADE,
    FOREIGN KEY (respondent_id) REFERENCES users(id) ON DELETE SET NULL
);

-- AI Professor Personas table: AI-generated staff based on real scholars
CREATE TABLE IF NOT EXISTS lms_ai_personas (
    id TEXT PRIMARY KEY,
    staff_id TEXT NOT NULL,
    persona_name TEXT NOT NULL,
    based_on_scholar TEXT, -- Real scholar this AI is modeled after
    scholar_biography TEXT,
    teaching_style TEXT, -- e.g., "Socratic", "Lecture-based", "Interactive"
    personality_traits TEXT, -- JSON array of traits
    expertise_areas TEXT, -- JSON array of specializations
    communication_style TEXT,
    response_patterns TEXT, -- JSON templates for AI responses
    knowledge_base TEXT, -- JSON references to scholarly works
    interaction_preferences TEXT, -- JSON preferences for student interaction
    ai_model_version TEXT, -- Which AI model powers this persona
    training_data_sources TEXT, -- JSON list of training sources
    ethical_guidelines TEXT, -- JSON guidelines for AI behavior
    is_active INTEGER DEFAULT 1,
    activation_date TEXT NOT NULL DEFAULT (datetime('now')),
    last_updated TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (staff_id) REFERENCES lms_staff(id) ON DELETE CASCADE
);

-- LMS Roles table: Enhanced role definitions for LMS
CREATE TABLE IF NOT EXISTS lms_roles (
    id TEXT PRIMARY KEY,
    role_name TEXT UNIQUE NOT NULL,
    role_type TEXT CHECK(role_type IN ('student', 'instructor', 'ta', 'advisor', 'registrar', 'dean', 'admin')),
    permissions TEXT NOT NULL, -- JSON array of permissions
    can_enroll_courses INTEGER DEFAULT 0,
    can_create_courses INTEGER DEFAULT 0,
    can_grade_assignments INTEGER DEFAULT 0,
    can_manage_students INTEGER DEFAULT 0,
    can_view_transcripts INTEGER DEFAULT 0,
    can_issue_certificates INTEGER DEFAULT 0,
    can_manage_staff INTEGER DEFAULT 0,
    can_create_evaluations INTEGER DEFAULT 0,
    can_proctor_exams INTEGER DEFAULT 0,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- User Role Assignments table: Map users to LMS roles
CREATE TABLE IF NOT EXISTS lms_user_roles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    role_id TEXT NOT NULL,
    assigned_date TEXT NOT NULL DEFAULT (datetime('now')),
    assigned_by TEXT,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES lms_roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id),
    UNIQUE(user_id, role_id)
);

-- Task Triggers table: Automated task creation based on events
CREATE TABLE IF NOT EXISTS lms_task_triggers (
    id TEXT PRIMARY KEY,
    trigger_name TEXT NOT NULL,
    trigger_type TEXT NOT NULL CHECK(trigger_type IN ('enrollment', 'assignment_due', 'grade_posted', 'course_start', 'course_end', 'exam_scheduled', 'evaluation_open', 'deadline_approaching')),
    trigger_condition TEXT NOT NULL, -- JSON condition definition
    action_type TEXT NOT NULL CHECK(action_type IN ('create_task', 'send_notification', 'update_status', 'assign_role', 'schedule_meeting')),
    action_params TEXT NOT NULL, -- JSON parameters for action
    target_role TEXT, -- Role to receive action
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Triggered Tasks table: Tasks created by triggers
CREATE TABLE IF NOT EXISTS lms_triggered_tasks (
    id TEXT PRIMARY KEY,
    trigger_id TEXT NOT NULL,
    user_id TEXT NOT NULL, -- User assigned to task
    task_type TEXT NOT NULL,
    task_title TEXT NOT NULL,
    task_description TEXT,
    due_date TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    related_entity_type TEXT, -- 'course', 'assignment', 'exam', etc.
    related_entity_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT,
    FOREIGN KEY (trigger_id) REFERENCES lms_task_triggers(id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Update courses table to distinguish core vs elective
ALTER TABLE lms_courses ADD COLUMN course_category TEXT DEFAULT 'core' CHECK(course_category IN ('core', 'elective', 'required', 'optional'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lms_lesson_plans_course_id ON lms_lesson_plans(course_id);
CREATE INDEX IF NOT EXISTS idx_lms_syllabuses_course_id ON lms_syllabuses(course_id);
CREATE INDEX IF NOT EXISTS idx_lms_lectures_course_id ON lms_lectures(course_id);
CREATE INDEX IF NOT EXISTS idx_lms_quizzes_course_id ON lms_quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_lms_quiz_attempts_student_id ON lms_quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_lms_proctored_exams_student_id ON lms_proctored_exams(student_id);
CREATE INDEX IF NOT EXISTS idx_lms_thesis_projects_student_id ON lms_thesis_projects(student_id);
CREATE INDEX IF NOT EXISTS idx_lms_case_studies_course_id ON lms_case_studies(course_id);
CREATE INDEX IF NOT EXISTS idx_lms_study_groups_course_id ON lms_study_groups(course_id);
CREATE INDEX IF NOT EXISTS idx_lms_evaluations_course_id ON lms_evaluations(course_id);
CREATE INDEX IF NOT EXISTS idx_lms_ai_personas_staff_id ON lms_ai_personas(staff_id);
CREATE INDEX IF NOT EXISTS idx_lms_user_roles_user_id ON lms_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_lms_triggered_tasks_user_id ON lms_triggered_tasks(user_id);

-- Insert default LMS roles
INSERT OR IGNORE INTO lms_roles (id, role_name, role_type, permissions, can_enroll_courses, can_view_transcripts) VALUES
    ('lms_role_student', 'Student', 'student', 
     '["view_courses", "enroll_course", "submit_assignment", "take_quiz", "view_grades", "join_study_group", "access_lectures"]',
     1, 1),
    ('lms_role_instructor', 'Instructor', 'instructor',
     '["create_course", "grade_assignment", "create_quiz", "manage_students", "create_lecture", "view_evaluations", "manage_syllabus"]',
     0, 0),
    ('lms_role_ta', 'Teaching Assistant', 'ta',
     '["grade_assignment", "assist_students", "create_quiz", "manage_study_groups", "proctor_exam"]',
     0, 0),
    ('lms_role_advisor', 'Academic Advisor', 'advisor',
     '["view_transcripts", "advise_students", "approve_enrollment", "manage_degree_plans"]',
     0, 1),
    ('lms_role_registrar', 'Registrar', 'registrar',
     '["manage_enrollment", "issue_transcripts", "manage_courses", "verify_degrees", "manage_records"]',
     0, 1),
    ('lms_role_dean', 'Dean', 'dean',
     '["manage_programs", "approve_courses", "review_evaluations", "manage_faculty", "approve_degrees"]',
     0, 1),
    ('lms_role_admin', 'LMS Administrator', 'admin',
     '["full_access", "manage_system", "manage_users", "create_roles", "configure_triggers"]',
     1, 1);

-- Insert sample AI personas based on famous scholars
INSERT OR IGNORE INTO lms_ai_personas (id, staff_id, persona_name, based_on_scholar, teaching_style, personality_traits, expertise_areas) VALUES
    ('ai_persona_1', 'staff_ai_001', 'Dr. Smith (AI)', 'Warren Buffett', 'Case-study based with real-world examples',
     '["patient", "practical", "encouraging", "detail-oriented"]',
     '["Business taxation", "Corporate finance", "Tax strategy"]'),
    ('ai_persona_2', 'staff_ai_002', 'Prof. Johnson (AI)', 'Janet Yellen', 'Interactive and policy-focused',
     '["analytical", "thoughtful", "precise", "supportive"]',
     '["Tax policy", "Government accounting", "Economic analysis"]'),
    ('ai_persona_3', 'staff_ai_003', 'Dr. Williams (AI)', 'Benjamin Graham', 'Fundamental principles approach',
     '["methodical", "thorough", "challenging", "inspirational"]',
     '["Accounting principles", "Financial analysis", "Tax fundamentals"]');

-- Insert default task triggers for common scenarios
INSERT OR IGNORE INTO lms_task_triggers (id, trigger_name, trigger_type, trigger_condition, action_type, action_params, target_role) VALUES
    ('trigger_001', 'New Enrollment Welcome', 'enrollment',
     '{"event": "student_enrolled", "entity": "program"}',
     'create_task',
     '{"task_title": "Complete Orientation", "task_description": "Welcome to the program! Please complete your orientation checklist.", "days_until_due": 7}',
     'student'),
    ('trigger_002', 'Assignment Due Reminder', 'assignment_due',
     '{"event": "assignment_due_soon", "days_before": 3}',
     'send_notification',
     '{"notification_type": "email", "template": "assignment_reminder"}',
     'student'),
    ('trigger_003', 'Grade Posted Notification', 'grade_posted',
     '{"event": "grade_available"}',
     'send_notification',
     '{"notification_type": "email", "template": "grade_posted"}',
     'student'),
    ('trigger_004', 'Course Start Setup', 'course_start',
     '{"event": "course_starting", "days_before": 1}',
     'create_task',
     '{"task_title": "Prepare Course Materials", "task_description": "Review syllabus and prepare for first class", "days_until_due": 1}',
     'student'),
    ('trigger_005', 'Evaluation Request', 'course_end',
     '{"event": "course_ended", "days_after": 1}',
     'create_task',
     '{"task_title": "Complete Course Evaluation", "task_description": "Help us improve by completing the course evaluation", "days_until_due": 7}',
     'student');
