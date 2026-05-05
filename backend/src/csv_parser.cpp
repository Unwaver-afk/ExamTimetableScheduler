#include "csv_parser.hpp"
#include <sstream>
#include <vector>

namespace csv_parser {

    static std::vector<std::string> split_csv_line(const std::string& line) {
        std::vector<std::string> result;
        std::stringstream ss(line);
        std::string cell;
        
        while (std::getline(ss, cell, ',')) {
            // Trim carriage returns
            if (!cell.empty() && cell.back() == '\r') {
                cell.pop_back();
            }
            // Basic trimming of quotes (if any)
            if (cell.size() >= 2 && cell.front() == '"' && cell.back() == '"') {
                cell = cell.substr(1, cell.size() - 2);
            }
            result.push_back(cell);
        }
        return result;
    }

    bool parse_courses(const std::string& csv_content, models::SchedulingData& data) {
        std::stringstream ss(csv_content);
        std::string line;
        
        // Skip header
        if (!std::getline(ss, line)) return false;

        while (std::getline(ss, line)) {
            if (line.empty()) continue;
            auto cols = split_csv_line(line);
            if (cols.size() >= 2) {
                std::string id = cols[0];
                std::string name = cols[1];
                
                models::Course course;
                course.id = id;
                course.name = name;
                course.enrollment_count = 0;
                
                data.courses[id] = course;
            }
        }
        return true;
    }

    bool parse_enrollments(const std::string& csv_content, models::SchedulingData& data) {
        std::stringstream ss(csv_content);
        std::string line;
        
        // Skip header
        if (!std::getline(ss, line)) return false;

        while (std::getline(ss, line)) {
            if (line.empty()) continue;
            auto cols = split_csv_line(line);
            if (cols.size() >= 2) {
                std::string student_id = cols[0];
                std::string course_id = cols[1];
                
                // Add course to student
                data.students[student_id].id = student_id;
                data.students[student_id].enrolled_courses.push_back(course_id);
                
                // Increment course enrollment count
                if (data.courses.find(course_id) != data.courses.end()) {
                    data.courses[course_id].enrollment_count++;
                } else {
                    // Implicitly add course if it wasn't in courses.csv
                    models::Course course;
                    course.id = course_id;
                    course.name = "Unknown Course";
                    course.enrollment_count = 1;
                    data.courses[course_id] = course;
                }
            }
        }
        return true;
    }

}
