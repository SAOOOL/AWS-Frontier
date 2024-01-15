<?php
use OCP\Util;
$appId = OCA\CatGifs\AppInfo\Application::APP_ID;
Util::addScript($appId, $appId . '-mainScript');
Util::addStyle($appId, 'main');
?>

<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" integrity="sha512-TyZxL5zc6Lz56nfG2S9RynMn5MCjDZTktDe3yrynBMFIBxJMCeCgF3qqSzk9TbBaFt9gdXF8vIPDZjE0Cuu9DA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/crypto-js.js" defer></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        /* Global Styles */
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            /* background-color: #1a1a1a; Dark background for the overall layout */
            color: #ccc; /* Light grey text for readability on dark background */
            line-height: 1.6;
        }

        /* color pallete */
        :root {
            --secondary-color: 	rgb(0, 71, 171); /* container borders */
            --accent-color: rgba(240, 103, 5, 0.8); /* buttons and bullet points */
            --scroll-bar: rgba(240, 103, 5, 0.8); /* all scroll bars */
            --list-items: #36454F; /* list items */
        }

        .grid-container {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin: 10px;
            padding: 10px;
            align-items: start;
            max-height: calc(100vh - 20px); /* Adjusted for margin */
            overflow: auto; /* Add scroll if content is too large */
        }

        /* properties for scrollbar */
        /* For Webkit browsers */
        ::-webkit-scrollbar {
            width: 12px; /* Width of the vertical scrollbar */
            height: 12px; /* Height of the horizontal scrollbar */
        }
        ::-webkit-scrollbar-thumb {
            background: var(--scroll-bar); /* The draggable scrolling handle, setting it to orange */
            border-radius: 10px; 
        }
        /* For Firefox */
        * {
            scrollbar-width: thin; /* 'auto' or 'thin' */
            scrollbar-color: var(--scroll-bar); /* thumb and track color */
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
            .grid-container {
                grid-template-columns: repeat(2, 1fr); /* 2 columns for tablets */
            }
        }
        @media (max-width: 480px) {
            .grid-container {
                grid-template-columns: 1fr; /* 1 column for mobile */
            }
        }
        
        .form-container,
        .app-content {
            background: linear-gradient(
                to right bottom, 
                rgba(28, 38, 46, 0.95), /* Dark matte blue-gray, base shade, with transparency */
                rgba(35, 47, 56, 0.95), /* A darker matte shade for depth, with transparency */
                rgba(45, 58, 69, 0.95) /* A more distinct matte intermediate shade, with transparency */
            );
            border: 3px solid var(--secondary-color); 
            border-radius: 10px;
            padding: 10px; /* Uniform padding */
        }

        .app-content {
            position: relative;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: stretch;
            height: auto;
            min-height: 275px;
            overflow: hidden;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            position: relative; 
        }
        
        .app-content::after {
            content: '';
            position: absolute;
            top: 0; /* Align to the top right corner */
            right: 0; /* Align to the top right corner */
            border-radius: 15px; 
        }

        .iam-roles::after {
            content: url('/apps-extra/catgifs/img/IAM.png'); 
        }
        .cloudtrail-events::after {
            content: url('/apps-extra/catgifs/img/ct.png'); 
        }
        .ec2::after {
            content: url('/apps-extra/catgifs/img/ec2.png');
        }
        .sqs-instance::after {
            content: url('/apps-extra/catgifs/img/sqs.png'); 
        }
        .rds-instance::after {
            content: url('/apps-extra/catgifs/img/rds.png'); 
        }
        .cloudwatch::after {
            content: url('/apps-extra/catgifs/img/cloudwatch.png'); 
        }
        .lambda::after {
            content: url('/apps-extra/catgifs/img/lamda.png'); 
        }
        .cost::after {
            content: url('/apps-extra/catgifs/img/cost.png'); 
        }
        

        .app-content:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px rgba(0, 0, 0, 0.3);
        }

        h3 {
            color: #ddd; /* Light grey for headings */
            margin-bottom: 0.5em;
            font-size: 1.25em;
            font-weight: 600;
            text-align: center;
            position: relative; /* Required for positioning the pseudo-element */
        }

        h3::after {
            content: ''; /* Required for pseudo-elements */
            display: block;
            width: 50%; 
            height: 4px; /* Thickness of the underline */
            background-color: rgba(240, 103, 5, 0.8); /* The color of the underline */
            position: absolute;
            left: 25%; /* Centers the underline relative to the text */
            bottom: -5px; 
            border-radius: 2px; /* Rounded corners */
        }

        p {
            color: #bbb; /* Slightly darker grey for paragraph text */
            margin-bottom: 1em;
            font-size: 1em;
        }

        .event-container ul {
            list-style: none;
            padding: 0;
            margin: 0;
            background: transparent; /* No background for the unordered list itself */
        }

        .event-container ul li {
            background: var(--list-items); /* White background for each list item */
            border-radius: 8px; /* Rounded edges for each list item */
            margin-bottom: 10px; /* Add space between list items */
            padding: 10px; /* Add some padding inside each list item */
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5); /* Subtle box-shadow for depth */
            position: relative; /* Needed for absolute positioning of the pseudo-element */
        }

        .event-container ul li::before {
            content: '•'; /* The bullet point */
            color: var(--accent-color); /* Dark bullet points for a subtle look */
            left: 0;
            top: 50%; /* Position the bullet at the vertical center of the li */
            transform: translateY(-50%); /* Center the bullet vertically */
            padding-right: 10px; /* Add some spacing between the bullet and the list text */
            margin-left: -20px; /* Move the bullet outside the li */
        }

        .event-container {
            padding: 10px; /* Uniform padding */
            max-height: 200px;
            overflow-y: auto;
            margin: 0;
        }

        .bucket-list {
            background-color: #262626; /* Even darker background for contrast */
        }

        .input-field {
            margin-bottom: 10px; /* Space between input fields */
            padding: 8px; /* Padding inside the input fields */
            border: 1px solid #ccc; /* Border color */
            border-radius: 4px; /* Rounded corners for input fields */
            font-size: 16px; /* Font size */
        }

        .btn-save {
            background-color: var(--accent-color);
            color: white; /* White text */
            padding: 10px 20px; /* Padding inside the button */
            border: none; /* No border */
            border-radius: 4px; /* Rounded corners for the button */
            cursor: pointer; /* Pointer cursor on hover */
            font-size: 16px; /* Font size */
        }

        .btn-save:hover {
            background-color: var(--accent-color); 
        }

        /* Add some space between the label and the input field */
        label {
            margin-bottom: 5px;
            display: block; /* Ensure the label takes up the full width */
            font-size: 14px; /* Font size for the label */
        }

        /* Remove the break and handle spacing with margin for a cleaner look */
        #api-keys-form br {
            display: none;
        }

        .form-container {
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Subtle shadow */
            max-width: 400px; /* Maximum width of the container */
            margin: 20px auto; /* Centering the container */
            box-sizing: border-box; /* Include padding in the width */
        }

        .form-header {
            transform: skew(-10deg);
            font-size: 28px; /* Larger font size */
            color: #5865F2;
            font-family: "Audiowide", sans-serif; /* Aggressive font */
            font-weight: 700; /* Bold weight */
            text-align: center; /* Center the text */
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5); /* Text shadow for depth */
            margin-bottom: 10px; /* Space between header and form */
        }

        .header-image {
            width: 150px; 
            height: 150px;
            object-fit: cover; /* This will cover the area without stretching the image */
            overflow: hidden; /* This ensures that any excess image outside the container's bounds is not visible */
        }

        #api-keys-form {
            display: flex;
            flex-direction: column; /* Stack the labels and inputs vertically */
        }

        .no-content-message {
            color: lightgray;
            font-style: italic;
            text-align: center;
            margin-top: 20px;
        }

        #costChart {
            flex: 1; /* This will allow the canvas to grow */
            min-width: 300px; /* Minimum width of the chart */
            max-width: 600px; /* Maximum width of the chart */
            height: auto; /* Height will adjust based on the width */
        }
        
        .cost-container {
            display: flex; /* This will allow the legend to sit to the right */
            justify-content: center; /* This will center the pie chart in the available space */
            align-items: center; /* This will vertically align the pie chart */

            padding: 10px; /* Uniform padding */
            max-height: 200px;
            overflow-y: auto;
            margin: 0;
        }

    </style>
