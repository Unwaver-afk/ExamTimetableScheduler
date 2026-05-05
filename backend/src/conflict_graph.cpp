#include "conflict_graph.hpp"
#include "algorithms.hpp"
#include <iostream>

namespace scheduling {

    void ConflictGraph::build_graph(const models::SchedulingData& data) {
        adj_list.clear();

        // Initialize adjacency list for all known courses to ensure isolated nodes exist
        for (const auto& pair : data.courses) {
            adj_list[pair.first] = std::unordered_set<std::string>();
        }

        // Iterate through each student to find course conflicts
        for (const auto& pair : data.students) {
            const auto& courses = pair.second.enrolled_courses;
            // If a student is taking multiple courses, all those courses conflict with each other
            for (size_t i = 0; i < courses.size(); i++) {
                for (size_t j = i + 1; j < courses.size(); j++) {
                    const std::string& c1 = courses[i];
                    const std::string& c2 = courses[j];
                    
                    if (c1 != c2) {
                        adj_list[c1].insert(c2);
                        adj_list[c2].insert(c1);
                    }
                }
            }
        }
    }

    std::vector<std::string> ConflictGraph::get_courses_sorted_by_degree() const {
        std::vector<std::string> courses;
        courses.reserve(adj_list.size());
        for (const auto& pair : adj_list) {
            courses.push_back(pair.first);
        }

        // DAA SYLLABUS ALIGNMENT: Unit 1 & 2
        // We use our custom Merge Sort instead of std::sort to demonstrate Divide and Conquer.
        // We sort by degree (number of conflicts) in descending order.
        algorithms::merge_sort<std::string>(courses, [this](const std::string& a, const std::string& b) {
            return this->get_degree(a) > this->get_degree(b);
        });

        return courses;
    }

    int ConflictGraph::get_degree(const std::string& course_id) const {
        auto it = adj_list.find(course_id);
        if (it != adj_list.end()) {
            return it->second.size();
        }
        return 0;
    }

    bool ConflictGraph::has_conflict(const std::string& course1, const std::string& course2) const {
        auto it = adj_list.find(course1);
        if (it != adj_list.end()) {
            return it->second.find(course2) != it->second.end();
        }
        return false;
    }

}
