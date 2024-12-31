const mongoose = require('mongoose');
const User = require('./models/userModel'); // Adjust the path to your User model
const Case = require('./models/caseModel'); // Adjust the path to your Case model
const Lawyer = require('./models/lawyerModel'); // Adjust the path to your Lawyer model
const Consultation = require('./models/ConsultationModel'); // Adjust the path to your Consultation model
const express = require("express");
// Initialize the express application
const app = express()



async function setupAdminJS() {
    const { AdminJS, ComponentLoader } = await import('adminjs');
    const AdminJSExpress = await import('@adminjs/express');
    const AdminJSMongoose = await import('@adminjs/mongoose');

   // Register the adapter
   AdminJS.registerAdapter(AdminJSMongoose);


//CUSTOM COMPONENTS ... Here
// import { ComponentLoader } from 'adminjs';
const componentLoader = new ComponentLoader();              //used to bundle front files
const Components = {
  Dashboard: componentLoader.add('Dashboard', './components/dashboard.jsx'),      //Dashboard custom component
  // other custom components
}

//Handler to get data to a custom dashboard component, we can use
const dashboardHandler = async () => {
  // Simulated data fetching from a database, in real project it'll be .. ex: Model.findById();
  const totalUsers = await User.countDocuments();
  const totalLawyers = await Lawyer.countDocuments();
  const totalConsultations = await Consultation.countDocuments(); 
  const latestCases =  await Case.find().sort({ createdAt: -1 }).limit(5); 
  const latestUsers = [{ name: "ahmed", email: "ahmed@gmail.com" },{ name: "omar", email: "omar@gmail.com" },];
  return {
    totalUsers, totalLawyers, totalConsultations, latestCases, latestUsers,      
  };
}



  // Create an instance of AdminJS
  const adminJs = new AdminJS({
    databases: [mongoose],
    rootPath: '/admin',    
    resources: [
      {
        resource: User,
        options: {
          listProperties: ['username', 'email', 'isAdmin','profileImage'],
          editProperties: ['username', 'email', 'password', 'isAdmin','profileImage'],
          showProperties: ['username', 'email', 'isAdmin', 'createdAt', 'updatedAt','profileImage'],
        },
      },
      {
        resource: Case,
        options: {
          listProperties: ['caseType', 'description', 'status', 'createdAt'],
          editProperties: ['caseType', 'description', 'status'],
          showProperties: ['caseType', 'description', 'status', 'createdAt', 'updatedAt'],
        },
      },
      {
        resource: Lawyer,
        options: {
          listProperties: ['name', 'phone', 'specialization', 'email', 'createdAt'],
          editProperties: ['name', 'phone', 'specialization', 'email'],
          showProperties: ['name', 'phone', 'specialization', 'email', 'createdAt', 'updatedAt'],
        },
      },
      {
        resource: Consultation,
        options: {
          listProperties: ['description', 'lawyerName', 'date', 'status', 'createdAt'],
          editProperties: ['description', 'lawyerName', 'date', 'status'],
          showProperties: ['description', 'lawyerName', 'date', 'status', 'createdAt', 'updatedAt'],
        },
      },
    ],      
    branding: {
      companyName: "Kadia",
      logo: '/logo.png',
      favicon: '/logo.png',
      softwareBrothers: false,
    },
    locale:{
      language:'en',
      translations: {
          en:{
            components: {
              Login:{welcomeHeader: "Welcome ..", welcomeMessage : "Welcome to Kadia Admin Dashboard .. Where Admin can easily manage users, cases and consultations.", properties: {
                email: "Email",
                password: "Password"
              },
              loginButton: "Login"}
            }
          }
      }
    },  
    assets: {
      styles: ['/style.css'],  //here you can set custom styles, hide the default images and re-position the boxes or texts.
  },
  dashboard: {                       //setting the custom component of the dashboard     
    component: Components.Dashboard,
    handler: dashboardHandler,       //passing the async handler function to pass data
  },
  componentLoader ,                  //to bundle the custom components
  });

  
  //watch() to trigger the AdminJS initialization & bundling
  if (process.env.NODE_ENV === 'production') {
    await adminJs.initialize();
  } else {
    adminJs.watch();
  }

  

  // Set up the router with authentication
  const router = AdminJSExpress.buildAuthenticatedRouter(
    adminJs,
    {
      authenticate: async (email, password) => {
        const user = await User.findOne({ email });
        if (user && user.isAdmin ) {
          return user;
        }
        return null;
      },
      cookiePassword: process.env.SESSION_SECRET || 'some-secret',
    },
    null,
    {
      resave: false,
      saveUninitialized: true,
    }
  );

  return { adminJs, router };
}

module.exports = setupAdminJS;
