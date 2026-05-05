#pragma once

#include "models.hpp"
#include "conflict_graph.hpp"
#include <vector>
#include <string>
#include <unordered_map>

namespace scheduling {

    class TimetableScheduler {
    public:
        /**
         * @brief DAA SYLLABUS ALIGNMENT: Unit 4 (Greedy Algorithms - Coloring)
         * 
         * Implements the Welsh-Powell Algorithm.
         * Sorts vertices by degree, then greedily assigns the lowest available color (time slot) 
         * to each non-conflicting vertex.
         * 
         * @return The number of time slots used.
         */
        static int schedule_greedy_welsh_powell(models::SchedulingData& data, const ConflictGraph& graph);

        /**
         * @brief DAA SYLLABUS ALIGNMENT: Unit 3 (Backtracking Algorithms - M Coloring)
         * 
         * Uses backtracking to find if the graph can be colored with a maximum of `max_slots` colors.
         * Attempts to assign colors 0 to max_slots-1. If a valid assignment is found, 
         * the courses are updated with their assigned slots.
         * 
         * @return true if successful, false if it cannot be scheduled within max_slots.
         */
        static bool schedule_backtracking_m_coloring(models::SchedulingData& data, const ConflictGraph& graph, int max_slots);

    private:
        static bool backtracking_helper(
            const std::vector<std::string>& courses,
            int current_idx,
            std::unordered_map<std::string, int>& color_assignment,
            int max_slots,
            const ConflictGraph& graph
        );

        static bool is_safe(
            const std::string& course,
            int color,
            const std::unordered_map<std::string, int>& color_assignment,
            const ConflictGraph& graph
        );
    };

}
