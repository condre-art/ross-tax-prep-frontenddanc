'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Program {
  id: string;
  name: string;
  code: string;
  type: string;
  duration_months: number;
  cost_usd: number;
  textbook_cost_usd: number;
}

export default function EnrollmentApplication() {
  const [step, setStep] = useState(1);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    ssn: '',
    
    // Address
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    
    // Academic Information
    programId: '',
    fastTrack: false,
    startSemester: 'Fall 2026',
    educationLevel: '',
    priorInstitution: '',
    gpa: '',
    
    // Professional Information
    currentEmployment: '',
    workExperience: '',
    taxExperience: '',
    certifications: '',
    
    // Financial
    paymentPlan: 'full',
    financialAid: false,
    
    // Additional
    howHeardAbout: '',
    goals: '',
    agreeToTerms: false,
    agreeToTextbook: false
  });

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/lms/programs');
      const data = await response.json();
      if (data.success) {
        setPrograms(data.programs);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // First create user account
      const userResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: 'temp_' + Math.random().toString(36), // Will be reset
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          date_of_birth: formData.dateOfBirth,
          address_line1: formData.addressLine1,
          address_line2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zipCode,
          role: 'client', // Will be upgraded to student
          ssn_encrypted: formData.ssn
        })
      });

      const userData = await userResponse.json();
      
      if (userData.success) {
        // Then create enrollment
        const enrollmentResponse = await fetch('/api/lms/enrollments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userData.token}`
          },
          body: JSON.stringify({
            program_id: formData.programId,
            payment_status: formData.paymentPlan === 'full' ? 'pending' : 'partial',
            additional_info: {
              fast_track: formData.fastTrack,
              start_semester: formData.startSemester,
              prior_education: {
                level: formData.educationLevel,
                institution: formData.priorInstitution,
                gpa: formData.gpa
              },
              professional: {
                employment: formData.currentEmployment,
                work_experience: formData.workExperience,
                tax_experience: formData.taxExperience,
                certifications: formData.certifications
              },
              goals: formData.goals,
              referral: formData.howHeardAbout
            }
          })
        });

        const enrollmentData = await enrollmentResponse.json();
        
        if (enrollmentData.success) {
          alert('Application submitted successfully! Check your email for next steps.');
          window.location.href = '/lms/portal';
        }
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Error submitting application. Please try again.');
    }
  };

  const selectedProgram = programs.find(p => p.id === formData.programId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Link href="/lms" className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
            ← Back to Programs
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Enrollment Application</h1>
          <p className="text-gray-600 mt-1">Ross Tax Prep University</p>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= s ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {s}
              </div>
              {s < 4 && (
                <div className={`flex-1 h-1 mx-2 ${
                  step > s ? 'bg-blue-600' : 'bg-gray-300'
                }`}></div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between text-sm text-gray-600 mb-8">
          <span>Program Selection</span>
          <span>Personal Info</span>
          <span>Academic Info</span>
          <span>Review & Submit</span>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-5xl mx-auto px-4 pb-12">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
          
          {/* Step 1: Program Selection */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Select Your Program</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Program *
                </label>
                <select
                  name="programId"
                  value={formData.programId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a program...</option>
                  {programs.map(program => (
                    <option key={program.id} value={program.id}>
                      {program.name} ({program.code}) - {program.duration_months} months
                    </option>
                  ))}
                </select>
              </div>

              {selectedProgram && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <h3 className="font-semibold text-lg mb-2">{selectedProgram.name}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Duration:</span>
                      <span className="ml-2 font-semibold">{selectedProgram.duration_months} months</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Tuition:</span>
                      <span className="ml-2 font-semibold">${selectedProgram.cost_usd.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Textbook:</span>
                      <span className="ml-2 font-semibold">${selectedProgram.textbook_cost_usd}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total:</span>
                      <span className="ml-2 font-semibold text-green-600">
                        ${(selectedProgram.cost_usd + selectedProgram.textbook_cost_usd).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="fastTrack"
                    checked={formData.fastTrack}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span className="text-sm">
                    I'm interested in the <strong>Fast Track</strong> accelerated program option
                  </span>
                </label>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Start Semester *
                </label>
                <select
                  name="startSemester"
                  value={formData.startSemester}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Fall 2026">Fall 2026</option>
                  <option value="Spring 2027">Spring 2027</option>
                  <option value="Summer 2027">Summer 2027</option>
                </select>
              </div>

              <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    name="agreeToTextbook"
                    checked={formData.agreeToTextbook}
                    onChange={handleChange}
                    required
                    className="mr-3 mt-1"
                  />
                  <span className="text-sm">
                    <strong>I understand and agree</strong> that the <strong>Ross Tax and Bookkeeping textbook</strong> is 
                    required for all programs and must be purchased for ${selectedProgram?.textbook_cost_usd || 299}.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Step 2: Personal Information */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Personal Information</h2>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (School Email) *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">This will become your school email address</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SSN (for records) *
                  </label>
                  <input
                    type="password"
                    name="ssn"
                    value={formData.ssn}
                    onChange={handleChange}
                    required
                    placeholder="XXX-XX-XXXX"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-4">Address</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apt/Suite (Optional)
                </label>
                <input
                  type="text"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    maxLength={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Academic & Professional Info */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Academic & Professional Background</h2>
              
              <h3 className="text-lg font-semibold mb-4">Education History</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Highest Education Level *
                </label>
                <select
                  name="educationLevel"
                  value={formData.educationLevel}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="high_school">High School Diploma/GED</option>
                  <option value="some_college">Some College</option>
                  <option value="associates">Associate Degree</option>
                  <option value="bachelors">Bachelor's Degree</option>
                  <option value="masters">Master's Degree</option>
                  <option value="doctorate">Doctorate</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prior Institution
                  </label>
                  <input
                    type="text"
                    name="priorInstitution"
                    value={formData.priorInstitution}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GPA (if applicable)
                  </label>
                  <input
                    type="text"
                    name="gpa"
                    value={formData.gpa}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-4 mt-8">Professional Experience</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Employment Status
                </label>
                <select
                  name="currentEmployment"
                  value={formData.currentEmployment}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="employed_full">Employed Full-Time</option>
                  <option value="employed_part">Employed Part-Time</option>
                  <option value="self_employed">Self-Employed</option>
                  <option value="unemployed">Unemployed</option>
                  <option value="student">Full-Time Student</option>
                  <option value="retired">Retired</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Work Experience
                </label>
                <input
                  type="text"
                  name="workExperience"
                  value={formData.workExperience}
                  onChange={handleChange}
                  placeholder="e.g., 5 years in accounting"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax/Accounting Experience
                </label>
                <textarea
                  name="taxExperience"
                  value={formData.taxExperience}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describe any tax preparation or accounting experience..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Certifications (if any)
                </label>
                <input
                  type="text"
                  name="certifications"
                  value={formData.certifications}
                  onChange={handleChange}
                  placeholder="e.g., PTIN, EA, CPA candidate"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Career Goals
                </label>
                <textarea
                  name="goals"
                  value={formData.goals}
                  onChange={handleChange}
                  rows={4}
                  placeholder="What do you hope to achieve with this program?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How did you hear about us?
                </label>
                <select
                  name="howHeardAbout"
                  value={formData.howHeardAbout}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="search_engine">Search Engine</option>
                  <option value="social_media">Social Media</option>
                  <option value="referral">Friend/Colleague Referral</option>
                  <option value="advertisement">Advertisement</option>
                  <option value="professional_org">Professional Organization</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Review Your Application</h2>
              
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-3">Program Selection</h3>
                  <p><strong>Program:</strong> {selectedProgram?.name}</p>
                  <p><strong>Start:</strong> {formData.startSemester}</p>
                  <p><strong>Fast Track:</strong> {formData.fastTrack ? 'Yes' : 'No'}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-3">Personal Information</h3>
                  <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
                  <p><strong>Email:</strong> {formData.email}</p>
                  <p><strong>Phone:</strong> {formData.phone}</p>
                  <p><strong>Address:</strong> {formData.addressLine1}, {formData.city}, {formData.state} {formData.zipCode}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-3">Academic Background</h3>
                  <p><strong>Education:</strong> {formData.educationLevel}</p>
                  {formData.priorInstitution && <p><strong>Institution:</strong> {formData.priorInstitution}</p>}
                  {formData.gpa && <p><strong>GPA:</strong> {formData.gpa}</p>}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Plan *
                  </label>
                  <select
                    name="paymentPlan"
                    value={formData.paymentPlan}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="full">Pay in Full (5% discount)</option>
                    <option value="semester">Pay by Semester</option>
                    <option value="monthly">Monthly Payment Plan</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="financialAid"
                      checked={formData.financialAid}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <span className="text-sm">I would like to apply for financial aid</span>
                  </label>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleChange}
                      required
                      className="mr-3 mt-1"
                    />
                    <span className="text-sm">
                      <strong>I certify</strong> that all information provided in this application is true and complete. 
                      I understand that false information may result in denial of admission or dismissal. I agree to the 
                      terms and conditions of enrollment at Ross Tax Prep University, including the requirement to purchase 
                      the Ross Tax and Bookkeeping textbook.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition"
              >
                Previous
              </button>
            )}
            
            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="ml-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                disabled={!formData.programId && step === 1}
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                className="ml-auto px-8 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition"
                disabled={!formData.agreeToTerms}
              >
                Submit Application
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
