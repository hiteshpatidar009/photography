<?php
http_response_code(503);
header('Content-Type: application/json');
echo json_encode(['error' => 'RSVP is not configured. Please use the wedding invitation page for updates.']);
