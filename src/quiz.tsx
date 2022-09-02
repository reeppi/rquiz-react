import { BrowserRouter as Router, Routes, Route, Link} from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { useParams } from "react-router-dom";
import service  from './service'
import { questionClass } from './models';
import { observer } from "mobx-react";
import React, { useState, useEffect } from 'react';
import Spinner from 'react-bootstrap/Spinner';
import { removeKeystoneIds, cleanData, PadTop } from './helper';
import {onSnapshot, applySnapshot,getSnapshot } from "mobx-keystone"
import Form from 'react-bootstrap/Form';
import { fileUrl } from "./helper";
import Modal from 'react-bootstrap/Modal';
import ReactAudioPlayer from 'react-audio-player';


const Quiz = observer( () => {
    const [loading,setLoading] = useState(false);
    const [errorMsg,setErrorMsg] = useState(false);
    const { quizName, qNumber } = useParams();
    const [imgShow, setImgShow] = React.useState(false);

    var qName:string ="test";
    if ( quizName != "" )
        qName=String(quizName).toLowerCase();

    var qIndex:number = 0; 
    if ( qNumber )
        qIndex = parseInt(qNumber)-1;
    else 
        qIndex=0;
    
    const loadQuestion = async ()=>
    {
        console.log("REFRESH") 

        if ( service.quiz == null || service.quiz.name != qName )
        {
            setLoading(true); 
            await service.fetchQuiz(qName,false);
            setLoading(false);
            console.log(cleanData(service.quiz));
        }
    }

    useEffect ( () => { 
        service.setMsg("");
        loadQuestion();
    }, []); 

    if ( service.quiz )
        if ( qIndex > service.quiz.questions.length-1  || qIndex < 0  )
            return ( <>indexi viallinen</>)
    
    console.log("Sivun lataus ");
    var answer = service.quiz?.questions[qIndex].answer;

    return (
        <>
           
            { service.quiz &&
                <> <strong>{ qName }</strong></>  
            }
            {  loading && <div style={{width:"100%",display:"flex",justifyContent:"center"}}><Spinner animation="border" variant="primary" /></div>}
            {  !loading && service.quiz && 
                <>
                    { service.quiz.title}<hr/>
                    { qIndex+1} /  {service.quiz?.questions.length}<br/>
                    { service.quiz.questions[qIndex].text } <br/>
                    
                    <div style={{display:"flex", border:"1px", justifyContent:"spaceBetween"}}>
                        <div style={{width:"100%"}}>                        
                        { service.quiz.questions[qIndex].audio && <ReactAudioPlayer style={{width:"100%"}} src={fileUrl+"/"+qName+"/audio/"+service.quiz.questions[qIndex].audio} controls/>} 
                        
                        <Form>
                        { 
                        service.quiz.questions[qIndex].options.map(
                            (e,index)=>{ 
                            return <Form.Check key={index} checked={answer===index?true:false} name={String(qIndex)} type="radio" aria-label="radio 1" id={String(index)} label={e} onChange={ (e)=>{ service.quiz?.questions[qIndex].setAnswer(index); console.log(cleanData(service.quiz));}}/> }
                            )
                        }
                        </Form>
                        </div>
                        { service.quiz.questions[qIndex].image != "" && 
                        <div>
                            <div style={{display:"flex",justifyContent:"center"}}>
                                <img style={{cursor: 'zoom-in'}} onClick={()=>setImgShow(true)}
                                src={fileUrl+"/"+qName+"/images/"+service.quiz.questions[qIndex].image} 
                                width={service.quiz.questions[qIndex].width/2}
                                height={service.quiz.questions[qIndex].height/2}
                        /> 
                        </div>
                        </div>
                        }
                    </div>
                    <ImgModal url={fileUrl+"/"+qName+"/images/"+service.quiz.questions[qIndex].image}  show={imgShow} onHide={() => setImgShow(false)} />
                </>
            }
            { !service.quiz &&  <Link to={"/"}><Button style={{width:"100%"}} variant="primary" onClick={()=>{ }}>Aloitussivulle</Button></Link> }

            

            <div style={{display:"flex",justifyContent:"center"}}>{ service.msg }</div>
            <PadTop/>
            <div>
            { service.quiz &&
                <>
                { qIndex == 0 && <Link to="/"><Button style={{width:"40%"}} variant="light" onClick={()=>{ }}>Etusivulle</Button></Link> }
                { qIndex >= 1 && <Link to={"/"+qName+"/"+(qIndex)}><Button style={{width:"40%"}} variant="light" onClick={()=>{ }}>Takaisin</Button></Link> }
                { qIndex+1 < service.quiz.questions.length && <Link to={"/"+qName+"/"+(qIndex+2)}><Button style={{width:"60%"}} variant="primary" onClick={()=>{ }}>Seuraava</Button></Link>}
                { qIndex+1 == service.quiz.questions.length && <Link to={"/"+qName+"/results"}><Button style={{width:"60%"}} variant="primary" onClick={()=>{ }}>Vastaukset</Button></Link>}
                </>
                }   



            </div>          
        </>
    )
})


const ImgModal = (props:any) => {
    return (
      <Modal  style={{cursor: 'zoom-out'}}  {...props} size="sm" aria-labelledby="contained-modal-title-vcenter" centered onClick={ ()=>{props.onHide()}}>
        <Modal.Header closeButton>
        </Modal.Header>
        <img src={props.url} onClick={ ()=>props.onHide()}/> 
        <Modal.Body>
        </Modal.Body>
      </Modal>
    );
  }
  

export default Quiz;