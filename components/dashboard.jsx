import { ApiClient } from 'adminjs'
import React, { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList} from "recharts";
import { VscLaw } from "react-icons/vsc";
import { FiUsers } from "react-icons/fi";
import { FaUserTie } from "react-icons/fa6";

const Dashboard = () => {
 
    const [data, setData] = useState(null)       //state to store the data sent from the handler
    const api = new ApiClient()                  //get api function that's used to fetch the handler data 
    
    useEffect(() => {
      api.getDashboard()
        .then((response) => {
          setData(response.data)             //set the data inside the state
        })
        .catch((error) => {          
          console.log(error);                //handle any errors here
        });
    }, [])


    //Chart data 
    const chartData = [
      { name: "Page A", pv: 2400, },
      { name: "Page B", pv: 1398, },
      { name: "Page C", pv: 5400, },
      { name: "Page D", pv: 3908, },  
    ];


  return (
    <div data-css="container">
      <h1>Welcome to Kadia Admin Panel</h1>

      <div data-css="boxs-container">
        <div data-css="dash-box">
          <span><FiUsers /></span>
          <h2 >Total Users: </h2>
          <p> {data?.totalUsers}</p>
        </div>
        <div data-css="dash-box">
          <span><FaUserTie /></span>
          <h2 >Total Lawyers: </h2>
          <p> {data?.totalLawyers}</p>
        </div>
        <div data-css="dash-box">
          <span><VscLaw /></span>
          <h2 > Consultations: </h2>
          <p> {data?.totalConsultations}</p>
        </div>
      </div>

      <div data-css="cases-table">
      <h2>Latest Cases: </h2>
      <table>
        <thead>
          <tr>
            <th>Case Type</th>
            <th>Description</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>            
        {data?.latestCases.map((caseData, index) => (
            <tr key={index}>
              <td>{caseData.caseType}</td>
              <td>{caseData.description}</td>
              <td>{caseData.status}</td>
            </tr>
          ))} 
        </tbody>
      </table>
    </div>

      <div data-css="chart-box">
        <h2> A chart</h2>
      <ResponsiveContainer width={"100%"} height={300} >
      <LineChart data={chartData} margin={{ top: 20 }} background={"#fff"}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" padding={{ left: 30, right: 30 }} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="pv" stroke="#8884d8" activeDot={{ r: 8 }} >
          <LabelList position="top" offset={10} />
        </Line>
      </LineChart>
    </ResponsiveContainer>
    </div>


      {/* <h3>Latest Users: </h3>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>            
        {data?.latestUsers.map((user, index) => (
            <tr key={index}>
              <td>{user.name}</td>
              <td>{user.email}</td>
            </tr>
          ))} 
        </tbody>
      </table> */}

    </div>
  );
};

export default Dashboard;
