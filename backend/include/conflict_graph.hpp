#pragma once

#include "models.hpp"
#include <unordered_map>
#include <unordered_set>
#include <vector>
#include <string>

namespace scheduling {

    /**
     * @brief Represents the graph of course conflicts.
     * Nodes are Courses.
     * Edges exist between two Courses if they share at least one student.
     */
    class ConflictGraph {
    public:
        // Builds the graph from the global SchedulingData
        void build_graph(const models::SchedulingData& data);

        // Returns the list of course IDs sorted by their degree (number of conflicts)
        // DAA SYLLABUS ALIGNMENT: Uses our custom Merge Sort
        std::vector<std::string> get_courses_sorted_by_degree() const;

        // Number of conflicts for a specific course
        int get_degree(const std::string& course_id) const;

        // Check if two courses have a conflict
        bool has_conflict(const std::string& course1, const std::string& course2) const;

        const std::unordered_map<std::string, std::unordered_set<std::string>>& get_adjacency_list() const {
            return adj_list;
        }

    private:
        // Adjacency list representation of the graph
        std::unordered_map<std::string, std::unordered_set<std::string>> adj_list;
    };

}
