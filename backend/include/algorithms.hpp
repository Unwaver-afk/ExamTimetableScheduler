#pragma once

#include <vector>
#include <string>
#include <functional>

namespace algorithms {

    /**
     * @brief DAA SYLLABUS ALIGNMENT: Unit 1 & 2 (Divide and Conquer, Sorting)
     * 
     * Custom implementation of Merge Sort to sort a vector of any type T 
     * based on a provided comparator function.
     * 
     * Time Complexity: O(N log N)
     * Space Complexity: O(N) for temporary arrays
     */
    template <typename T>
    void merge(std::vector<T>& arr, int left, int mid, int right, std::function<bool(const T&, const T&)> cmp) {
        int n1 = mid - left + 1;
        int n2 = right - mid;

        std::vector<T> L(n1);
        std::vector<T> R(n2);

        for (int i = 0; i < n1; i++) L[i] = arr[left + i];
        for (int j = 0; j < n2; j++) R[j] = arr[mid + 1 + j];

        int i = 0, j = 0, k = left;
        while (i < n1 && j < n2) {
            // cmp(L[i], R[j]) determines if L[i] should come before R[j]
            if (cmp(L[i], R[j])) {
                arr[k] = L[i];
                i++;
            } else {
                arr[k] = R[j];
                j++;
            }
            k++;
        }

        while (i < n1) {
            arr[k] = L[i];
            i++;
            k++;
        }

        while (j < n2) {
            arr[k] = R[j];
            j++;
            k++;
        }
    }

    template <typename T>
    void merge_sort_helper(std::vector<T>& arr, int left, int right, std::function<bool(const T&, const T&)> cmp) {
        if (left >= right) return;
        int mid = left + (right - left) / 2;
        merge_sort_helper(arr, left, mid, cmp);
        merge_sort_helper(arr, mid + 1, right, cmp);
        merge(arr, left, mid, right, cmp);
    }

    template <typename T>
    void merge_sort(std::vector<T>& arr, std::function<bool(const T&, const T&)> cmp) {
        if (arr.empty()) return;
        merge_sort_helper(arr, 0, arr.size() - 1, cmp);
    }

    /**
     * @brief DAA SYLLABUS ALIGNMENT: Unit 1 & 2 (Searching, Divide and Conquer)
     * 
     * Custom implementation of Binary Search to find an element in a sorted vector.
     * Assumes the vector is already sorted in ascending order of the key.
     * 
     * Time Complexity: O(log N)
     * Space Complexity: O(1)
     */
    template <typename T, typename KeyType>
    int binary_search(const std::vector<T>& arr, const KeyType& key, std::function<KeyType(const T&)> extract_key) {
        int left = 0;
        int right = arr.size() - 1;

        while (left <= right) {
            int mid = left + (right - left) / 2;
            KeyType mid_key = extract_key(arr[mid]);

            if (mid_key == key) {
                return mid; // Found
            } else if (mid_key < key) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        return -1; // Not found
    }

}
