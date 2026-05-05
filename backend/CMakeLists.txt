cmake_minimum_required(VERSION 3.15)
project(ExamTimetableScheduler CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Crow REQUIRED)
find_package(nlohmann_json REQUIRED)

add_executable(scheduler src/main.cpp src/csv_parser.cpp src/conflict_graph.cpp)

target_include_directories(scheduler PRIVATE include)

target_link_libraries(scheduler PRIVATE Crow::Crow nlohmann_json::nlohmann_json)
