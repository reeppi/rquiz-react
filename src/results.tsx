import { BrowserRouter as Router, Routes, Route, Link} from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { useParams } from "react-router-dom";
import service  from './service'
import { questionClass } from './models';
import { observer } from "mobx-react";
import React, { useState, useEffect } from 'react';
import Spinner from 'react-bootstrap/Spinner';
import { removeKeystoneIds, cleanData, PadTop } from './helper';
import Form from 'react-bootstrap/Form';

var  corAns = 0;

const Results = observer( () => {
    const [loading,setLoading] = useState(false);
    const [errorMsg,setErrorMsg] = useState(false);
    const { quizName, qNumber } = useParams();
    const [imgShow, setImgShow] = React.useState(false);
    const [correctAnswers, setCorrectAnswers] = React.useState(0);

    var qName:string ="test";
    if ( quizName != "" )
        qName=String(quizName);

    const loadQuiz = async ()=>
    {
        console.log("Reload")
        if ( service.quiz == null)
        { 
            setLoading(true); 
            await service.fetchQuiz(qName,false);
            setLoading(false);
            console.log(cleanData(service.quiz));
        }
    }

    useEffect ( () => { 
        loadQuiz();
        setCorrectAnswers(corAns);
    }, []); 
    corAns=0;

    console.log("Sivun lataus ");
    return (
        <>
            <strong>{ qName } - Vastaukset</strong>
            { correctAnswers } / { service.quiz?.questions.length}
            {  loading && <div style={{width:"100%",display:"flex",justifyContent:"center"}}><Spinner animation="border" variant="primary" /></div>}
            {  !loading && service.quiz && 
                <> 
                {   service.quiz.questions.map( (e,index)=><QuestionEntry key={index}  question={e} qIndex={index} /> ) }
                </>
            }
            <PadTop/>
            <div>
            <Link to={"/"+qName+"/"+service.quiz?.questions.length}><Button style={{width:"40%"}} variant="light" onClick={()=>{ }}>Takaisin</Button></Link>
            <Link to={"/"}><Button style={{width:"60%"}} variant="primary" onClick={()=>{ }}>Aloitussivulle</Button></Link>
            </div>
            <div style={{display:"flex",justifyContent:"center"}}>{ service.msg }</div>

    
        </>
    )
})


const QuestionEntry = observer( ( {question,qIndex}:{question:questionClass,qIndex:number}):any => 
{
   return ( <div>
    <div>{qIndex+1}. {question.text}</div> 
    { question.options.map((e:string,index:number)=>{

    if ( question.answer == index && question.answer == question.true  )
            {
            corAns++;
            return <li key={index} style={{background:"green"}}>{e}</li> 
            }

    if ( question.answer == index && question.answer != question.true  )
        return ( <li key={index} style={{background:"red"}}>{e}</li> )

    if ( question.true == index  )
        return ( <li key={index} style={{background:"yellow"}}>{e}</li> )

    } 
    ) }
   </div>
   )
})
  

export default Results;