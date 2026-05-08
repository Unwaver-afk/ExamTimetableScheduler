import csv
import random

NUM_STUDENTS = 1000
NUM_COURSES = 25
NUM_CONFLICTS = 20

departments = ["CS", "MATH", "PHY", "EE", "MECH"]
topics = ["Foundations of", "Advanced", "Applied"]

courses = []
for i in range(1, NUM_COURSES + 1):
    dept = random.choice(departments)
    topic = random.choice(topics)
    level = random.randint(1, 4) * 100 + random.randint(1, 99)
    course_id = f"{dept}{level}"
    course_name = f"{topic} {dept}"
    
    while any(c[0] == course_id for c in courses):
        level = random.randint(1, 4) * 100 + random.randint(1, 99)
        course_id = f"{dept}{level}"
        
    courses.append((course_id, course_name))

course_ids = [c[0] for c in courses]

with open("courses_large.csv", "w", newline='') as f:
    writer = csv.writer(f)
    writer.writerow(["CourseID", "CourseName"])
    writer.writerows(courses)

# To guarantee exactly 20 conflicts (edges in the graph),
# we pre-select 20 distinct pairs of courses.
possible_pairs = []
for i in range(len(course_ids)):
    for j in range(i + 1, len(course_ids)):
        possible_pairs.append((course_ids[i], course_ids[j]))

conflict_pairs = random.sample(possible_pairs, min(NUM_CONFLICTS, len(possible_pairs)))

enrollments = []
for i in range(1, NUM_STUDENTS + 1):
    student_id = f"STU{100000 + i}"
    
    # Give the student either 1 isolated course (no conflict generated)
    # OR exactly 2 courses from our pre-approved conflict pairs list
    if random.random() < 0.4 and len(conflict_pairs) > 0:
        pair = random.choice(conflict_pairs)
        enrollments.append((student_id, pair[0]))
        enrollments.append((student_id, pair[1]))
    else:
        # Just 1 random course
        c = random.choice(course_ids)
        enrollments.append((student_id, c))

with open("enrollments_large.csv", "w", newline='') as f:
    writer = csv.writer(f)
    writer.writerow(["StudentID", "CourseID"])
    writer.writerows(enrollments)

print(f"Successfully generated courses_large.csv ({len(courses)} courses)")
print(f"Successfully generated enrollments_large.csv ({len(enrollments)} enrollments for {NUM_STUDENTS} students)")
print(f"Maximum guaranteed graph conflicts (edges): {NUM_CONFLICTS}")
