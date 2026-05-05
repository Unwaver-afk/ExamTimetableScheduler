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
  const [maxSlots, setMaxSlots] = useState(10)
  
  const [dragging, setDragging] = useState(false)
  const svgRef = useRef(null)

  const handleUpload = async () => {
    try {
      const res1 = await axios.post('http://localhost:8080/api/upload', {
        courses_csv: coursesCSV,
        enrollments_csv: enrollmentsCSV
      });
      if (res1.data.status === 'success') {
        const res2 = await axios.post('http://localhost:8080/api/schedule', {
          algorithm: algorithm,
          max_slots: parseInt(maxSlots)
        });
        setScheduleData(res2.data);
        if (res2.data.status === 'success') {
          setActiveTab('timetable');
        } else {
          alert(res2.data.message);
        }
      }
    } catch (e) {
      console.error(e);
      alert('Error communicating with backend');
    }
  }

  // D3 Graph rendering
  useEffect(() => {
    if (activeTab === 'graph' && scheduleData?.nodes && svgRef.current) {
      const width = 800;
      const height = 500;
      
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove(); // clear previous
      
      svg.attr("viewBox", [0, 0, width, height]);

      const simulation = d3.forceSimulation(scheduleData.nodes)
          .force("link", d3.forceLink(scheduleData.links).id(d => d.id).distance(100))
          .force("charge", d3.forceManyBody().strength(-300))
          .force("center", d3.forceCenter(width / 2, height / 2));

      const link = svg.append("g")
          .attr("stroke", "#999")
          .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(scheduleData.links)
        .join("line")
          .attr("stroke-width", 2);

      const color = d3.scaleOrdinal(d3.schemeCategory10);

      const node = svg.append("g")
          .attr("stroke", "#fff")
          .attr("stroke-width", 1.5)
        .selectAll("circle")
        .data(scheduleData.nodes)
        .join("circle")
          .attr("r", d => Math.max(10, Math.sqrt(d.enrollment) * 3))
          .attr("fill", d => color(d.group))
          .call(drag(simulation));

      node.append("title")
          .text(d => `${d.id} - ${d.name}\nSlot: ${d.group}\nEnrollment: ${d.enrollment}`);

      simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
      });

      function drag(simulation) {
        function dragstarted(event) {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
        }
        function dragged(event) {
          event.subject.fx = event.x;
          event.subject.fy = event.y;
        }
        function dragended(event) {
          if (!event.active) simulation.alphaTarget(0);
          event.subject.fx = null;
          event.subject.fy = null;
        }
        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
      }
    }
  }, [activeTab, scheduleData]);

  // Drag and drop handlers
  const onDragOver = (e) => { e.preventDefault(); setDragging(true); }
  const onDragLeave = () => { setDragging(false); }
  const onDrop = (e, type) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (type === 'courses') setCoursesCSV(event.target.result);
        if (type === 'enrollments') setEnrollmentsCSV(event.target.result);
      };
      reader.readAsText(file);
    }
  }

  const exportPDF = () => {
      // Basic Frontend PDF export logic placeholder
      alert("PDF Export triggered! (Placeholder for Phase 7 implementation)");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <nav className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-indigo-600">DAA Exam Scheduler</h1>
          <div className="space-x-4">
            <button onClick={() => setActiveTab('upload')} className={`px-4 py-2 rounded-md ${activeTab === 'upload' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100'}`}>Upload</button>
            <button onClick={() => setActiveTab('graph')} className={`px-4 py-2 rounded-md ${activeTab === 'graph' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100'}`} disabled={!scheduleData || scheduleData.status !== 'success'}>Graph View</button>
            <button onClick={() => setActiveTab('timetable')} className={`px-4 py-2 rounded-md ${activeTab === 'timetable' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100'}`} disabled={!scheduleData || scheduleData.status !== 'success'}>Timetable</button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6 mt-6">
        {activeTab === 'upload' && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6">Upload Data</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Algorithm</label>
                <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <option value="greedy">Greedy (Welsh-Powell) - Unit 4</option>
                  <option value="backtracking">Backtracking (M-Coloring) - Unit 3</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Max Slots (For Backtracking)</label>
                <input type="number" value={maxSlots} onChange={(e) => setMaxSlots(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Courses Upload */}
              <div 
                className={`p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors ${dragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 bg-slate-50'}`}
                onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={(e) => onDrop(e, 'courses')}
              >
                <div className="text-slate-500 mb-2 font-medium">Drag & Drop Courses CSV</div>
                <div className="text-xs text-slate-400 mb-4">or paste below</div>
                <textarea 
                  className="w-full p-2 bg-white border border-slate-200 rounded text-xs font-mono h-24"
                  value={coursesCSV} onChange={(e) => setCoursesCSV(e.target.value)}
                  placeholder="CS101,Intro to Programming..."
                />
              </div>

              {/* Enrollments Upload */}
              <div 
                className={`p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors ${dragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 bg-slate-50'}`}
                onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={(e) => onDrop(e, 'enrollments')}
              >
                <div className="text-slate-500 mb-2 font-medium">Drag & Drop Enrollments CSV</div>
                <div className="text-xs text-slate-400 mb-4">or paste below</div>
                <textarea 
                  className="w-full p-2 bg-white border border-slate-200 rounded text-xs font-mono h-24"
                  value={enrollmentsCSV} onChange={(e) => setEnrollmentsCSV(e.target.value)}
                  placeholder="Student123,CS101..."
                />
              </div>
            </div>

            <button onClick={handleUpload} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-colors">
              Process & Schedule
            </button>
          </div>
        )}

        {activeTab === 'timetable' && scheduleData?.status === 'success' && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Generated Timetable</h2>
              <div className="flex space-x-4 items-center">
                <div className="text-sm bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full">
                  Solved in {scheduleData.execution_time_ms}ms using {scheduleData.algorithm_used}
                </div>
                <button onClick={exportPDF} className="bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-700 text-sm font-medium">
                  Export PDF
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Group by slot to form calendar columns visually */}
              {Array.from({length: scheduleData.used_slots}).map((_, slotIdx) => (
                <div key={slotIdx} className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-200 p-3 text-center font-bold text-slate-700">Slot {slotIdx}</div>
                  <div className="p-4 space-y-3">
                    {scheduleData.assignments.filter(c => c.slot === slotIdx).map((course, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm border-l-4 border-l-indigo-500">
                        <div className="font-bold text-slate-800">{course.course_id}</div>
                        <div className="text-xs text-slate-500 mb-2 truncate">{course.course_name}</div>
                        <div className="text-xs bg-slate-100 inline-block px-2 py-1 rounded text-slate-600">{course.enrollment} Enrolled</div>
                      </div>
                    ))}
                    {scheduleData.assignments.filter(c => c.slot === slotIdx).length === 0 && (
                      <div className="text-slate-400 text-sm text-center italic py-4">No Exams</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'graph' && scheduleData?.status === 'success' && (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[600px]">
            <h2 className="text-2xl font-semibold mb-4 text-center">Conflict Graph Visualization</h2>
            <p className="text-slate-500 mb-4">Nodes represent courses. Edges represent student conflicts. Colors denote assigned time slots.</p>
            <div className="w-full h-[500px] bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative">
              <svg ref={svgRef} className="w-full h-full"></svg>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