</head>
<body>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/crypto-js.js"></script>
    <div class="form-container">
        <img src='/apps-extra/catgifs/img/logo.png' alt="logo" class="header-image">
        <div id="api-keys-form">
            <label for="access-key">Access Key:</label>
            <input type="text" id="access-key" class="input-field"><br>

            <label for="secret-key">Secret Key:</label>
            <input type="password" id="secret-key" class="input-field"><br>

            <button id="save-keys-button" class="btn-save">Save Keys</button>
        </div>
    </div>

    <div class="grid-container">
        <div class="app-content iam-roles">
            <h3>IAM User Names:</h3>
            <div class="event-container">
                <ul id="user-list"></ul>
            </div>
        </div>

        <div class="app-content iam-roles">
            <h3>IAM Roles:</h3>
            <div class="event-container">
                <ul id="role-list"></ul>
            </div>
        </div>

        <div class="app-content cloudtrail-events">
            <h3>CloudTrail Events:</h3>
            <div class="event-container">
                <ul id="event-list"></ul>
            </div>
        </div>

        <div id="ec2-instance-list" class="app-content ec2">
            <h3>EC2 Instances:</h3>
            <div class="event-container">
                <ul id="ec2-list"></ul>
            </div>
        </div>

        <div id="cost-list" class="app-content cost">
            <h3>Cost Explorer (Monthly):</h3>
            <div class="cost-container" style="display: flex;">
                <canvas id="costChart"></canvas> <!-- The chart will fill the flex container -->
            </div>
        </div>

        <div id="sqs-instance-list" class="app-content sqs-instance">
            <h3>SQS Lists:</h3>
            <div class="event-container">
                <ul id="sqs-list"></ul>
            </div>
        </div>

        <div id="rds-instance-list" class="app-content rds-instance">
            <h3>RDS Lists:</h3>
            <div class="event-container">
                <ul id="rds-list"></ul>
            </div>
        </div>

        <div id="cloudwatch-metrics" class="app-content cloudwatch">
            <h3>CloudWatch Metrics:</h3>
            <div class="event-container">
                <ul id="rule-list" ></ul>
            </div>
        </div>

        <div id="lambda-functions" class="app-content lambda">
            <h3>Lambda Functions:</h3>
            <div class="event-container">
                <ul id="lambda-list" ></ul>
            </div>
        </div>


        <script src="https://code.jquery.com/jquery-3.6.0.min.js" integrity="sha256-/xUj+5uQz5l8lp5z9xatK3XON9I826PpLXR1lu4jmpk=" crossorigin="anonymous"></script>
    </div>
</body>
</html>

