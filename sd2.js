const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const { Employee, Payroll, sequelize } = require('./models');

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateRandomEmployee() {
  const jobRoles = [1, 2, 3, 4, 5];
  const genders = ['Male', 'Female'];
  const empStatuses = ['NEW', 'ACTIVE', 'LEAVING', 'TERMINATED'];

  const jobRoleId = jobRoles[Math.floor(Math.random() * jobRoles.length)];
  const gender = genders[Math.floor(Math.random() * genders.length)];
  const empStatusCode = empStatuses[Math.floor(Math.random() * empStatuses.length)];

  const fullName = `Employee ${Math.floor(Math.random() * 1000000)}`;
  const phoneNumber = Math.floor(Math.random() * 10000000000).toString();
  const emailAddress = `${fullName.replace(/\s/g, '')}@company.com`;
  const employmentDate = getRandomDate(new Date('2020-01-01'), new Date('2024-06-30'));
  let terminationDate = null;
  if (empStatusCode === 'LEAVING' || empStatusCode === 'TERMINATED') {
    terminationDate = getRandomDate(employmentDate, new Date('2024-06-30'));
  }

  return {
    full_name: fullName,
    phone_number: phoneNumber,
    email_address: emailAddress,
    gender: gender,
    job_role_id: jobRoleId,
    employment_date: employmentDate,
    termination_date: terminationDate,
    emp_status_code: empStatusCode,
  };
}

async function seedData({ workerData, lastLogTime }) {
  let employeesInserted = 0;
  let payrollInserted = 0;
  let recordsInsertedThisSecond = 0;
//   let startTime = Date.now(); // Declare and initialize startTime

  try {
    await sequelize.transaction(async transaction => {
      for (let i = 0; i < workerData.numEmployees; i++) {
        const employee = generateRandomEmployee();
        const employeeCreated = await Employee.create(employee, { transaction });
        employeesInserted++;
        recordsInsertedThisSecond++;

        const now = Date.now();
        if (now - lastLogTime >= 1000) {
          console.log(`Worker ${workerData.threadId} inserted ${recordsInsertedThisSecond} records in the last second.`);
          recordsInsertedThisSecond = 0;
          lastLogTime = now;
        }
      }
    });
    // const totalTimeTaken = Date.now() - startTime;
    // console.log(`Total time taken: ${totalTimeTaken}ms`);
    console.log(`Worker ${workerData.threadId} inserted ${employeesInserted} employees and ${payrollInserted} payroll records in total.`);
    parentPort.postMessage({ success: true });
  } catch (error) {
    console.error(`Worker ${workerData.threadId} encountered an error:`, error);
    parentPort.postMessage({ success: false, error: error.message });
  }
}

if (isMainThread) {
  const numThreads = 4;
  const totalEmployees = 1000000;
  const employeesPerThread = Math.ceil(totalEmployees / numThreads);

  const startTime = Date.now(); 
  const workers = [];

  for (let i = 0; i < numThreads; i++) {
    const threadId = i + 1;
    const worker = new Worker(__filename, {
      workerData: {
        threadId: threadId,
        numEmployees: employeesPerThread,
      }
    });

    workers.push(worker);

    worker.on('message', message => {
      if (message.success) {
        console.log(`Thread ${threadId} completed successfully.`);
      } else {
        console.error(`Thread ${threadId} encountered an error:`, message.error);
      }
    });

    worker.on('error', error => {
      console.error(`Thread ${threadId} encountered an error:`, error);
    });

    worker.on('exit', code => {
      if (code !== 0) {
        console.error(`Thread ${threadId} exited with code ${code}`);
      }
    });
  }

  // Wait for all worker threads to complete
  const workerPromises = workers.map(worker => new Promise((resolve, reject) => {
    worker.once('exit', resolve);
  }));

  Promise.all(workerPromises)
    .then(() => {
      const endTime = Date.now(); 
      const totalTimeTaken = endTime - startTime; 
      console.log(`Total time taken for the entire seeding process: ${totalTimeTaken} ms`);
    })
    .catch(error => {
      console.error('Error waiting for worker threads:', error);
    });
} else {
  seedData({ workerData, lastLogTime: 0 }); 
}
 //I See You