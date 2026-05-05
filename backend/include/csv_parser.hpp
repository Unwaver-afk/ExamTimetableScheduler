#pragma once

#include "models.hpp"
#include <string>

namespace csv_parser {

    // Parses a CSV containing course details (e.g., CourseID, CourseName)
    // and populates the data.courses map.
    bool parse_courses(const std::string& csv_content, models::SchedulingData& data);

    // Parses a CSV containing enrollments (e.g., StudentID, CourseID)
    // and populates the data.students map and updates course enrollment counts.
    bool parse_enrollments(const std::string& csv_content, models::SchedulingData& data);

}
