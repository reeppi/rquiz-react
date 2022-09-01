import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import { useParams } from "react-router-dom";
import { Navigate  }  from  'react-router-dom';
import React, { useState, useEffect } from 'react';
import Main from './main';
import Quiz from './quiz';
import Edit from './edit';
import Results from './results';
import Scoreboard from './scoreboard';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const Url = 100;

function App()
{ 

  useEffect ( () => { 
    document.title="Tietovisa";
    }, []); 

  return (
    <Router>
    <div style={{justifyContent:"center",display:"flex"}}><h2>Tietovisa</h2></div>
    <div style={{justifyContent:"center",display:"flex"}}>
    <div className="Page">
      <Routes>
          <Route path='/'  element={<Main/>}  ></Route>
          <Route path='/:quizName/scores' element={<Scoreboard/>}></Route>
          <Route path='/:quizName/edit' element={<Edit/>}></Route>
          <Route path='/:quizName/results' element={<Results/>}></Route>
          <Route path='/:quizName' element={<Navigate to="./1"/>}></Route>
          <Route path='/:quizName/:qNumber' element={<Quiz/>}></Route>
      </Routes> 
    </div>
    </div>
   </Router>
  )
}
export default App;


