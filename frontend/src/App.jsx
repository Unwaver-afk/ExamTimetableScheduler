import { useState } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, CheckCircle2, BarChart2, Calendar, LayoutGrid, Loader2, Clock3, Network, Users2 } from 'lucide-react'
import './index.css'

const SLOT_COLORS = ['#2563eb', '#dc2626', '#059669', '#d97706', '#7c3aed', '#0891b2', '#be123c', '#4f46e5']

const formatSlotLabel = (slot) => `Slot ${Number(slot) + 1}`

const groupAssignmentsBySlot = (assignments = [], usedSlots = 0) => {
  const totalSlots = Math.max(usedSlots, assignments.reduce((max, course) => Math.max(max, course.slot + 1), 0))
  return Array.from({ length: totalSlots }, (_, slot) => ({
    slot,
    courses: assignments
      .filter((course) => course.slot === slot)
      .sort((a, b) => b.enrollment - a.enrollment || a.course_id.localeCompare(b.course_id)),
  }))
}

const buildGraphLayout = (nodes = [], links = []) => {
  const width = 960
  const height = 560
  const centerX = width / 2
  const centerY = height / 2
  const radiusX = Math.min(330, 140 + nodes.length * 24)
  const radiusY = Math.min(190, 90 + nodes.length * 16)
  const positionedNodes = nodes.map((node, index) => {
    const angle = nodes.length === 1 ? -Math.PI / 2 : (index / nodes.length) * Math.PI * 2 - Math.PI / 2
    return {
      ...node,
      x: centerX + Math.cos(angle) * radiusX,
      y: centerY + Math.sin(angle) * radiusY,
      radius: Math.max(42, Math.sqrt(node.enrollment || 1) * 16),
    }
  })
  const nodeById = new Map(positionedNodes.map((node) => [node.id, node]))
  const positionedLinks = links
    .map((link) => ({
      source: nodeById.get(link.source),
      target: nodeById.get(link.target),
    }))
    .filter((link) => link.source && link.target)

  return { width, height, nodes: positionedNodes, links: positionedLinks }
}

