from sqlalchemy import Column, String, Float, Date, Integer
from database import Base

class StudentPlacement(Base):
    __tablename__ = "placement_data"

    Student_ID = Column(String(50), primary_key=True, index=True)
    Student_Name = Column(String(100))
    Department = Column(String(50))
    Gender = Column(String(20))
    CGPA = Column(Float)
    Company_Name = Column(String(100))
    Job_Role = Column(String(100))
    Placement_Date = Column(Date, nullable=True)
    Interview_Status = Column(String(50))
    Placement_Status = Column(String(50))
    Salary_Package_LPA = Column(Float)
    Number_of_Interview_Rounds = Column(Integer)
    Final_Result = Column(String(50))
    Reason_for_Not_Being_Placed = Column(String(255))
