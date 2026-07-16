import { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import axios from 'axios'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts'
import './index.css'

const BLUE_SHADES = ['#1E40AF', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD']
const RED_SHADES = ['#991B1B', '#DC2626', '#EF4444', '#F87171', '#FCA5A5']
const PIE_COLORS = ['#2563EB', '#DC2626', '#1D4ED8', '#B91C1C', '#3B82F6', '#EF4444', '#1E40AF', '#FCA5A5']

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--bg-card-elevated)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--text)',
  fontSize: '12px',
  boxShadow: 'var(--shadow-md)',
  padding: '12px',
}

const NAV_ITEMS = [
  { icon: 'grid', label: 'Overview', path: '/' },
  { icon: 'bar-chart', label: 'Departments', path: '/departments' },
  { icon: 'building', label: 'Recruiters', path: '/recruiters' },
  { icon: 'dollar', label: 'Salaries', path: '/salaries' },
  { icon: 'users', label: 'Students', path: '/students' },
]

const SVG_ICONS = {
  grid: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
  'bar-chart': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="12" width="4" height="9" rx="1" /><rect x="10" y="7" width="4" height="14" rx="1" /><rect x="17" y="3" width="4" height="18" rx="1" /></svg>,
  building: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4" /></svg>,
  dollar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  bell: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  filter: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>,
  chevron: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>,
  x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  trend: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
  menu: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
}

function useCountUp(endValue, duration = 1000) {
  const [value, setValue] = useState(0)

  const isNumeric = typeof endValue === 'number'
  // Safely extract floats from strings like "₹9.5 LPA" or "84%"
  const parsed = isNumeric ? endValue : parseFloat(String(endValue).replace(/[^\d.-]/g, ''))
  const target = isNaN(parsed) ? 0 : parsed

  useEffect(() => {
    if (isNaN(parsed) || target === 0) { setValue(0); return; }
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setValue(target);
      }
    };
    window.requestAnimationFrame(step);
  }, [target, duration, parsed]);

  // If the original endValue is entirely non-numeric/null (e.g. "—"), return as is.
  if (isNaN(parsed)) return endValue;

  if (!isNumeric) {
    if (typeof endValue === 'string' && endValue.includes('%')) return `${value}%`
    if (typeof endValue === 'string' && endValue.includes('LPA')) return `₹${value} LPA`
    return endValue;
  }
  return value;
}

