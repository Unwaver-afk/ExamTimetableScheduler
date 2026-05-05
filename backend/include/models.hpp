#pragma once

#include <string>
#include <vector>
#include <unordered_map>
#include <unordered_set>

namespace models {

    struct Course {
        std::string id;
        std::string name;
        int enrollment_count = 0;
        
        // ID of the assigned time slot (e.g., 0, 1, 2...)
        int assigned_slot = -1;
        // Assigned room ID
        std::string assigned_room = "";
    };

    struct Student {
        std::string id;
        std::string name;
        std::vector<std::string> enrolled_courses;
    };

    struct Room {
        std::string id;
        int capacity;
    };

    struct ExamSlot {
        int id;
        std::string day;
        std::string time;
        std::vector<std::string> scheduled_courses;
    };

    // Global state representing the input data
    struct SchedulingData {
        std::unordered_map<std::string, Course> courses;
        std::unordered_map<std::string, Student> students;
        std::vector<Room> rooms;
        std::vector<ExamSlot> slots;
    };

}
