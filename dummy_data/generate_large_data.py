import csv
import random

NUM_STUDENTS = 3000
NUM_COURSES = 150
MAX_COURSES_PER_STUDENT = 6

# Departments and topics
departments = ["CS", "MATH", "PHY", "EE", "MECH", "CIVIL", "BIO", "CHEM", "ECO", "HUM"]
topics = ["Foundations of", "Advanced", "Applied", "Principles of", "Introduction to", "Special Topics in", "Seminar on"]

# Generate Courses
courses = []
for i in range(1, NUM_COURSES + 1):
    dept = random.choice(departments)
    topic = random.choice(topics)
    level = random.randint(1, 4) * 100 + random.randint(1, 99)
    course_id = f"{dept}{level}"
    course_name = f"{topic} {dept}"
    
    # Ensure unique Course ID
    while any(c[0] == course_id for c in courses):
        level = random.randint(1, 4) * 100 + random.randint(1, 99)
        course_id = f"{dept}{level}"
        
    courses.append((course_id, course_name))

with open("courses_large.csv", "w", newline='') as f:
    writer = csv.writer(f)
    writer.writerow(["CourseID", "CourseName"])
    writer.writerows(courses)

# Generate Enrollments
enrollments = []
course_ids = [c[0] for c in courses]

# Create some common core courses that many students take (high conflict chance)
core_courses = random.sample(course_ids, 10)

for i in range(1, NUM_STUDENTS + 1):
    student_id = f"STU{100000 + i}"
    num_enrolled = random.randint(3, MAX_COURSES_PER_STUDENT)
    
    student_courses = set()
    # 50% chance a student takes a highly popular core course
    if random.random() > 0.5:
        student_courses.add(random.choice(core_courses))
        
    while len(student_courses) < num_enrolled:
        student_courses.add(random.choice(course_ids))
        
    for course_id in student_courses:
        enrollments.append((student_id, course_id))

with open("enrollments_large.csv", "w", newline='') as f:
    writer = csv.writer(f)
    writer.writerow(["StudentID", "CourseID"])
    writer.writerows(enrollments)

print(f"Successfully generated courses_large.csv ({len(courses)} courses)")
print(f"Successfully generated enrollments_large.csv ({len(enrollments)} enrollments for {NUM_STUDENTS} students)")
