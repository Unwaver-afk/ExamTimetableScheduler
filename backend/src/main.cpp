#define CROW_ENABLE_DEBUG
#include "crow.h"
#include <nlohmann/json.hpp>

using json = nlohmann::json;

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
        // CORS header for React frontend
        res.add_header("Access-Control-Allow-Origin", "*");
        return res;
    });

    app.port(8080).multithreaded().run();
}
