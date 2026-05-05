#include "scheduler.hpp"
#include <iostream>
#include <algorithm>

namespace scheduling {

    int TimetableScheduler::schedule_greedy_welsh_powell(models::SchedulingData& data, const ConflictGraph& graph) {
        // Step 1: Sort courses by degree descending (handled by our custom merge sort in Phase 3)
        std::vector<std::string> sorted_courses = graph.get_courses_sorted_by_degree();

        std::unordered_map<std::string, int> color_assignment;
        int max_color_used = -1;

        // Step 2: Assign colors greedily
        for (const std::string& current_course : sorted_courses) {
            if (color_assignment.find(current_course) != color_assignment.end()) {
                continue; // Already colored
            }

            max_color_used++;
            color_assignment[current_course] = max_color_used;

            // Try to assign this same color to other uncolored courses
            for (const std::string& other_course : sorted_courses) {
                if (color_assignment.find(other_course) == color_assignment.end()) {
                    if (is_safe(other_course, max_color_used, color_assignment, graph)) {
                        color_assignment[other_course] = max_color_used;
                    }
                }
            }
        }

        // Apply colors (slots) to global data
        for (auto& pair : data.courses) {
            if (color_assignment.find(pair.first) != color_assignment.end()) {
                pair.second.assigned_slot = color_assignment[pair.first];
            }
        }

        return max_color_used + 1; // Return total number of slots used
    }

    bool TimetableScheduler::is_safe(
        const std::string& course,
        int color,
        const std::unordered_map<std::string, int>& color_assignment,
        const ConflictGraph& graph
    ) {
        auto adj_list = graph.get_adjacency_list();
        auto it = adj_list.find(course);
        if (it != adj_list.end()) {
            for (const std::string& neighbor : it->second) {
                auto neighbor_color_it = color_assignment.find(neighbor);
                if (neighbor_color_it != color_assignment.end() && neighbor_color_it->second == color) {
                    return false; // Conflict found
                }
            }
        }
        return true;
    }

    bool TimetableScheduler::schedule_backtracking_m_coloring(models::SchedulingData& data, const ConflictGraph& graph, int max_slots) {
        std::vector<std::string> courses;
        for (const auto& pair : data.courses) {
            courses.push_back(pair.first);
        }

        std::unordered_map<std::string, int> color_assignment;
        
        if (backtracking_helper(courses, 0, color_assignment, max_slots, graph)) {
            // Apply assignments
            for (auto& pair : data.courses) {
                pair.second.assigned_slot = color_assignment[pair.first];
            }
            return true;
        }

        return false;
    }

    bool TimetableScheduler::backtracking_helper(
        const std::vector<std::string>& courses,
        int current_idx,
        std::unordered_map<std::string, int>& color_assignment,
        int max_slots,
        const ConflictGraph& graph
    ) {
        if (current_idx == courses.size()) {
            return true; // All courses colored successfully
        }

        std::string current_course = courses[current_idx];

        for (int c = 0; c < max_slots; c++) {
            if (is_safe(current_course, c, color_assignment, graph)) {
                color_assignment[current_course] = c;

                if (backtracking_helper(courses, current_idx + 1, color_assignment, max_slots, graph)) {
                    return true;
                }

                // Backtrack
                color_assignment.erase(current_course);
            }
        }

        return false; // No valid color found for this path
    }

}
