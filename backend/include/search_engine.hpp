#pragma once

#include <string>
#include <vector>
#include <unordered_map>
#include <memory>

namespace search {

    /**
     * @brief DAA SYLLABUS ALIGNMENT: Unit 6 (String Algorithms - Tries)
     */
    class TrieNode {
    public:
        std::unordered_map<char, std::shared_ptr<TrieNode>> children;
        bool is_end_of_word = false;
        std::vector<std::string> course_ids; // Courses matching this prefix
    };

    class CourseSearchEngine {
    public:
        CourseSearchEngine() : root(std::make_shared<TrieNode>()) {}

        void insert_course(const std::string& course_name, const std::string& course_id);
        std::vector<std::string> autocomplete(const std::string& prefix) const;

        /**
         * @brief DAA SYLLABUS ALIGNMENT: Unit 6 (String Algorithms - KMP)
         */
        static bool kmp_search(const std::string& text, const std::string& pattern);

    private:
        std::shared_ptr<TrieNode> root;
        static std::vector<int> compute_lps(const std::string& pattern);
    };

}
