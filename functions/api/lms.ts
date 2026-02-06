/**
 * LMS (Learning Management System) API
 * Handles online university operations including courses, enrollments, transcripts
 * Compatible with Blackboard/Canvas LMS standards
 */

interface Env {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
  JWT_SECRET: string;
}

// Helper to verify authentication
async function verifyAuth(request: Request, env: Env): Promise<any> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }
  
  const token = authHeader.substring(7);
  const session = await env.KV.get(`session:${token}`, 'json');
  
  if (!session) {
    throw new Error('Invalid or expired session');
  }
  
  return session;
}

// GET /api/lms/programs - List all programs
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  try {
    // List all programs
    if (path === '/api/lms/programs') {
      const type = url.searchParams.get('type'); // Filter by type
      const category = url.searchParams.get('category'); // Filter by category
      
      let query = 'SELECT * FROM lms_programs WHERE is_active = 1';
      const params: any[] = [];
      
      if (type) {
        query += ' AND type = ?';
        params.push(type);
      }
      
      if (category) {
        query += ' AND category = ?';
        params.push(category);
      }
      
      query += ' ORDER BY name';
      
      const { results } = await env.DB.prepare(query).bind(...params).all();
      
      return new Response(JSON.stringify({
        success: true,
        programs: results
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get specific program details
    if (path.match(/\/api\/lms\/programs\/[^/]+$/)) {
      const programId = path.split('/').pop();
      
      const program = await env.DB.prepare(
        'SELECT * FROM lms_programs WHERE id = ? AND is_active = 1'
      ).bind(programId).first();
      
      if (!program) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Program not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Get courses for this program
      const { results: courses } = await env.DB.prepare(
        'SELECT * FROM lms_courses WHERE program_id = ? AND is_active = 1 ORDER BY course_code'
      ).bind(programId).all();
      
      return new Response(JSON.stringify({
        success: true,
        program,
        courses
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // List all courses
    if (path === '/api/lms/courses') {
      const programId = url.searchParams.get('program_id');
      const courseCode = url.searchParams.get('code');
      
      let query = 'SELECT * FROM lms_courses WHERE is_active = 1';
      const params: any[] = [];
      
      if (programId) {
        query += ' AND program_id = ?';
        params.push(programId);
      }
      
      if (courseCode) {
        query += ' AND course_code = ?';
        params.push(courseCode);
      }
      
      query += ' ORDER BY course_code';
      
      const { results } = await env.DB.prepare(query).bind(...params).all();
      
      return new Response(JSON.stringify({
        success: true,
        courses: results
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get course details
    if (path.match(/\/api\/lms\/courses\/[^/]+$/)) {
      const courseId = path.split('/').pop();
      
      const course = await env.DB.prepare(
        'SELECT * FROM lms_courses WHERE id = ? AND is_active = 1'
      ).bind(courseId).first();
      
      if (!course) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Course not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Get assignments for this course
      const { results: assignments } = await env.DB.prepare(
        'SELECT * FROM lms_assignments WHERE course_id = ? ORDER BY due_date'
      ).bind(courseId).all();
      
      // Get schedule for this course
      const { results: schedule } = await env.DB.prepare(
        'SELECT * FROM lms_schedule WHERE course_id = ? AND is_active = 1 ORDER BY day_of_week, start_time'
      ).bind(courseId).all();
      
      return new Response(JSON.stringify({
        success: true,
        course,
        assignments,
        schedule
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get student enrollments
    if (path === '/api/lms/enrollments') {
      const session = await verifyAuth(request, env);
      const studentId = session.userId;
      
      const { results: enrollments } = await env.DB.prepare(`
        SELECT 
          e.*,
          p.name as program_name,
          p.code as program_code,
          p.type as program_type,
          p.credits_required as program_credits_required
        FROM lms_enrollments e
        JOIN lms_programs p ON e.program_id = p.id
        WHERE e.student_id = ?
        ORDER BY e.enrollment_date DESC
      `).bind(studentId).all();
      
      return new Response(JSON.stringify({
        success: true,
        enrollments
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get student's course enrollments
    if (path === '/api/lms/course-enrollments') {
      const session = await verifyAuth(request, env);
      const studentId = session.userId;
      const semester = url.searchParams.get('semester');
      
      let query = `
        SELECT 
          ce.*,
          c.course_code,
          c.course_name,
          c.credit_hours,
          s.first_name as instructor_first_name,
          s.last_name as instructor_last_name
        FROM lms_course_enrollments ce
        JOIN lms_courses c ON ce.course_id = c.id
        LEFT JOIN lms_staff staff ON ce.instructor_id = staff.id
        LEFT JOIN users s ON staff.user_id = s.id
        WHERE ce.student_id = ?
      `;
      const params: any[] = [studentId];
      
      if (semester) {
        query += ' AND ce.semester = ?';
        params.push(semester);
      }
      
      query += ' ORDER BY ce.semester DESC, c.course_code';
      
      const { results } = await env.DB.prepare(query).bind(...params).all();
      
      return new Response(JSON.stringify({
        success: true,
        course_enrollments: results
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get transcripts
    if (path === '/api/lms/transcripts') {
      const session = await verifyAuth(request, env);
      const studentId = session.userId;
      
      const { results: transcripts } = await env.DB.prepare(`
        SELECT 
          t.*,
          p.name as program_name,
          p.code as program_code
        FROM lms_transcripts t
        JOIN lms_programs p ON t.program_id = p.id
        WHERE t.student_id = ?
        ORDER BY t.issue_date DESC
      `).bind(studentId).all();
      
      return new Response(JSON.stringify({
        success: true,
        transcripts
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get staff directory
    if (path === '/api/lms/staff') {
      const department = url.searchParams.get('department');
      const staffType = url.searchParams.get('type');
      
      let query = `
        SELECT 
          s.*,
          u.first_name,
          u.last_name,
          u.email
        FROM lms_staff s
        JOIN users u ON s.user_id = u.id
        WHERE s.is_active = 1
      `;
      const params: any[] = [];
      
      if (department) {
        query += ' AND s.department = ?';
        params.push(department);
      }
      
      if (staffType) {
        query += ' AND s.staff_type = ?';
        params.push(staffType);
      }
      
      query += ' ORDER BY s.title, u.last_name';
      
      const { results } = await env.DB.prepare(query).bind(...params).all();
      
      return new Response(JSON.stringify({
        success: true,
        staff: results
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get announcements
    if (path === '/api/lms/announcements') {
      const announcementType = url.searchParams.get('type') || 'university';
      const courseId = url.searchParams.get('course_id');
      const programId = url.searchParams.get('program_id');
      
      let query = `
        SELECT 
          a.*,
          u.first_name as author_first_name,
          u.last_name as author_last_name
        FROM lms_announcements a
        JOIN users u ON a.author_id = u.id
        WHERE a.is_active = 1
          AND (a.expiry_date IS NULL OR a.expiry_date > datetime('now'))
      `;
      const params: any[] = [];
      
      if (announcementType && announcementType !== 'all') {
        query += ' AND a.announcement_type = ?';
        params.push(announcementType);
      }
      
      if (courseId) {
        query += ' AND (a.course_id = ? OR a.announcement_type = "university")';
        params.push(courseId);
      }
      
      if (programId) {
        query += ' AND (a.program_id = ? OR a.announcement_type = "university")';
        params.push(programId);
      }
      
      query += ' ORDER BY a.is_pinned DESC, a.publish_date DESC LIMIT 50';
      
      const { results } = await env.DB.prepare(query).bind(...params).all();
      
      return new Response(JSON.stringify({
        success: true,
        announcements: results
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Not found'
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: error.message === 'Unauthorized' ? 401 : 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/lms/* - Create resources
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  try {
    const session = await verifyAuth(request, env);
    const body = await request.json() as any;

    // Enroll in a program
    if (path === '/api/lms/enrollments') {
      const enrollmentId = `enroll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Check if program exists and is active
      const program = await env.DB.prepare(
        'SELECT * FROM lms_programs WHERE id = ? AND is_active = 1'
      ).bind(body.program_id).first();
      
      if (!program) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Program not found or inactive'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Calculate expected graduation date
      const enrollmentDate = new Date();
      const expectedGradDate = new Date(enrollmentDate);
      expectedGradDate.setMonth(expectedGradDate.getMonth() + (program.duration_months as number));
      
      await env.DB.prepare(`
        INSERT INTO lms_enrollments (
          id, student_id, program_id, enrollment_status, 
          enrollment_date, expected_graduation_date, 
          credits_required, payment_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        enrollmentId,
        session.userId,
        body.program_id,
        'active',
        enrollmentDate.toISOString(),
        expectedGradDate.toISOString(),
        program.credit_hours,
        body.payment_status || 'pending'
      ).run();
      
      return new Response(JSON.stringify({
        success: true,
        enrollment_id: enrollmentId,
        message: 'Successfully enrolled in program'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Enroll in a course
    if (path === '/api/lms/course-enrollments') {
      const courseEnrollmentId = `cenroll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await env.DB.prepare(`
        INSERT INTO lms_course_enrollments (
          id, student_id, course_id, semester, 
          enrollment_status, enrolled_date
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        courseEnrollmentId,
        session.userId,
        body.course_id,
        body.semester,
        'enrolled',
        new Date().toISOString()
      ).run();
      
      return new Response(JSON.stringify({
        success: true,
        course_enrollment_id: courseEnrollmentId,
        message: 'Successfully enrolled in course'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Submit an assignment
    if (path === '/api/lms/submissions') {
      const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Check if assignment exists
      const assignment = await env.DB.prepare(
        'SELECT * FROM lms_assignments WHERE id = ?'
      ).bind(body.assignment_id).first();
      
      if (!assignment) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Assignment not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const submissionDate = new Date();
      const isLate = assignment.due_date && submissionDate > new Date(assignment.due_date as string);
      
      await env.DB.prepare(`
        INSERT INTO lms_submissions (
          id, assignment_id, student_id, submission_date,
          submission_text, file_path, is_late, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        submissionId,
        body.assignment_id,
        session.userId,
        submissionDate.toISOString(),
        body.submission_text || null,
        body.file_path || null,
        isLate ? 1 : 0,
        'submitted'
      ).run();
      
      return new Response(JSON.stringify({
        success: true,
        submission_id: submissionId,
        is_late: isLate,
        message: 'Assignment submitted successfully'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Request official transcript
    if (path === '/api/lms/transcripts') {
      const transcriptId = `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Get student's enrollment data
      const enrollment = await env.DB.prepare(
        'SELECT * FROM lms_enrollments WHERE student_id = ? AND program_id = ?'
      ).bind(session.userId, body.program_id).first();
      
      if (!enrollment) {
        return new Response(JSON.stringify({
          success: false,
          error: 'No enrollment found for this program'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      await env.DB.prepare(`
        INSERT INTO lms_transcripts (
          id, student_id, program_id, issue_date,
          transcript_type, cumulative_gpa, total_credits_earned,
          total_credits_attempted, requested_by, delivery_method
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        transcriptId,
        session.userId,
        body.program_id,
        new Date().toISOString(),
        body.transcript_type || 'unofficial',
        enrollment.gpa || 0.0,
        enrollment.credits_completed || 0,
        enrollment.credits_completed || 0,
        session.userId,
        body.delivery_method || 'electronic'
      ).run();
      
      return new Response(JSON.stringify({
        success: true,
        transcript_id: transcriptId,
        message: 'Transcript request processed successfully'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Not found'
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: error.message === 'Unauthorized' ? 401 : 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