const FileDropzone = ({ type, file, setFile, setCsvContent, title, subtitle }) => {
  const [dragging, setDragging] = useState(false)

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const droppedFile = e.dataTransfer?.files[0] || e.target.files[0]
    if (droppedFile) {
      setFile(droppedFile)
      const reader = new FileReader()
      reader.onload = (event) => setCsvContent(event.target.result)
      reader.readAsText(droppedFile)
    }
  }

  return (
    <div
      className={`relative overflow-hidden group rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center p-8 cursor-pointer h-56
        ${dragging ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02] shadow-xl shadow-indigo-100' : 'border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'}
        ${file ? 'border-solid border-emerald-500 bg-emerald-50 hover:bg-emerald-50' : ''}
      `}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => document.getElementById(`fileInput-${type}`).click()}
    >
      <input type="file" id={`fileInput-${type}`} className="hidden" accept=".csv" onChange={onDrop} />

      <AnimatePresence mode="wait">
        {file ? (
          <motion.div
            key="file"
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
            className="flex flex-col items-center text-emerald-600"
          >
            <div className="bg-emerald-100 p-4 rounded-full mb-3 shadow-sm">
              <CheckCircle2 size={32} />
            </div>
            <span className="font-semibold">{file.name}</span>
            <span className="text-xs text-emerald-500 mt-1">{(file.size / 1024).toFixed(1)} KB</span>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
            className="flex flex-col items-center text-slate-500 group-hover:text-indigo-600 transition-colors"
          >
            <div className="bg-white p-4 rounded-full mb-4 shadow-sm group-hover:shadow-md transition-shadow">
              <UploadCloud size={32} className={dragging ? 'text-indigo-600' : ''} />
            </div>
            <span className="font-semibold text-slate-700">{title}</span>
            <span className="text-sm mt-1 text-center">{subtitle}</span>
            <span className="text-xs mt-3 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">Browse Files</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function App() {
  const [activeTab, setActiveTab] = useState('upload')
  const [coursesFile, setCoursesFile] = useState(null)
  const [enrollmentsFile, setEnrollmentsFile] = useState(null)
  const [coursesCSV, setCoursesCSV] = useState('')
  const [enrollmentsCSV, setEnrollmentsCSV] = useState('')
  
  const [scheduleData, setScheduleData] = useState(null)
  const [algorithm, setAlgorithm] = useState('greedy')
  const [maxSlots, setMaxSlots] = useState(10)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleUpload = async () => {
    if (!coursesCSV || !enrollmentsCSV) {
      alert("Please upload both CSV files.");
      return;
    }
    
    setIsProcessing(true);
    try {
      const res1 = await axios.post('http://127.0.0.1:8080/api/upload', {
        courses_csv: coursesCSV,
        enrollments_csv: enrollmentsCSV
      });
      if (res1.data.status === 'success') {
        const res2 = await axios.post('http://127.0.0.1:8080/api/schedule', {
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
      alert('Error communicating with backend. Ensure C++ backend is running.');
    } finally {
      setIsProcessing(false);
    }
  }

  const slotGroups = groupAssignmentsBySlot(scheduleData?.assignments, scheduleData?.used_slots || 0)
  const totalEnrollment = scheduleData?.assignments?.reduce((sum, course) => sum + Number(course.enrollment || 0), 0) || 0
  const busiestCourse = scheduleData?.assignments?.reduce((best, course) => {
    if (!best || Number(course.enrollment || 0) > Number(best.enrollment || 0)) return course
    return best
  }, null)
  const maxSlotEnrollment = Math.max(1, ...slotGroups.map((group) => group.courses.reduce((sum, course) => sum + Number(course.enrollment || 0), 0)))
  const graphLayout = buildGraphLayout(scheduleData?.nodes || [], scheduleData?.links || [])

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Premium Gradient Background Blur */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-300/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-pink-300/20 blur-[120px]"></div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-white/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
                <Calendar className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-violet-800 tracking-tight">
              Timely
            </h1>
          </div>
          <div className="flex space-x-2 bg-slate-100/80 p-1.5 rounded-2xl border border-white/50 shadow-inner">
            {[
                { id: 'upload', icon: <UploadCloud size={18}/>, label: 'Workspace' },
                { id: 'graph', icon: <BarChart2 size={18}/>, label: 'Graph Visualizer' },
                { id: 'timetable', icon: <LayoutGrid size={18}/>, label: 'Course Plan' }
            ].map(tab => (
                <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)} 
                    disabled={tab.id !== 'upload' && (!scheduleData || scheduleData.status !== 'success')}
                    className={`
                        relative px-5 py-2.5 rounded-xl font-medium text-sm flex items-center space-x-2 transition-all duration-300
                        ${activeTab === tab.id ? 'text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}
                        ${tab.id !== 'upload' && (!scheduleData || scheduleData.status !== 'success') ? 'opacity-40 cursor-not-allowed' : ''}
                    `}
                >
                    {activeTab === tab.id && (
                        <motion.div layoutId="nav-pill" className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200/50" />
                    )}
                    <span className="relative z-10 flex items-center space-x-2">
                        {tab.icon}
                        <span>{tab.label}</span>
                    </span>
                </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
            
          {/* UPLOAD VIEW */}
          {activeTab === 'upload' && (
            <motion.div 
                key="upload"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}
                className="max-w-4xl mx-auto"
            >
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-black text-slate-800 tracking-tight mb-4">Timely Course Planner</h2>
                    <p className="text-slate-500 text-lg max-w-2xl mx-auto">Upload course enrollment data to instantly generate conflict-free course time slots using graph coloring algorithms.</p>
                </div>

                <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-xl shadow-indigo-100/50 border border-white/60 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <FileDropzone 
                            type="courses" file={coursesFile} setFile={setCoursesFile} setCsvContent={setCoursesCSV}
                            title="Drop Courses CSV" subtitle="Columns: CourseID, CourseName"
                        />
                        <FileDropzone 
                            type="enrollments" file={enrollmentsFile} setFile={setEnrollmentsFile} setCsvContent={setEnrollmentsCSV}
                            title="Drop Enrollments CSV" subtitle="Columns: StudentID, CourseID..."
                        />
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 mb-8">
                        <h3 className="font-semibold text-slate-800 mb-4 flex items-center">
                            <span className="bg-indigo-100 text-indigo-700 p-1.5 rounded-lg mr-3"><BarChart2 size={16}/></span>
                            Algorithm Configuration
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-2">Scheduling Algorithm</label>
                                <select 
                                    value={algorithm} onChange={(e) => setAlgorithm(e.target.value)} 
                                    className="w-full p-3.5 bg-white border border-slate-200 shadow-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700"
                                >
                                    <option value="greedy">Welsh-Powell (Greedy) - Unit 4</option>
                                    <option value="backtracking">M-Coloring (Backtracking) - Unit 3</option>
                                </select>
                            </div>
                            <div className={algorithm === 'greedy' ? 'opacity-50 pointer-events-none' : ''}>
                                <label className="block text-sm font-semibold text-slate-600 mb-2">Max Colors (Slots)</label>
                                <input 
                                    type="number" value={maxSlots} onChange={(e) => setMaxSlots(e.target.value)} 
                                    className="w-full p-3.5 bg-white border border-slate-200 shadow-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700" 
                                />
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleUpload} 
                        disabled={isProcessing || !coursesFile || !enrollmentsFile}
                        className="w-full relative overflow-hidden bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {isProcessing ? (
                            <span className="flex items-center justify-center space-x-2">
                                <Loader2 className="animate-spin" size={20} />
                                <span>Running Algorithm...</span>
                            </span>
                        ) : (
                            <span className="flex items-center justify-center space-x-2">
                                <span>Generate Course Plan</span>
                                <motion.span className="inline-block" initial={{ x: 0 }} whileHover={{ x: 5 }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg></motion.span>
                            </span>
                        )}
                    </button>
                </div>
            </motion.div>
          )}

          {/* TIMETABLE VIEW */}
          {activeTab === 'timetable' && scheduleData && (
            <motion.div 
                key="timetable"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}
            >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Course Planning Board</h2>
                        <p className="text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                            <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-md font-semibold text-xs border border-emerald-200">Success</span>
                            <span>{scheduleData.algorithm_used === 'greedy' ? 'Greedy Approach' : 'Backtracking Approach'} solved in {scheduleData.execution_time_ms}ms</span>
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { icon: <Clock3 size={18} />, label: 'Slots Used', value: slotGroups.length },
                        { icon: <LayoutGrid size={18} />, label: 'Courses', value: scheduleData.assignments.length },
                        { icon: <Network size={18} />, label: 'Conflicts', value: scheduleData.links?.length || 0 },
                        { icon: <Users2 size={18} />, label: 'Enrolled Students', value: totalEnrollment },
                    ].map((metric) => (
                        <div key={metric.label} className="bg-white/85 border border-white/70 shadow-sm rounded-2xl p-4 flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                                {metric.icon}
                            </div>
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wide text-slate-400">{metric.label}</div>
                                <div className="text-2xl font-black text-slate-900 leading-tight">{metric.value}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
                    <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/70 shadow-xl shadow-slate-200/60 overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                                <h3 className="text-xl font-black text-slate-800">Conflict-Free Timeline</h3>
                                <p className="text-sm text-slate-500 mt-1">Each vertical lane is one course time slot; color remains consistent with the graph.</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {slotGroups.map((group) => (
                                    <span key={group.slot} className="text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
                                        {formatSlotLabel(group.slot)}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <div className="min-w-[760px] grid" style={{ gridTemplateColumns: `repeat(${Math.max(slotGroups.length, 1)}, minmax(240px, 1fr))` }}>
                                {slotGroups.map((group, slotIdx) => {
                                    const slotEnrollment = group.courses.reduce((sum, course) => sum + Number(course.enrollment || 0), 0)
                                    return (
                                        <motion.div
                                            key={group.slot}
                                            initial={{ opacity: 0, y: 16 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: slotIdx * 0.06 }}
                                            className="border-r last:border-r-0 border-slate-100 p-5 min-h-[460px]"
                                        >
                                            <div className="flex items-start justify-between gap-3 mb-5">
                                                <div>
                                                    <div className="text-xs font-black uppercase tracking-wide" style={{ color: SLOT_COLORS[group.slot % SLOT_COLORS.length] }}>
                                                        {formatSlotLabel(group.slot)}
                                                    </div>
                                                    <div className="text-2xl font-black text-slate-900">{group.courses.length} courses</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-slate-400 font-bold">Load</div>
                                                    <div className="text-sm font-black text-slate-700">{slotEnrollment}</div>
                                                </div>
                                            </div>

                                            <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-5">
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{
                                                        width: `${Math.max(8, (slotEnrollment / maxSlotEnrollment) * 100)}%`,
                                                        backgroundColor: SLOT_COLORS[group.slot % SLOT_COLORS.length],
                                                    }}
                                                />
                                            </div>

                                            <div className="space-y-3">
                                                {group.courses.map((course) => (
                                                    <div key={course.course_id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 hover:bg-white hover:shadow-md transition-all">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <div className="font-black text-slate-900 text-lg leading-tight">{course.course_id}</div>
                                                                <div className="text-sm text-slate-500 font-medium mt-1 break-words">{course.course_name}</div>
                                                            </div>
                                                            <div className="shrink-0 rounded-xl px-2.5 py-1 text-xs font-black text-white" style={{ backgroundColor: SLOT_COLORS[group.slot % SLOT_COLORS.length] }}>
                                                                {course.enrollment}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {group.courses.length === 0 && (
                                                    <div className="h-32 border border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 font-semibold">
                                                        Empty Slot
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    <aside className="space-y-4">
                        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl">
                            <div className="text-sm text-slate-300 font-semibold">Highest Enrollment</div>
                            <div className="text-3xl font-black mt-2">{busiestCourse?.course_id || '—'}</div>
                            <div className="text-slate-300 mt-1">{busiestCourse?.course_name || 'No course selected'}</div>
                            <div className="mt-5 h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-400 rounded-full" style={{ width: busiestCourse ? '100%' : '0%' }} />
                            </div>
                            <div className="text-sm font-bold mt-3">{busiestCourse?.enrollment || 0} enrolled students</div>
                        </div>

                        <div className="bg-white/90 border border-white/70 rounded-3xl p-6 shadow-sm">
                            <h3 className="font-black text-slate-800 mb-4">Slot Load Balance</h3>
                            <div className="space-y-4">
                                {slotGroups.map((group) => {
                                    const slotEnrollment = group.courses.reduce((sum, course) => sum + Number(course.enrollment || 0), 0)
                                    return (
                                        <div key={group.slot}>
                                            <div className="flex justify-between text-sm font-bold text-slate-600 mb-1">
                                                <span>{formatSlotLabel(group.slot)}</span>
                                                <span>{slotEnrollment}</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{
                                                        width: `${Math.max(5, (slotEnrollment / maxSlotEnrollment) * 100)}%`,
                                                        backgroundColor: SLOT_COLORS[group.slot % SLOT_COLORS.length],
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </aside>
                </div>
            </motion.div>
          )}

          {/* GRAPH VIEW */}
          {activeTab === 'graph' && scheduleData && (
            <motion.div 
                key="graph"
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.4 }}
                className="bg-white/90 backdrop-blur-2xl p-2 rounded-[2rem] shadow-2xl shadow-indigo-100/50 border border-white"
            >
                <div className="px-8 pt-8 pb-4 flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Conflict Graph Visualizer</h2>
                        <p className="text-slate-500 mt-2 font-medium">Edges show students shared between courses; colors match assigned course time slots.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {slotGroups.map((group) => (
                            <span key={group.slot} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-600">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SLOT_COLORS[group.slot % SLOT_COLORS.length] }} />
                                {formatSlotLabel(group.slot)}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="w-full bg-slate-50 rounded-[1.5rem] overflow-hidden m-2 border border-slate-100/70 min-h-[560px]">
                    <svg
                        className="block w-full h-[560px]"
                        viewBox={`0 0 ${graphLayout.width} ${graphLayout.height}`}
                        preserveAspectRatio="xMidYMid meet"
                        role="img"
                        aria-label="Course conflict graph"
                    >
                        <rect width={graphLayout.width} height={graphLayout.height} rx="28" fill="#f8fafc" />
                        <g stroke="#94a3b8" strokeOpacity="0.72" strokeWidth="2.5" strokeLinecap="round">
                            {graphLayout.links.map((link) => (
                                <line
                                    key={`${link.source.id}-${link.target.id}`}
                                    x1={link.source.x}
                                    y1={link.source.y}
                                    x2={link.target.x}
                                    y2={link.target.y}
                                />
                            ))}
                        </g>
                        <g>
                            {graphLayout.nodes.map((node) => {
                                const color = SLOT_COLORS[node.group % SLOT_COLORS.length]
                                return (
                                    <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                                        <circle
                                            r={node.radius + 12}
                                            fill={color}
                                            opacity="0.12"
                                        />
                                        <circle
                                            r={node.radius}
                                            fill={color}
                                            stroke="#ffffff"
                                            strokeWidth="5"
                                        />
                                        <text
                                            y="-2"
                                            textAnchor="middle"
                                            fontSize="16"
                                            fontWeight="900"
                                            fill="#ffffff"
                                            style={{ pointerEvents: 'none' }}
                                        >
                                            {node.id}
                                        </text>
                                        <text
                                            y="15"
                                            textAnchor="middle"
                                            fontSize="12"
                                            fontWeight="800"
                                            fill="#ffffff"
                                            opacity="0.9"
                                            style={{ pointerEvents: 'none' }}
                                        >
                                            {node.enrollment} students
                                        </text>
                                        <text
                                            y={node.radius + 28}
                                            textAnchor="middle"
                                            fontSize="13"
                                            fontWeight="800"
                                            fill="#334155"
                                            style={{ pointerEvents: 'none' }}
                                        >
                                            {formatSlotLabel(node.group)}
                                        </text>
                                    </g>
                                )
                            })}
                        </g>
                        {graphLayout.nodes.length === 0 && (
                            <text x="480" y="280" textAnchor="middle" fontSize="18" fontWeight="800" fill="#64748b">
                                Generate a course plan to see the conflict graph.
                            </text>
                        )}
                    </svg>
                </div>
                <div className="px-8 pb-8 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <div className="text-xs font-black uppercase tracking-wide text-slate-400">Nodes</div>
                        <div className="text-2xl font-black text-slate-900">{scheduleData.nodes?.length || 0}</div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <div className="text-xs font-black uppercase tracking-wide text-slate-400">Conflict Edges</div>
                        <div className="text-2xl font-black text-slate-900">{scheduleData.links?.length || 0}</div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <div className="text-xs font-black uppercase tracking-wide text-slate-400">Color Groups</div>
                        <div className="text-2xl font-black text-slate-900">{slotGroups.length}</div>
                    </div>
                </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

export default App