function AppLayout() {
  const [data, setData] = useState(null)
  const [filters, setFilters] = useState({ department: '', gender: '', placement_status: '', interview_status: '' })
  const [filterOptions, setFilterOptions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()

  useEffect(() => {
    axios.get('/api/filters').then(res => setFilterOptions(res.data)).catch(() => { })
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
    axios.get('/api/dashboard', { params })
      .then(res => { setData(res.data); setLoading(false) })
      .catch(() => { setError('Backend not reachable'); setLoading(false) })
  }, [filters])

  const handleFilter = (key, val) => setFilters(prev => ({ ...prev, [key]: val }))
  const clearFilters = () => setFilters({ department: '', gender: '', placement_status: '', interview_status: '' })
  const activeCount = Object.values(filters).filter(v => v !== '').length

  // Find page title based on route
  const currentNav = NAV_ITEMS.find(n => n.path === location.pathname) || { label: 'Dashboard' }

  return (
    <div className={`app-wrapper ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="main-content">
        <Topbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} data={data} filterOptions={filterOptions} handleFilter={handleFilter} title={currentNav.label} />

        <div className="filter-bar">
          <div className="filter-bar-left">
            <span className="filter-icon-wrap">{SVG_ICONS.filter}</span>
            <span className="filter-label">Filters</span>
            <FilterSelect label="Department" value={filters.department} options={filterOptions?.departments || []} onChange={v => handleFilter('department', v)} />
            <FilterSelect label="Gender" value={filters.gender} options={filterOptions?.genders || []} onChange={v => handleFilter('gender', v)} />
            <FilterSelect label="Placement Status" value={filters.placement_status} options={filterOptions?.placement_statuses || []} onChange={v => handleFilter('placement_status', v)} />
            <FilterSelect label="Interview Status" value={filters.interview_status} options={filterOptions?.interview_statuses || []} onChange={v => handleFilter('interview_status', v)} />
          </div>
          {activeCount > 0 && (
            <button className="btn-secondary" onClick={clearFilters}>
              <span className="icon-sm">{SVG_ICONS.x}</span> Clear {activeCount} filter{activeCount > 1 ? 's' : ''}
            </button>
          )}
        </div>

        <div className="page-body">
          {loading && <SkeletonDashboard />}
          {error && <ErrorScreen message={error} />}
          {!loading && !error && data && (
            <Routes>
              <Route path="/" element={<Overview data={data} />} />
              <Route path="/departments" element={<DepartmentsView data={data} />} />
              <Route path="/recruiters" element={<RecruitersView data={data} />} />
              <Route path="/salaries" element={<SalariesView data={data} />} />
              <Route path="/students" element={<StudentsView data={data} />} />
            </Routes>
          )}
        </div>
      </div>
    </div>
  )
}

function Sidebar({ isOpen, toggle }) {
  return (
    <>
      <div className="sidebar-overlay" onClick={toggle}></div>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <div className="brand-text">
            <div className="brand-name">PlacementIQ</div>
            <div className="brand-sub">Analytics Platform</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main Menu</div>
          {NAV_ITEMS.map(({ icon, label, path }) => (
            <NavLink
              key={label}
              to={path}
              end={path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{SVG_ICONS[icon]}</span>
              <span className="nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-stack">
          <div className="stack-label">Tech Stack</div>
          <div className="stack-pills">
            <span className="badge badge-blue">React 18</span>
            <span className="badge badge-red">FastAPI</span>
            <span className="badge badge-green">MySQL</span>
            <span className="badge badge-blue">Recharts</span>
          </div>
        </div>
      </aside>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}

// ============== VIEWS ==============

function Overview({ data }) {
  const { kpis, charts } = data
  return (
    <>
      <div className="section-block">
        <SectionLabel text="Key Performance Indicators" />
        <div className="kpi-grid four-col">
          <KpiCard icon="🎓" label="Total Students" value={kpis.totalStudents} accent="var(--blue-light)" sub="Enrolled this year" />
          <KpiCard icon="✅" label="Placement Rate" value={`${kpis.placementRate}%`} accent="var(--green)" sub="Of interviewed students" />
          <KpiCard icon="₹" label="Average Salary" value={kpis.avgSalary !== null ? `₹${kpis.avgSalary} LPA` : "—"} accent="var(--orange)" sub="Across all offers" />
          <KpiCard icon="🏆" label="Highest Package" value={kpis.highestSalary !== null ? `₹${kpis.highestSalary} LPA` : "—"} accent="var(--red)" sub="Best offer received" />
        </div>
      </div>
      <div className="kpi-grid three-col">
        <KpiCard icon="🏢" label="Total Companies" value={kpis.totalCompanies} accent="var(--purple)" sub="Participated in drives" />
        <KpiCard icon="🎉" label="Students Placed" value={kpis.placedStudents} accent="var(--cyan)" sub="Successfully placed" />
        <KpiCard icon="📋" label="Not Placed" value={kpis.notPlacedStudents} accent="var(--red)" sub="Awaiting placement" />
      </div>
      <div className="section-block">
        <SectionLabel text="Placement Breakdown" />
        <div className="charts-row">
          <ChartCard title="Department-wise Placement" tag="Grouped Bar"><DepartmentChart data={charts.departmentData} /></ChartCard>
          <ChartCard title="Top 5 Recruiters" tag="Horizontal Bar"><RecruitersChart data={charts.recruitersData} /></ChartCard>
        </div>
      </div>
    </>
  )
}

function DepartmentsView({ data }) {
  const { charts } = data
  return (
    <>
      <div className="section-block">
        <SectionLabel text="Department Analytics" />
        <div className="charts-row">
          <ChartCard title="Positions by Department" tag="Grouped Bar"><DepartmentChart data={charts.departmentData} /></ChartCard>
          <ChartCard title="Avg Salary by Department" tag="Bar Chart"><SalaryDeptChart data={charts.salaryByDept} /></ChartCard>
        </div>
      </div>
    </>
  )
}

function RecruitersView({ data }) {
  const { kpis, charts } = data
  return (
    <>
      <div className="section-block">
        <SectionLabel text="Recruitment Landscape" />
        <div className="kpi-grid three-col">
          <KpiCard icon="🏢" label="Total Companies Active" value={kpis.totalCompanies} accent="var(--purple)" sub="Filtering applied" />
        </div>
        <div className="charts-row" style={{ marginTop: '24px' }}>
          <ChartCard title="Top Recruiters by Volume" tag="Horizontal Bar"><RecruitersChart data={charts.recruitersData} /></ChartCard>
          <ChartCard title="Top Job Roles" tag="Vertical Bar"><JobRolesChart data={charts.jobRolesData} /></ChartCard>
        </div>
      </div>
    </>
  )
}

function SalariesView({ data }) {
  const { kpis, charts } = data
  return (
    <>
      <div className="section-block">
        <SectionLabel text="Compensation Insights" />
        <div className="kpi-grid three-col">
          <KpiCard icon="₹" label="Average Salary" value={kpis.avgSalary !== null ? `₹${kpis.avgSalary} LPA` : "—"} accent="var(--orange)" sub="Current Average" />
          <KpiCard icon="🏆" label="Highest Package" value={kpis.highestSalary !== null ? `₹${kpis.highestSalary} LPA` : "—"} accent="var(--red)" sub="Max Offer Recorded" />
        </div>
        <div className="charts-row" style={{ marginTop: '24px' }}>
          <ChartCard title="Average Salary by Department" tag="Bar Chart"><SalaryDeptChart data={charts.salaryByDept} /></ChartCard>
        </div>
      </div>
    </>
  )
}

function StudentsView({ data }) {
  const { kpis, charts } = data
  return (
    <>
      <div className="section-block">
        <SectionLabel text="Student Demographics & Results" />
        <div className="kpi-grid three-col">
          <KpiCard icon="👥" label="Total Students" value={kpis.totalStudents} accent="var(--blue-light)" sub="Matched records" />
          <KpiCard icon="🎉" label="Placed" value={kpis.placedStudents} accent="var(--cyan)" sub="Successful" />
          <KpiCard icon="📋" label="Not Placed/Pending" value={kpis.notPlacedStudents} accent="var(--red)" sub="Needs attention" />
        </div>
        <div className="charts-row" style={{ marginTop: '24px' }}>
          <ChartCard title="Gender Distribution (Placed)" tag="Donut"><GenderChart data={charts.genderData} /></ChartCard>
          <ChartCard title="Rejection Reasons" tag="Donut"><RejectionsChart data={charts.rejectionsData} /></ChartCard>
        </div>
      </div>
    </>
  )
}


// ============== REUSABLE CHARTS ==============
function DepartmentChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={270}>
      <BarChart data={data} barGap={4} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'var(--bg-card-hover)' }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: 'var(--text-dim)', paddingTop: 16 }} />
        <Bar dataKey="Placed" fill="var(--blue)" radius={[4, 4, 0, 0]} maxBarSize={32} animationDuration={1000} />
        <Bar dataKey="Not Placed" fill="var(--red)" radius={[4, 4, 0, 0]} maxBarSize={32} animationDuration={1000} />
      </BarChart>
    </ResponsiveContainer>
  )
}
function RecruitersChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={270}>
      <BarChart data={data} layout="vertical" margin={{ top: 10, right: 16, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis dataKey="name" type="category" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} width={110} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'var(--bg-card-hover)' }} />
        <Bar dataKey="hires" radius={[0, 4, 4, 0]} maxBarSize={24} animationDuration={1000}>
          {data?.map((_, i) => <Cell key={i} fill={BLUE_SHADES[i % BLUE_SHADES.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
function SalaryDeptChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={270}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`₹${v} LPA`, 'Avg Salary']} cursor={{ fill: 'var(--bg-card-hover)' }} />
        <Bar dataKey="avgSalary" radius={[4, 4, 0, 0]} maxBarSize={36} animationDuration={1000}>
          {data?.map((_, i) => <Cell key={i} fill={BLUE_SHADES[i % BLUE_SHADES.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
function JobRolesChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={270}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} angle={-25} textAnchor="end" height={60} />
        <YAxis stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'var(--bg-card-hover)' }} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={32} animationDuration={1000}>
          {data?.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? BLUE_SHADES[i % BLUE_SHADES.length] : RED_SHADES[i % RED_SHADES.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
function GenderChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={270}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={70} outerRadius={105}
          paddingAngle={4} dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={false} animationDuration={1000}>
          {data?.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} strokeWidth={0} />)}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} />
      </PieChart>
    </ResponsiveContainer>
  )
}
function RejectionsChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={270}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={70} outerRadius={105}
          paddingAngle={3} dataKey="value"
          label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
          labelLine={false} animationDuration={1000}>
          {data?.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} strokeWidth={0} />)}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: 'var(--text-dim)', paddingTop: 16 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}


// ============== UI COMPONENTS ==============
function Topbar({ toggleSidebar, data, filterOptions, handleFilter, title }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-btn mobile-menu-btn" onClick={toggleSidebar}>{SVG_ICONS.menu}</button>
        <div>
          <div className="topbar-title">{title} Dashboard</div>
          <div className="topbar-sub">Real-time placement performance</div>
        </div>
      </div>
      <div className="topbar-right">
        <SearchBar data={data} filterOptions={filterOptions} handleFilter={handleFilter} />
        <div className="topbar-badges desktop-only">
          <span className="status-badge"><span className="status-dot" />Live</span>
        </div>
        <button className="icon-btn">{SVG_ICONS.bell}</button>
        <div className="avatar">SA</div>
      </div>
    </header>
  )
}
function SearchBar({ data, filterOptions, handleFilter }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isFocused, setIsFocused] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsFocused(false);
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  useEffect(() => {
    if (!query) { setResults([]); return; }
    const q = query.toLowerCase()
    const matches = []
    if (filterOptions) {
      filterOptions.departments.filter(d => d.toLowerCase().includes(q)).forEach(d => matches.push({ type: 'Department', value: d, action: () => handleFilter('department', d) }))
    }
    if (data?.charts?.recruitersData) {
      data.charts.recruitersData.filter(r => r.name.toLowerCase().includes(q)).forEach(r => matches.push({ type: 'Recruiter', value: r.name, action: () => { } }))
    }
    setResults(matches.slice(0, 5))
  }, [query, data, filterOptions])
  return (
    <div className="search-wrapper" ref={wrapperRef}>
      <div className={`search-box ${isFocused ? 'focused' : ''}`}>
        <span className="search-icon">{SVG_ICONS.search}</span>
        <input className="search-input" placeholder="Search..." value={query} onChange={e => setQuery(e.target.value)} onFocus={() => setIsFocused(true)} />
      </div>
      {isFocused && query && (
        <div className="search-dropdown">
          {results.length > 0 ? results.map((r, i) => (
            <div key={i} className="search-result-item" onClick={() => { r.action(); setQuery(''); setIsFocused(false); }}>
              <span className="search-result-type">{r.type}</span><span className="search-result-value">{r.value}</span>
            </div>
          )) : <div className="search-no-results">No results</div>}
        </div>
      )}
    </div>
  )
}
function SectionLabel({ text }) {
  return (<div className="section-header"><h3 className="section-title">{text}</h3><div className="section-line"></div></div>)
}
function KpiCard({ icon, label, value, accent, sub }) {
  const displayValue = useCountUp(value)
  return (
    <div className="kpi-card" style={{ '--card-accent': accent }}>
      <div className="kpi-top">
        <div className="kpi-icon-wrap" style={{ color: accent, background: `color-mix(in srgb, ${accent} 15%, transparent)` }}>{icon}</div>
        <span className="kpi-trend-icon">{SVG_ICONS.trend}</span>
      </div>
      <div className="kpi-value">{displayValue}</div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  )
}
function ChartCard({ title, tag, children }) {
  return (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title">{title}</div>
        {tag && <span className="chart-tag">{tag}</span>}
      </div>
      <div className="chart-body">{children}</div>
    </div>
  )
}
function FilterSelect({ label, value, options, onChange }) {
  return (
    <div className="filter-select-wrap">
      <select className="filter-select" value={value} onChange={e => onChange(e.target.value)}>
        <option value="">All {label}s</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <span className="select-chevron">{SVG_ICONS.chevron}</span>
    </div>
  )
}
function ErrorScreen({ message }) {
  return (<div className="state-screen"><div className="error-box"><span className="error-icon">⚠</span><div><div className="error-title">Connection Failed</div><div className="error-msg">{message}</div></div></div></div>)
}
function SkeletonDashboard() {
  return (
    <div className="skeleton-dashboard">
      <div className="kpi-grid four-col">{[1, 2, 3, 4].map(i => <div key={i} className="skeleton-kpi" />)}</div>
      <div className="kpi-grid three-col" style={{ marginTop: '24px' }}>{[1, 2, 3].map(i => <div key={i} className="skeleton-kpi" />)}</div>
      <div className="charts-row" style={{ marginTop: '24px' }}>{[1, 2].map(i => <div key={i} className="skeleton-chart" />)}</div>
    </div>
  )
}
