const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const User = require('../models/userModel'); // Adjust the path as necessary
const Lawyer = require('../models/lawyerModel'); // Adjust the path as necessary
const Case = require('../models/caseModel'); // Adjust the path as necessary
const Location = require('../models/locationModel'); // Adjust the path as necessary
const Chat = require('../models/chatModel'); // Adjust the path as necessary
const Message = require('../models/message'); // Adjust the path as necessary

const generateRandomUsers = async (numberOfUsers = 100) => {
  try {
    const users = [];
    for (let i = 0; i < numberOfUsers; i++) {
      const newUser = new User({
        username: faker.internet.userName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
      });
      users.push(newUser);
    }
    await User.insertMany(users);
    console.log(`${numberOfUsers} random users have been created successfully!`);
  } catch (error) {
    console.error('Error generating random users:', error);
  }
};

const generateRandomLawyers = async (numberOfLawyers = 100) => {
  try {
    const lawyers = [];
    for (let i = 0; i < numberOfLawyers; i++) {
      const newLawyer = new Lawyer({
        name: faker.name.findName(),
        email: faker.internet.email(),
        phone: faker.phone.phoneNumber(),
        address: faker.address.streetAddress(),
        specialty: faker.helpers.arrayElement(['Civil', 'Criminal', 'Family', 'Corporate', 'Labor']),
      });
      lawyers.push(newLawyer);
    }
    await Lawyer.insertMany(lawyers);
    console.log(`${numberOfLawyers} random lawyers have been created successfully!`);
  } catch (error) {
    console.error('Error generating random lawyers:', error);
  }
};

const generateRandomCases = async (numberOfCases = 100) => {
  try {
    const users = await User.find().limit(10);
    const lawyers = await Lawyer.find().limit(10);
    const locations = await Location.find().limit(10);

    if (!users.length || !lawyers.length || !locations.length) {
      console.log('Not enough users, lawyers, or locations in the database to generate cases.');
      return;
    }

    const cases = [];
    for (let i = 0; i < numberOfCases; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomLawyer = lawyers[Math.floor(Math.random() * lawyers.length)];
      const randomLocation = locations[Math.floor(Math.random() * locations.length)];

      const newCase = new Case({
        title: faker.lorem.sentence(),
        caseType: faker.helpers.arrayElement(['Civil', 'Criminal', 'Family', 'Corporate', 'Labor']),
        description: faker.lorem.paragraph(),
        user: randomUser._id,
        lawyer: randomLawyer._id,
        status: faker.helpers.arrayElement(['pending', 'in progress', 'completed']),
        price: faker.commerce.price(100, 1000, 0),
        date: faker.date.past(1),
        location: randomLocation._id,
        caseNumber: faker.datatype.uuid(),
        entity: faker.company.companyName(),
        nextSession: faker.date.future(),
        defendant: faker.name.findName(),
        defendantId: faker.internet.url(),
        claimant: faker.name.findName(),
        claimantId: faker.internet.url(),
        powerOfAttorney: faker.internet.url(),
        caseFiles: [faker.internet.url(), faker.internet.url()],
        appointmentId: mongoose.Types.ObjectId(), // Example, assuming appointments are linked
      });
      cases.push(newCase);
    }
    await Case.insertMany(cases);
    console.log(`${numberOfCases} random cases have been created successfully!`);
  } catch (error) {
    console.error('Error generating random cases:', error);
  }
};

const generateRandomChats = async (numberOfChats = 50) => {
  try {
    const users = await User.find().limit(10);

    if (users.length < 2) {
      console.log('Not enough users in the database to generate chats.');
      return;
    }

    const chats = [];
    for (let i = 0; i < numberOfChats; i++) {
      const randomUser1 = users[Math.floor(Math.random() * users.length)];
      let randomUser2;
      do {
        randomUser2 = users[Math.floor(Math.random() * users.length)];
      } while (randomUser1._id.equals(randomUser2._id));

      const newChat = new Chat({
        sender: randomUser1._id,
        receiver: randomUser2._id,
      });
      chats.push(newChat);
    }
    await Chat.insertMany(chats);
    console.log(`${numberOfChats} random chats have been created successfully!`);
  } catch (error) {
    console.error('Error generating random chats:', error);
  }
};

exports.generateAll = async () => {
  await generateRandomUsers(50);
  await generateRandomLawyers(50);
  await generateRandomCases(50);
  await generateRandomChats(50);
};
