<?php
// Set the content type to JSON and the charset to UTF-8
header("Content-type: application/json; charset=utf-8");

// Load the dictionary words from a file
$words = @file_get_contents('ng8dictionary.txt');

// Add a custom header with a SHA-256 hash of the words
header("x-neogate-construct: " . hash('sha256', $words));

// Initialize variables
$return = array();
$length = isset($_GET['length']) ? intval($_GET['length']) : 0;
$count = isset($_GET['count']) ? intval($_GET['count']) : 0;
$i = 0;
$failsafe = 0;

// Check if the file was loaded and the required parameters are set and valid
if ($words !== FALSE && $length > 0 && $count > 0) {

    // Split the words into an array
    $words = explode(" ", $words);

    // Ensure the words array is not empty
    if (count($words) > 0) {

        // Loop to find the required number of words with the specified length
        while ($i < $count) {
            // Generate a random index to pick a word
            $index = rand(0, count($words) - 1);

            // Check if the word meets the length requirement
            if (strlen($words[$index]) == $length) {
                $return["words"][$words[$index]] = $words[$index];

                // Check to see if it's already in the array, if so, increment failsafe
                if (count($return) == $i) {
                    $failsafe++;
                } else {
                    $i++;
                }

            } else {
                $failsafe++;
            }

            // Break the loop if it fails too many times (to avoid infinite loops)
            if ($failsafe > 1000) {
                break;
            }
        }
    }
}

$r = array();
foreach ($return["words"] as $item) {
    $r["words"][] = $item;
}

// Output the result as a JSON-encoded string
echo json_encode($r);