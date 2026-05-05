#define CROW_ENABLE_DEBUG
#include "crow.h"
#include <nlohmann/json.hpp>
#include "models.hpp"
#include "csv_parser.hpp"
#include "conflict_graph.hpp"
#include "scheduler.hpp"

using json = nlohmann::json;

// Global data store for Phase 2, 3 & 4
models::SchedulingData global_data;
scheduling::ConflictGraph global_graph;

int main() {
    crow::SimpleApp app;

    CROW_ROUTE(app, "/api/ping")
    ([](){
        json response = {
            {"status", "success"},
            {"message", "Exam Timetable Scheduler Backend is running!"}
        };
        crow::response res(response.dump());
        res.add_header("Content-Type", "application/json");
        res.add_header("Access-Control-Allow-Origin", "*");
        return res;
    });

    CROW_ROUTE(app, "/api/upload").methods(crow::HTTPMethod::POST)
    ([](const crow::request& req){
        crow::response res;
        res.add_header("Access-Control-Allow-Origin", "*");
        
        auto req_body = json::parse(req.body, nullptr, false);
        if (req_body.is_discarded()) {
            res.code = 400;
            res.body = R"({"error": "Invalid JSON payload"})";
            return res;
        }

        global_data = models::SchedulingData(); // reset data
        
        if (req_body.contains("courses_csv") && req_body["courses_csv"].is_string()) {
            csv_parser::parse_courses(req_body["courses_csv"].get<std::string>(), global_data);
        }
        
        if (req_body.contains("enrollments_csv") && req_body["enrollments_csv"].is_string()) {
            csv_parser::parse_enrollments(req_body["enrollments_csv"].get<std::string>(), global_data);
        }

        // Phase 3: Build Conflict Graph
        global_graph.build_graph(global_data);

        json response_data;
        response_data["status"] = "success";
        response_data["parsed_courses_count"] = global_data.courses.size();
        response_data["parsed_students_count"] = global_data.students.size();
        response_data["conflict_graph_nodes"] = global_graph.get_adjacency_list().size();
        
        res.body = response_data.dump();
        res.add_header("Content-Type", "application/json");
        return res;
    });

    CROW_ROUTE(app, "/api/schedule").methods(crow::HTTPMethod::POST)
    ([](const crow::request& req){
        crow::response res;
        res.add_header("Access-Control-Allow-Origin", "*");

        auto req_body = json::parse(req.body, nullptr, false);
        std::string algo = "greedy";
        int max_slots = 10;

        if (!req_body.is_discarded()) {
            if (req_body.contains("algorithm") && req_body["algorithm"].is_string()) {
                algo = req_body["algorithm"].get<std::string>();
            }
            if (req_body.contains("max_slots") && req_body["max_slots"].is_number_integer()) {
                max_slots = req_body["max_slots"].get<int>();
            }
        }

        auto start_time = std::chrono::high_resolution_clock::now();
        int used_slots = 0;
        bool success = true;

        if (algo == "backtracking") {
            success = scheduling::TimetableScheduler::schedule_backtracking_m_coloring(global_data, global_graph, max_slots);
            if (success) used_slots = max_slots; // Approximation, we just know it fit in max_slots
        } else {
            // Default to greedy Welsh-Powell
            used_slots = scheduling::TimetableScheduler::schedule_greedy_welsh_powell(global_data, global_graph);
        }

        auto end_time = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end_time - start_time).count();

        json response_data;
        if (!success) {
            response_data["status"] = "error";
            response_data["message"] = "Backtracking failed to schedule within " + std::to_string(max_slots) + " slots.";
        } else {
            response_data["status"] = "success";
            response_data["used_slots"] = used_slots;
            response_data["execution_time_ms"] = duration;
            response_data["algorithm_used"] = algo;
            
            // Build scheduled list
            json assignments = json::array();
            for (const auto& pair : global_data.courses) {
                assignments.push_back({
                    {"course_id", pair.second.id},
                    {"course_name", pair.second.name},
                    {"slot", pair.second.assigned_slot},
                    {"enrollment", pair.second.enrollment_count}
                });
            }
            response_data["assignments"] = assignments;
        }

        res.body = response_data.dump();
        res.add_header("Content-Type", "application/json");
        return res;
    });

    app.port(8080).multithreaded().run();
}
