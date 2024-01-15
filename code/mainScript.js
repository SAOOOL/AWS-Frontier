import axios from '@nextcloud/axios';
import { generateUrl, imagePath } from '@nextcloud/router'
import { loadState } from '@nextcloud/initial-state'
import { showSuccess, showError } from '@nextcloud/dialogs';
const crypto = require('crypto');

function main() {

	function encrypt(text,encryptionKey) {
		const key = CryptoJS.enc.Hex.parse(encryptionKey);
		const iv = CryptoJS.lib.WordArray.random(16);
		const cipherText = CryptoJS.AES.encrypt(text, key, {
		  iv: iv,
		  mode: CryptoJS.mode.CBC,
		  padding: CryptoJS.pad.Pkcs7,
		});
		return iv.toString() + cipherText.toString();
	}
		
	function decrypt(encryptedText, encryptionKey) {
		const key = CryptoJS.enc.Hex.parse(encryptionKey);
		const iv = CryptoJS.enc.Hex.parse(encryptedText.substring(0, 32));
		const cipherText = encryptedText.substring(32);
		const decrypted = CryptoJS.AES.decrypt(cipherText, key, {
		  iv: iv,
		  mode: CryptoJS.mode.CBC,
		  padding: CryptoJS.pad.Pkcs7,
		});
		return decrypted.toString(CryptoJS.enc.Utf8);
	}

	// Generate a 32-byte (256-bit) key in hexadecimal format
	const generateEncryptionKey = () => {
		const byteLength = 32; // 32 bytes = 256 bits
		return crypto.randomBytes(byteLength).toString('hex');
	};

	function saveApiKeysToLocalStorage() {
		const accessKey = encrypt(document.getElementById("access-key").value, storedencryptionKey);
		const secretKey = encrypt(document.getElementById("secret-key").value, storedencryptionKey);
		localStorage.setItem("accessKey", accessKey);
		localStorage.setItem("secretKey", secretKey);
		alert("API keys saved!");
	}

	//load encrption key or create one if absent
	const storedencryptionKey = localStorage.getItem("encryptionKey");
	if (!storedencryptionKey){
		localStorage.setItem("encryptionKey", generateEncryptionKey());
		storedencryptionKey = localStorage.getItem("encryptionKey");
	}

	// Attach an event listener to the "Save Keys" button
	document.getElementById("save-keys-button").addEventListener("click", saveApiKeysToLocalStorage);

	// Load the API keys from localStorage (if available)
	const storedAccessKey = decrypt(localStorage.getItem("accessKey"), storedencryptionKey);
	const storedSecretKey = decrypt(localStorage.getItem("secretKey"), storedencryptionKey);
	
	//Used AWS Region
	const region = 'us-east-1';

	if (storedAccessKey && storedSecretKey) {
		const AWS = require('aws-sdk');
		AWS.config.update({
		accessKeyId: storedAccessKey,
		secretAccessKey: storedSecretKey,
		region,
		});

		//Uncomment below code when debugging Encrytion 
		// SECURITY HAZARD, DEVELOPEMENT PURPOSES ONLY
		// console.log("Personal encrpytionKey: " + storedencryptionKey);
		// console.log("Encrypted Access Key: " + localStorage.getItem("accessKey"));
		// console.log("Encrypted Secret Key: " + localStorage.getItem("secretKey"));
		// console.log("Decrypted Access Key: " + storedAccessKey);
		// console.log("Decrypted Secret Key: " + storedSecretKey);
		
		//Declaration for each API call
		const cwevents = new AWS.CloudWatchEvents({apiVersion: '2015-10-07'});
		const iam = new AWS.IAM();
		const cloudTrail = new AWS.CloudTrail({ region: region });
		const ec2 = new AWS.EC2({region: region});
    	const sqs = new AWS.SQS({region: region});
		const rds = new AWS.RDS({region: region});
		const lambda = new AWS.Lambda({region: region});
		const costExplorer = new AWS.CostExplorer({region: region});
		

		// Pre-fill the input fields with the stored keys
		document.getElementById("access-key").value = storedAccessKey;
		document.getElementById("secret-key").value = storedSecretKey;
		
		// List CloudWatch Events rules
		cwevents.listRules({}, (err, data) => {
			if (err) {
				showError('Error listing CloudWatch Events rules: ' + err.message);
			} else {
				const ruleList = document.getElementById('rule-list');
				if (data.Rules && data.Rules.length > 0) {
					data.Rules.forEach((rule) => {
						const ruleName = rule.Name;
						const listItem = document.createElement('li');
						listItem.textContent = ruleName;
						ruleList.appendChild(listItem);
					});
				} else {
					const noContentMsg = document.createElement('p');
					noContentMsg.textContent = 'No CloudWatch Warnings';
					noContentMsg.className = 'no-content-message';
					ruleList.appendChild(noContentMsg);
				}
			}
		});
		

		// List IAM users
		iam.listUsers({}, (err, userData) => {
			if (err) {
				showError('Error listing AWS IAM users: ' + err.message);
			} else {
				const userList = document.getElementById('user-list');
				if (userData.Users.length > 0) {
					userData.Users.forEach((user) => {
						const userName = user.UserName;
						const listItem = document.createElement('li');
						listItem.textContent = userName;
						userList.appendChild(listItem);
					});
				} else {
					const noContentMsg = document.createElement('p');
					noContentMsg.textContent = 'No Content';
					noContentMsg.className = 'no-content-message';
					userList.appendChild(noContentMsg);
				}
			}
		});
		
		// List IAM roles
		iam.listRoles({}, (err, roleData) => {
			if (err) {
			showError('Error listing AWS IAM roles: ' + err.message);
			} else {
			if (roleData.Roles.length > 0) {
				const roleList = document.getElementById('role-list');
		
				roleData.Roles.forEach((role) => {
				const roleName = role.RoleName;
				const listItem = document.createElement('li');
				listItem.textContent = roleName;
				roleList.appendChild(listItem);
				});
			} else {
				const noContentMsg = document.createElement('p');
				noContentMsg.textContent = 'No Content';
				noContentMsg.className = 'no-content-message';
				userList.appendChild(noContentMsg);
			}
			}
		});
		
		//EC2 Logic
		ec2.describeInstances({}, (err, data) => {
			if (err) {
			  showError('Error listing EC2 instances: ' + err.message);
			} else {
			  const instances = data.Reservations.reduce((acc, reservation) => {
				return acc.concat(reservation.Instances);
			  }, []);
		  
			  if (instances.length > 0) {
				const ec2List = document.getElementById('ec2-list');
		  
				instances.forEach((instance) => {
				  const instanceNameTag = instance.Tags.find((tag) => tag.Key === 'Name');
				  const instanceName = instanceNameTag ? instanceNameTag.Value : 'Unnamed';
		  
				  const listItem = document.createElement('li');
				  listItem.textContent = `Instance Name: ${instanceName}, State: ${instance.State.Name}`;
				  ec2List.appendChild(listItem);
				});
			  } else {
				const noContentMsg = document.createElement('p');
				noContentMsg.textContent = 'No Content';
				noContentMsg.className = 'no-content-message';
				userList.appendChild(noContentMsg);
			  }
			}
		});
		
		//SQS logic
		sqs.listQueues({}, (err, data) => {
			if (err) {
			  showError('Error listing SQS queues: ' + err.message);
			} else {
			  if (data.QueueUrls.length > 0) {
				const sqsList = document.getElementById('sqs-list');
		  
				data.QueueUrls.forEach((queueUrl) => {
				  const queueName = queueUrl.substring(queueUrl.lastIndexOf('/') + 1);
		  
				  const listItem = document.createElement('li');
				  listItem.textContent = `Queue Name: ${queueName}`;
				  sqsList.appendChild(listItem);
				});
			  } else {
				const noContentMsg = document.createElement('p');
				noContentMsg.textContent = 'No Content';
				noContentMsg.className = 'no-content-message';
				userList.appendChild(noContentMsg);
			  }
			}
		});

		//RDS Logic
		rds.describeDBInstances({}, (err, data) => {
			if (err) {
			  showError('Error listing RDS databases: ' + err.message);
			} else {
			  if (data.DBInstances.length > 0) {
				const rdsList = document.getElementById('rds-list');
		  
				data.DBInstances.forEach((dbInstance) => {
				  const dbName = dbInstance.DBInstanceIdentifier;
				  const dbEngine = dbInstance.Engine;
				  const dbStatus = dbInstance.DBInstanceStatus;
		  
				  const listItem = document.createElement('li');
				  listItem.textContent = `Database Name: ${dbName}, Engine: ${dbEngine}, Status: ${dbStatus}`;
				  rdsList.appendChild(listItem);
				});
			  } else {
				const noContentMsg = document.createElement('p');
				noContentMsg.textContent = 'No Content';
				noContentMsg.className = 'no-content-message';
				userList.appendChild(noContentMsg);
			  }
			}
		});

		// Make a CloudTrail API call, for example, list recent events
		cloudTrail.lookupEvents({ MaxResults: 10 }, (err, data) => {
			if (err) {
			showError('Error getting CloudTrail events: ' + err.message);
			} else {
			if (data.Events.length > 0) {
				const eventList = document.getElementById('event-list');

				data.Events.forEach((event) => {
				// Parse the CloudTrail event JSON
				const cloudTrailEvent = JSON.parse(event.CloudTrailEvent);

				// Create a container div for each event
				const eventDiv = document.createElement('div');
				eventDiv.classList.add('event-container');

				// Add event information with new lines
				eventDiv.innerHTML = `
					<p>Event Name: ${event.EventName}</p>
					<p>Event Time: ${event.EventTime}</p>
					<p>Event Source: ${event.EventSource}</p>
					<p>Event Region: ${cloudTrailEvent.awsRegion}</p>
					<p>Request Parameters: ${JSON.stringify(cloudTrailEvent.requestParameters, null, 2)}</p>
					<p>Request ID: ${cloudTrailEvent.requestID}</p>
				`;

				// Append the event container to the event list
				eventList.appendChild(eventDiv);

				// Add an empty row (line) between events
				const emptyRow = document.createElement('div');
				emptyRow.classList.add('empty-row');
				eventList.appendChild(emptyRow);
				});
			} else {
				const noContentMsg = document.createElement('p');
				noContentMsg.textContent = 'No Content';
				noContentMsg.className = 'no-content-message';
				userList.appendChild(noContentMsg);
			}
			}
		});

    lambda.listFunctions({}, (err, data) => {
      if (err) {
        showError('Error listing Lambda functions: ' + err.message);
      } else {
        if (data.Functions.length > 0) {
          const lambdaList = document.getElementById('lambda-list');
  
          data.Functions.forEach((lambdaFunction) => {
            const functionName = lambdaFunction.FunctionName;
  
            const listItem = document.createElement('li');
            listItem.textContent = `Function Name: ${functionName}`;
            lambdaList.appendChild(listItem);
          });
        } else {
			const noContentMsg = document.createElement('p');
			noContentMsg.textContent = 'No Content';
			noContentMsg.className = 'no-content-message';
			userList.appendChild(noContentMsg);
        }
      }
    });

  const now = new Date();
  // Set the start date to the first day of the current month
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().substring(0, 10);
  // Set the end date to the current date
  const endDate = now.toISOString().substring(0, 10)

  const params = {
    TimePeriod: {
      Start: startDate,
      End: endDate,
    },
    Granularity: 'MONTHLY',
    Metrics: ['AmortizedCost', 'UnblendedCost', 'BlendedCost', 'NetUnblendedCost', 'NetAmortizedCost'],
    GroupBy: [
      {
        Type: 'DIMENSION',
        Key: 'SERVICE',
      },
    ],
  };

  costExplorer.getCostAndUsage(params, (err, data) => {
    if (err) {
        showError('Error retrieving AWS cost information: ' + err.message);
    } else {
        if (data.ResultsByTime && data.ResultsByTime.length > 0) {
            const serviceNames = [];
            const serviceCosts = [];
            
            data.ResultsByTime.forEach((result) => {
                result.Groups.forEach((group) => {
                    const amount = parseFloat(group.Metrics.UnblendedCost.Amount);
                    const service = group.Keys[0];
                    
                    serviceNames.push(service);
                    serviceCosts.push(amount);
                });
            });

            // Call function to render chart
            renderChart(serviceNames, serviceCosts);
        } else {
            showSuccess('No cost data found.');
        }
    }
});

function renderChart(serviceNames, serviceCosts) {
    // Define an array of colors for the chart slices
	const colors = [
		'#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#F77825',
		'#9966FF', '#00A86B', '#C9CBCF', '#7CDDDD', '#FF9F40'
		// Add more colors as needed
	];

	// Assume serviceNames and serviceCosts are your original arrays
	const nonZeroServiceNames = [];
	const nonZeroServiceCosts = [];
	const nonZeroColors = []; // If you're using a predefined array of colors

	serviceCosts.forEach((cost, index) => {
	if (cost > 0) { // Only add services with more than 0 cost
		nonZeroServiceNames.push(serviceNames[index]);
		nonZeroServiceCosts.push(cost);
		nonZeroColors.push(colors[index]); // Push the corresponding color
	}
	});

	const ctx = document.getElementById('costChart').getContext('2d');
	const costChart = new Chart(ctx, {
		type: 'pie',
		data: {
			labels: nonZeroServiceNames, // Array of service names
			datasets: [{
				label: 'Cost in USD',
				data: nonZeroServiceCosts, // Array of service costs
				backgroundColor: nonZeroColors, // Array of colors for each slice
				borderColor: 'white',
				borderWidth: 2
			}]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false, // Allows you to define your own aspect ratio
			legend: {
				position: 'right', // Positions the legend to the right of the chart
				labels: {
					fontSize: 12,
					padding: 20
				}
			}
		}
	});

}

	}
  }


// Call the main function when the page is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  main();
});
