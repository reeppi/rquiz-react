import { BrowserRouter as Router, Routes, Route, Link} from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { useParams } from "react-router-dom";
import service  from './service'
import { questionClass } from './models';
import { observer } from "mobx-react";
import React, { useState, useEffect } from 'react';
import Spinner from 'react-bootstrap/Spinner';
import Table from 'react-bootstrap/Table';
import { removeKeystoneIds, cleanData, PadTop } from './helper';
import {onSnapshot, applySnapshot,getSnapshot } from "mobx-keystone"
import Form from 'react-bootstrap/Form';
import { fileUrl } from "./helper";
import Modal from 'react-bootstrap/Modal';
import ReactAudioPlayer from 'react-audio-player';


const Scoreboard = observer( () => {
    const [loading,setLoading] = useState(false);
    const [errorMsg,setErrorMsg] = useState(false);
    const { quizName, qNumber } = useParams();
    const [imgShow, setImgShow] = React.useState(false);

    var qName:string ="test";
    if ( quizName != "" )
        qName=String(quizName);

    const loadScoreboard= async ()=>
    {
        console.log("Reload")
        //if ( service.scores == null || service.scores.name != qName)
        //if ( service.scores == null || service.scores.name != qName)
        //{ 
            setLoading(true); 
            await service.fetchScores(qName);
            setLoading(false);
            console.log(cleanData(service.quiz));
        //}
    }

    useEffect ( () => { 
        loadScoreboard();
    }, []); 

    console.log("Sivun lataus ");
    return (
        <>
            <strong>{ qName } - Pistetaulu</strong>
            {  loading && <div style={{width:"100%",display:"flex",justifyContent:"center"}}><Spinner animation="border" variant="primary" /></div>}
            {  !loading && service.scores && 
                <> 
                    <Table striped bordered style={{width:"100%"}} >
                    <thead>
                    <tr>
                    <th>#</th>
                    <th style={{width:"100%"}}>Nimi</th>
                    <th>Pisteet</th>
                    </tr>
                    </thead>
                    <tbody>
                    { service.scores.scores.map( (e,index) => 
                          <tr>
                          <td>{index+1}</td>
                          <td>{e.name}</td>
                          <td>{e.score}</td>
                          </tr>
                          )
                    }
                    </tbody>
                    </Table>
                </>
            }
            <PadTop/>
            <div>
            <Link to={"/"}><Button style={{width:"100%"}} variant="secondary" onClick={()=>{ }}>Takaisin</Button></Link>
            </div>
            <div style={{display:"flex",justifyContent:"center"}}>{ service.msg }</div>
        </>
    )
})




export default Scoreboard;