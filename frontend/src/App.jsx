import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import * as d3 from 'd3'
import './index.css'

function App() {
  const [activeTab, setActiveTab] = useState('upload')
  const [coursesCSV, setCoursesCSV] = useState('')
  const [enrollmentsCSV, setEnrollmentsCSV] = useState('')
  const [scheduleData, setScheduleData] = useState(null)
  const [algorithm, setAlgorithm] = useState('greedy')

  const handleUpload = async () => {
    try {
      const res1 = await axios.post('http://localhost:8080/api/upload', {
        courses_csv: coursesCSV,
        enrollments_csv: enrollmentsCSV
      });
      if (res1.data.status === 'success') {
        const res2 = await axios.post('http://localhost:8080/api/schedule', {
          algorithm: algorithm,
          max_slots: 10
        });
        setScheduleData(res2.data);
        setActiveTab('timetable');
      }
    } catch (e) {
      console.error(e);
      alert('Error communicating with backend');
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <nav className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-indigo-600">DAA Exam Scheduler</h1>
          <div className="space-x-4">
            <button onClick={() => setActiveTab('upload')} className={`px-4 py-2 rounded-md ${activeTab === 'upload' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100'}`}>Upload</button>
            <button onClick={() => setActiveTab('graph')} className={`px-4 py-2 rounded-md ${activeTab === 'graph' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100'}`} disabled={!scheduleData}>Graph View</button>
            <button onClick={() => setActiveTab('timetable')} className={`px-4 py-2 rounded-md ${activeTab === 'timetable' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100'}`} disabled={!scheduleData}>Timetable</button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6 mt-6">
        {activeTab === 'upload' && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6">Upload Data</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Algorithm</label>
              <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <option value="greedy">Greedy (Welsh-Powell) - Unit 4</option>
                <option value="backtracking">Backtracking (M-Coloring) - Unit 3</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Courses CSV Data</label>
              <textarea 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg h-32 font-mono text-sm"
                placeholder="CourseID,CourseName..."
                value={coursesCSV}
                onChange={(e) => setCoursesCSV(e.target.value)}
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Enrollments CSV Data</label>
              <textarea 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg h-32 font-mono text-sm"
                placeholder="StudentID,CourseID..."
                value={enrollmentsCSV}
                onChange={(e) => setEnrollmentsCSV(e.target.value)}
              />
            </div>

            <button onClick={handleUpload} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-colors">
              Process & Schedule
            </button>
          </div>
        )}

        {activeTab === 'timetable' && scheduleData && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Generated Timetable</h2>
              <div className="text-sm bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full">
                Solved in {scheduleData.execution_time_ms}ms using {scheduleData.algorithm_used}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scheduleData.assignments.map((course, idx) => (
                <div key={idx} className="border border-slate-200 p-4 rounded-xl hover:shadow-md transition-shadow">
                  <div className="text-xs font-bold text-slate-400 mb-1">SLOT {course.slot}</div>
                  <div className="text-lg font-bold text-slate-800">{course.course_id}</div>
                  <div className="text-sm text-slate-600 mb-3">{course.course_name}</div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="bg-slate-100 px-2 py-1 rounded text-slate-600">{course.enrollment} Students</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'graph' && scheduleData && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[500px]">
            <h2 className="text-2xl font-semibold mb-4 text-center">Conflict Graph Visualization</h2>
            <p className="text-slate-500 mb-8">D3.js integration placeholder for {scheduleData.assignments.length} nodes.</p>
            <div className="w-full h-64 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center">
              <span className="text-slate-400">Force-Directed Graph will render here</span>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
