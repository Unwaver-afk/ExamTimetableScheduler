#pragma once

#include "models.hpp"
#include <vector>
#include <string>

namespace scheduling {

    class RoomAllocator {
    public:
        /**
         * @brief DAA SYLLABUS ALIGNMENT: Unit 4 (Greedy Algorithms - Bin Packing)
         * 
         * Uses First Fit Decreasing (FFD) to assign courses (with their enrollment sizes)
         * into rooms (bins with fixed capacity) for a specific time slot.
         */
        static void allocate_rooms_greedy(models::SchedulingData& data);

        /**
         * @brief DAA SYLLABUS ALIGNMENT: Unit 5 (Dynamic Programming - 0/1 Knapsack)
         * 
         * If rooms are scarce, this uses the 0/1 Knapsack algorithm to maximize
         * the number of students assigned to a room based on its capacity.
         */
        static void allocate_rooms_dp(models::SchedulingData& data);
    };

}
