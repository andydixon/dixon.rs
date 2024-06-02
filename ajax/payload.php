<?php
// Set the content type to JSON and the charset to UTF-8
header("Content-type: application/json; charset=utf-8");

// Initialize variables
$return = array();
$length = isset($_GET['length']) ? intval(round($_GET['length'],0)) : 0;
$count = isset($_GET['count']) ? intval(round($_GET['count'],0)) : 0;
$i = 0;
$failsafe = 0;

// Load the dictionary words from a file
$words = @file_get_contents($length.'.txt');

// Add a custom header with a SHA-256 hash of the words
header("x-neogate-construct: " . hash('sha256', $words));

// Check if the file was loaded and the required parameters are set and valid
if ($words !== FALSE && $length > 0 && $count > 0) {

    // Split the words into an array
    $words = explode(" ", trim($words));

    // Ensure the words array is not empty
    if (count($words) > 0) {

        // Loop to find the required number of words with the specified length
        while ($i < $count) {
            // Generate a random index to pick a word
            $index = rand(0, count($words) - 1);
            $return["words"][] = $words[$index];
            $i++;
        }
    }
}

// Output the result as a JSON-encoded string
echo json_encode($return);