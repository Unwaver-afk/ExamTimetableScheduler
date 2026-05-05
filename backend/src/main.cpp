#define CROW_ENABLE_DEBUG
#include "crow.h"
#include <nlohmann/json.hpp>
#include "models.hpp"
#include "csv_parser.hpp"

using json = nlohmann::json;

// Global data store for Phase 2
models::SchedulingData global_data;

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
        
        auto courses_csv = req.url_params.get("courses_csv"); // we can receive strings in body or via multipart, let's assume JSON body for simplicity. Wait, standard file upload is multipart/form-data.

        // We will parse JSON body for now, assuming frontend converts CSV to string or sends raw strings.
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

        json response_data;
        response_data["status"] = "success";
        response_data["parsed_courses_count"] = global_data.courses.size();
        response_data["parsed_students_count"] = global_data.students.size();
        
        res.body = response_data.dump();
        res.add_header("Content-Type", "application/json");
        return res;
    });

    app.port(8080).multithreaded().run();
}
