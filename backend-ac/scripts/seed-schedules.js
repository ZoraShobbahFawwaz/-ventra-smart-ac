const fs = require('fs');
const mysql = require('mysql2/promise');

function readEnv() {
  const env = {};

  for (const line of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    env[trimmed.slice(0, separatorIndex).trim()] = trimmed
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
  }

  return env;
}

const schedules = [
  ['Lab. Ergonomic and Innovation Design', 'Sunday', '22:19:00', '09:00:00'],
  ['Lab. Ergonomic and Innovation Design', 'Monday', '13:00:00', '15:00:00'],
  ['Lab. Ergonomic and Innovation Design', 'Wednesday', '21:18:00', '11:00:00'],
  ['Lab. Ergonomic and Innovation Design', 'Thursday', '14:32:00', '13:00:00'],
  ['Lab. System and Energy Conversation', 'Tuesday', '00:48:00', '09:00:00'],
  ['Lab. System and Energy Conversation', 'Tuesday', '13:00:00', '15:00:00'],
  ['Lab. System and Energy Conversation', 'Thursday', '09:00:00', '11:00:00'],
  ['Lab. System and Energy Conversation', 'Friday', '11:00:00', '13:00:00'],
  ['Lab. Robotics and Embedded System', 'Monday', '09:00:00', '11:00:00'],
  ['Lab. Robotics and Embedded System', 'Wednesday', '14:13:00', '15:00:00'],
  ['Lab. Robotics and Embedded System', 'Thursday', '09:38:00', '12:00:00'],
  ['Lab. Robotics and Embedded System', 'Friday', '15:00:00', '17:00:00'],
  [
    'Lab. Circular Ecosystem and Sustainable Technology',
    'Wednesday',
    '07:00:00',
    '09:00:00',
  ],
  [
    'Lab. Circular Ecosystem and Sustainable Technology',
    'Wednesday',
    '11:00:00',
    '13:00:00',
  ],
  [
    'Lab. Circular Ecosystem and Sustainable Technology',
    'Thursday',
    '10:07:00',
    '11:00:00',
  ],
  ['Lab. Basic Electronics', 'Sunday', '14:16:00', '14:40:00'],
  ['Lab. Basic Electronics', 'Tuesday', '14:36:00', '11:00:00'],
  ['Lab. Basic Electronics', 'Friday', '07:00:00', '09:00:00'],
  [
    'Lab. Telematics and Communication Network',
    'Tuesday',
    '09:00:00',
    '11:00:00',
  ],
  [
    'Lab. Telematics and Communication Network',
    'Tuesday',
    '00:58:00',
    '17:00:00',
  ],
  [
    'Lab. Telematics and Communication Network',
    'Thursday',
    '10:13:00',
    '09:00:00',
  ],
  [
    'Lab. Telecommunication and Signal Processing',
    'Monday',
    '07:00:00',
    '09:00:00',
  ],
  [
    'Lab. Telecommunication and Signal Processing',
    'Wednesday',
    '09:00:00',
    '11:00:00',
  ],
  [
    'Lab. Telecommunication and Signal Processing',
    'Friday',
    '11:00:00',
    '13:00:00',
  ],
  ['Lab. Gait and Motion', 'Wednesday', '13:00:00', '15:00:00'],
  ['Lab. Gait and Motion', 'Thursday', '09:00:00', '11:00:00'],
  ['Lab. Gait and Motion', 'Friday', '13:00:00', '15:00:00'],
  ['Lab. Engineering Management', 'Monday', '15:00:00', '17:00:00'],
  ['Lab. Engineering Management', 'Wednesday', '11:00:00', '13:00:00'],
  ['Lab. Engineering Management', 'Thursday', '13:00:00', '15:00:00'],
  ['Lab. Enterprise System', 'Tuesday', '01:32:00', '15:00:00'],
  ['Lab. Enterprise System', 'Wednesday', '15:00:00', '17:00:00'],
  ['Lab. Enterprise System', 'Friday', '09:00:00', '11:00:00'],
  [
    'Lab. Basic Physics and Energy Storage Materials',
    'Thursday',
    '07:00:00',
    '09:00:00',
  ],
  [
    'Lab. Basic Physics and Energy Storage Materials',
    'Thursday',
    '11:00:00',
    '13:00:00',
  ],
  [
    'Lab. Basic Physics and Energy Storage Materials',
    'Friday',
    '13:00:00',
    '15:00:00',
  ],
  ['Lab. Smart Computing Technology', 'Monday', '09:00:00', '11:00:00'],
  ['Lab. Smart Computing Technology', 'Tuesday', '15:00:00', '17:00:00'],
  ['Lab. Smart Computing Technology', 'Friday', '09:00:00', '11:00:00'],
  ['Lab. Cybersecurity & Cloud Computing', 'Monday', '07:00:00', '09:00:00'],
  [
    'Lab. Cybersecurity & Cloud Computing',
    'Wednesday',
    '11:00:00',
    '13:00:00',
  ],
  ['Lab. Cybersecurity & Cloud Computing', 'Friday', '15:00:00', '17:00:00'],
  ['Lab. Software Engineering', 'Tuesday', '11:00:00', '13:00:00'],
  ['Lab. Software Engineering', 'Wednesday', '13:00:00', '15:00:00'],
  ['Lab. Software Engineering', 'Thursday', '15:00:00', '17:00:00'],
  ['Lab. Application Development', 'Thursday', '11:00:00', '13:00:00'],
  ['Lab. Application Development', 'Friday', '09:00:00', '11:00:00'],
  ['Lab. Application Development', 'Friday', '13:00:00', '15:00:00'],
  ['Lab. Core Programming', 'Thursday', '10:25:00', '13:00:00'],
  ['Lab. Core Programming', 'Tuesday', '13:00:00', '15:00:00'],
  ['Lab. Core Programming', 'Friday', '11:00:00', '13:00:00'],
  [
    'Lab. Quantitative Modelling For Business and Industry',
    'Monday',
    '13:00:00',
    '15:00:00',
  ],
  [
    'Lab. Quantitative Modelling For Business and Industry',
    'Wednesday',
    '07:00:00',
    '09:00:00',
  ],
  [
    'Lab. Quantitative Modelling For Business and Industry',
    'Thursday',
    '15:00:00',
    '17:00:00',
  ],
  ['Lab. Control and Automation', 'Tuesday', '13:11:00', '09:00:00'],
  ['Lab. Control and Automation', 'Wednesday', '09:00:00', '11:00:00'],
  ['Lab. Control and Automation', 'Friday', '13:00:00', '15:00:00'],
  [
    'Lab. Big Data & Artificial Intelligence',
    'Wednesday',
    '16:02:00',
    '11:00:00',
  ],
  [
    'Lab. Big Data & Artificial Intelligence',
    'Thursday',
    '13:00:00',
    '15:00:00',
  ],
  [
    'Lab. Big Data & Artificial Intelligence',
    'Friday',
    '15:00:00',
    '17:00:00',
  ],
  ['Lab. Digital Start-Up', 'Thursday', '13:00:00', '15:00:00'],
  ['Lab. Digital Start-Up', 'Thursday', '15:00:00', '17:00:00'],
  ['Lab. Digital Start-Up', 'Friday', '09:00:00', '11:00:00'],
];

async function main() {
  const env = readEnv();
  const connection = await mysql.createConnection({
    host: env.DATABASE_HOST,
    port: Number(env.DATABASE_PORT),
    user: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    database: env.DATABASE_NAME,
    ssl: { rejectUnauthorized: false },
  });

  await connection.query('TRUNCATE TABLE schedules');
  await connection.query(
    'INSERT INTO schedules (room_name, day, start_time, end_time) VALUES ?',
    [schedules],
  );

  await connection.end();
  console.log(`Inserted ${schedules.length} schedules.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
