'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Program {
  id: string;
  name: string;
  code: string;
  type: string;
  category: string;
  description: string;
  duration_months: number;
  credit_hours: number;
  cost_usd: number;
  textbook_cost_usd: number;
  textbook_required: number;
  fast_track_available: number;
  distance_learning: number;
}

export default function LMSHome() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    fetchPrograms();
  }, [selectedCategory, selectedType]);

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      let url = '/api/lms/programs?';
      if (selectedCategory !== 'all') url += `category=${selectedCategory}&`;
      if (selectedType !== 'all') url += `type=${selectedType}&`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setPrograms(data.programs);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ross Tax Prep University</h1>
              <p className="text-sm text-gray-600 mt-1">AI-Powered Institution of Learning • Harvard-Quality Education at Affordable Prices</p>
            </div>
            <div className="flex gap-4">
              <Link href="/lms/portal" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Student Portal
              </Link>
              <Link href="/lms/staff" className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
                Staff Login
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4">Welcome to Ross Tax Prep University</h2>
            <p className="text-xl mb-2">Online Distance Learning for Tax Professionals</p>
            <p className="text-lg opacity-90 mb-6">
              Accredited Programs • Fast Track Degrees • AI-Enhanced Learning • Ross Tax and Bookkeeping Textbooks
            </p>
            <div className="flex justify-center gap-4">
              <Link href="#programs" className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition">
                View Programs
              </Link>
              <Link href="/lms/apply" className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition">
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl font-bold text-blue-600">8</div>
            <div className="text-gray-600 mt-2">Degree Programs</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl font-bold text-green-600">100%</div>
            <div className="text-gray-600 mt-2">Online Distance Learning</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl font-bold text-purple-600">6-48</div>
            <div className="text-gray-600 mt-2">Months to Complete</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="text-3xl font-bold text-orange-600">Fast Track</div>
            <div className="text-gray-600 mt-2">Available for All Programs</div>
          </div>
        </div>
      </div>

      {/* Programs Section */}
      <div id="programs" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Academic Programs</h2>
          
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="accounting">Accounting</option>
                <option value="taxation">Taxation</option>
                <option value="business">Business</option>
                <option value="applied_science">Applied Science</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Program Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="associates">Associates Degree</option>
                <option value="bachelors">Bachelors Degree</option>
                <option value="certificate">Certificate</option>
                <option value="diploma">Diploma</option>
                <option value="minor">Minor</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading programs...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => (
              <div key={program.id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4">
                  <div className="text-sm font-semibold uppercase tracking-wide opacity-90">
                    {program.type.replace('_', ' ')}
                  </div>
                  <h3 className="text-xl font-bold mt-1">{program.name}</h3>
                  <div className="text-sm opacity-90 mt-1">{program.code}</div>
                </div>
                
                <div className="p-6">
                  <p className="text-gray-600 text-sm mb-4">{program.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Duration:</span>
                      <span className="font-semibold">{program.duration_months} months</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Credit Hours:</span>
                      <span className="font-semibold">{program.credit_hours}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Tuition:</span>
                      <span className="font-semibold text-green-600">{formatCurrency(program.cost_usd)}</span>
                    </div>
                    {program.textbook_required === 1 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Textbook:</span>
                        <span className="font-semibold">{formatCurrency(program.textbook_cost_usd)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {program.distance_learning === 1 && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Distance Learning</span>
                    )}
                    {program.fast_track_available === 1 && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Fast Track</span>
                    )}
                    {program.textbook_required === 1 && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Textbook Required</span>
                    )}
                  </div>
                  
                  <Link 
                    href={`/lms/programs/${program.id}`}
                    className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Learn More & Apply
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Why Choose Ross Tax Prep University?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Harvard-Quality Education</h3>
              <p className="text-gray-600">AI-enhanced curriculum with world-class tax education at affordable prices</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Accredited Programs</h3>
              <p className="text-gray-600">CPA preparation, tax practitioner certification, and degree programs</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Track Options</h3>
              <p className="text-gray-600">Complete programs in as little as 6 months with accelerated schedules</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Tax Professional Career?</h2>
          <p className="text-xl mb-8">Join thousands of students learning online with Ross Tax Prep University</p>
          <div className="flex justify-center gap-4">
            <Link href="/lms/apply" className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition">
              Apply Now
            </Link>
            <Link href="/lms/contact" className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition">
              Contact Admissions
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Programs</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/lms/programs?type=associates">Associates Degrees</Link></li>
                <li><Link href="/lms/programs?type=bachelors">Bachelors Degrees</Link></li>
                <li><Link href="/lms/programs?type=certificate">Certificates</Link></li>
                <li><Link href="/lms/programs?type=diploma">Diplomas</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Students</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/lms/portal">Student Portal</Link></li>
                <li><Link href="/lms/transcripts">Request Transcripts</Link></li>
                <li><Link href="/lms/textbooks">Purchase Textbooks</Link></li>
                <li><Link href="/lms/schedule">Course Schedule</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Staff</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/lms/staff">Faculty Directory</Link></li>
                <li><Link href="/lms/registrar">Registrar</Link></li>
                <li><Link href="/lms/staff/login">Staff Login</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Email: admissions@rosstaxprep.edu</li>
                <li>Phone: (555) 123-4567</li>
                <li>Online Support 24/7</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2026 Ross Tax Prep University. AI-Powered Institution of Learning. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
