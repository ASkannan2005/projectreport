import sys
import logging
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine

logging.basicConfig(
    stream=sys.stdout,
    level=logging.INFO,
    format="%(asctime)s  %(levelname)s  %(message)s"
)
log = logging.getLogger(__name__)

app = FastAPI(title="Campus Placement API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load data from MySQL at startup
try:
    with engine.connect() as conn:
        df = pd.read_sql("SELECT * FROM placement_data", con=conn)
    # Sanitize category strings
    df['Department'] = df['Department'].astype(str).str.strip().str.upper()
    df['Gender'] = df['Gender'].astype(str).str.strip().str.title()
    df['Placement_Status'] = df['Placement_Status'].astype(str).str.strip().str.title()
    df['Interview_Status'] = df['Interview_Status'].astype(str).str.strip().str.title()
    
    df['Placement_Date'] = pd.to_datetime(df['Placement_Date'], errors='coerce')
    # Extract numeric part from salary column and safely parse it
    df['Salary_Package_LPA'] = df['Salary_Package_LPA'].astype(str).str.extract(r'(\d+\.?\d*)', expand=False)
    df['Salary_Package_LPA'] = pd.to_numeric(df['Salary_Package_LPA'], errors='coerce')
    
    log.info("Loaded %d rows from MySQL", len(df))
except Exception as e:
    log.error("Failed to load data: %s", e)
    df = pd.DataFrame()

@app.get("/api/health")
def health():
    return {"status": "ok", "rows": len(df)}

@app.get("/api/filters")
def get_filters():
    return {
        "departments":        sorted(df['Department'].dropna().unique().tolist()),
        "genders":            sorted(df['Gender'].dropna().unique().tolist()),
        "placement_statuses": sorted(df['Placement_Status'].dropna().unique().tolist()),
        "interview_statuses": sorted(df['Interview_Status'].dropna().unique().tolist()),
    }

@app.get("/api/dashboard")
def get_dashboard_data(
    department: str = None,
    gender: str = None,
    placement_status: str = None,
    interview_status: str = None
):
    filtered = df.copy()
    if department:        filtered = filtered[filtered['Department'] == department]
    if gender:            filtered = filtered[filtered['Gender'] == gender]
    if placement_status:  filtered = filtered[filtered['Placement_Status'] == placement_status]
    if interview_status:  filtered = filtered[filtered['Interview_Status'] == interview_status]

    placed     = filtered[filtered['Placement_Status'] == 'Placed']
    not_placed = filtered[filtered['Placement_Status'] == 'Not Placed']
    attended   = filtered[filtered['Interview_Status'] == 'Attended']

    placement_rate = (len(placed) / len(attended) * 100) if len(attended) > 0 else 0
    avg_salary     = placed['Salary_Package_LPA'].mean() if len(placed) > 0 else None
    highest_salary = placed['Salary_Package_LPA'].max()  if len(placed) > 0 else None

    # Department-wise placement
    dept_data = filtered.groupby(['Department', 'Placement_Status']).size().unstack(fill_value=0).reset_index()
    department_list = []
    for _, row in dept_data.iterrows():
        department_list.append({
            "name":       row['Department'],
            "Placed":     int(row.get('Placed', 0)),
            "Not Placed": int(row.get('Not Placed', 0))
        })

    # Top 5 recruiters
    recruiter_counts = placed[placed['Company_Name'] != 'Not Applicable']['Company_Name'].value_counts().head(5)
    recruiters_list  = [{"name": n, "hires": int(c)} for n, c in recruiter_counts.items()]

    # Rejection reasons
    not_placed_real = not_placed[not_placed['Reason_for_Not_Being_Placed'] != 'Not Applicable']
    reason_counts   = not_placed_real['Reason_for_Not_Being_Placed'].value_counts()
    rejections_list = [{"name": n, "value": int(c)} for n, c in reason_counts.items()]

    # Gender distribution
    gender_list = [{"name": g, "value": int(c)} for g, c in placed['Gender'].value_counts().items()]

    # Salary by department
    salary_dept      = placed.groupby('Department')['Salary_Package_LPA'].mean().round(2)
    salary_dept_list = [{"name": d, "avgSalary": float(s) if pd.notnull(s) else None} for d, s in salary_dept.items()]

    # Top job roles
    job_roles      = placed['Job_Role'].value_counts().head(8)
    job_roles_list = [{"name": r, "count": int(c)} for r, c in job_roles.items()]

    return {
        "kpis": {
            "totalStudents":    len(filtered),
            "placedStudents":   len(placed),
            "notPlacedStudents":len(not_placed),
            "placementRate":    round(placement_rate, 2),
            "avgSalary":        round(float(avg_salary), 2) if avg_salary is not None else None,
            "highestSalary":    round(float(highest_salary), 2) if highest_salary is not None else None,
            "totalCompanies":   int(placed['Company_Name'].nunique())
        },
        "charts": {
            "departmentData": department_list,
            "recruitersData": recruiters_list,
            "rejectionsData": rejections_list,
            "genderData":     gender_list,
            "salaryByDept":   salary_dept_list,
            "jobRolesData":   job_roles_list
        }
    }
