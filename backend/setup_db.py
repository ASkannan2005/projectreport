import pandas as pd
from database import engine, SessionLocal
import models
import os

def load_data():
    if not engine:
        print("Database not configured. Edit .env file.")
        return

    csv_path = os.path.join(os.path.dirname(__file__), '..', 'cleaned_dataset.csv')
    if not os.path.exists(csv_path):
        print(f"CSV not found at {csv_path}")
        return

    print("Creating tables in MySQL if they don't exist...")
    models.Base.metadata.create_all(bind=engine)
    
    print("Loading data from CSV to MySQL...")
    df = pd.read_csv(csv_path)
    
    # Process dates
    df['Placement_Date'] = pd.to_datetime(df['Placement_Date'], errors='coerce')
    
    df.to_sql(name='placement_data', con=engine, if_exists='replace', index=False)
    print("Data successfully loaded into MySQL!")

if __name__ == "__main__":
    load_data()
