#include "search_engine.hpp"
#include <algorithm>
#include <cctype>

namespace search {

    static std::string to_lower(const std::string& str) {
        std::string lower_str = str;
        std::transform(lower_str.begin(), lower_str.end(), lower_str.begin(),
            [](unsigned char c){ return std::tolower(c); });
        return lower_str;
    }

    void CourseSearchEngine::insert_course(const std::string& course_name, const std::string& course_id) {
        std::shared_ptr<TrieNode> curr = root;
        std::string lower_name = to_lower(course_name);

        for (char c : lower_name) {
            if (curr->children.find(c) == curr->children.end()) {
                curr->children[c] = std::make_shared<TrieNode>();
            }
            curr = curr->children[c];
            curr->course_ids.push_back(course_id);
        }
        curr->is_end_of_word = true;
    }

    std::vector<std::string> CourseSearchEngine::autocomplete(const std::string& prefix) const {
        std::shared_ptr<TrieNode> curr = root;
        std::string lower_prefix = to_lower(prefix);

        for (char c : lower_prefix) {
            if (curr->children.find(c) == curr->children.end()) {
                return {}; // No match
            }
            curr = curr->children[c];
        }
        return curr->course_ids;
    }

    std::vector<int> CourseSearchEngine::compute_lps(const std::string& pattern) {
        int m = pattern.length();
        std::vector<int> lps(m, 0);
        int len = 0;
        int i = 1;

        while (i < m) {
            if (pattern[i] == pattern[len]) {
                len++;
                lps[i] = len;
                i++;
            } else {
                if (len != 0) {
                    len = lps[len - 1];
                } else {
                    lps[i] = 0;
                    i++;
                }
            }
        }
        return lps;
    }

    bool CourseSearchEngine::kmp_search(const std::string& text, const std::string& pattern) {
        if (pattern.empty()) return true;

        std::string lower_text = to_lower(text);
        std::string lower_pattern = to_lower(pattern);

        std::vector<int> lps = compute_lps(lower_pattern);
        int n = lower_text.length();
        int m = lower_pattern.length();
        int i = 0; // index for text
        int j = 0; // index for pattern

        while ((n - i) >= (m - j)) {
            if (lower_pattern[j] == lower_text[i]) {
                j++;
                i++;
            }

            if (j == m) {
                return true; // Match found
            } else if (i < n && lower_pattern[j] != lower_text[i]) {
                if (j != 0) {
                    j = lps[j - 1];
                } else {
                    i++;
                }
            }
        }
        return false;
    }

}
