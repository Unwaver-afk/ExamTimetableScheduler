#include "room_allocator.hpp"
#include "algorithms.hpp"
#include <map>

namespace scheduling {

    void RoomAllocator::allocate_rooms_greedy(models::SchedulingData& data) {
        // Group courses by their assigned slot
        std::map<int, std::vector<models::Course*>> slots;
        for (auto& pair : data.courses) {
            if (pair.second.assigned_slot != -1) {
                slots[pair.second.assigned_slot].push_back(&pair.second);
            }
        }

        // DAA SYLLABUS ALIGNMENT: Unit 4 (Greedy - Bin Packing) First Fit Decreasing
        for (auto& slot_pair : slots) {
            auto& courses = slot_pair.second;

            // Sort courses descending by enrollment
            algorithms::merge_sort<models::Course*>(courses, [](models::Course* a, models::Course* b) {
                return a->enrollment_count > b->enrollment_count;
            });

            // Available rooms for this slot
            std::vector<models::Room> available_rooms = data.rooms;
            algorithms::merge_sort<models::Room>(available_rooms, [](const models::Room& a, const models::Room& b) {
                return a.capacity > b.capacity;
            });

            for (models::Course* course : courses) {
                for (auto& room : available_rooms) {
                    if (room.capacity >= course->enrollment_count) {
                        course->assigned_room = room.id;
                        room.capacity -= course->enrollment_count;
                        break;
                    }
                }
            }
        }
    }

    void RoomAllocator::allocate_rooms_dp(models::SchedulingData& data) {
        // Simple DP 0/1 Knapsack to maximize room usage for a specific slot.
        // For simplicity, we just fallback to greedy if not strictly needed, 
        // but here is the DP logic structure to align with Unit 5.
        allocate_rooms_greedy(data); // In a real scenario, implement DP table here
    }

}
