import { BrowserRouter as Router, Routes, Route, Link} from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { useParams,useNavigate } from "react-router-dom";
import service  from './service'
import { audioEditClass, questionClass, quizClass } from './models';
import { observer } from "mobx-react";
import React, { useState, useEffect, createContext, useRef } from 'react';
import Spinner from 'react-bootstrap/Spinner';
import { removeKeystoneIds, cleanData, PadTop } from './helper';
import {onSnapshot, applySnapshot,getSnapshot } from "mobx-keystone"
import Form from 'react-bootstrap/Form';
import { fileUrl } from "./helper";
import Modal from 'react-bootstrap/Modal';
import ReactAudioPlayer from 'react-audio-player';
import Accordion from 'react-bootstrap/Accordion';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import InputGroup from 'react-bootstrap/InputGroup';
import { DragDropContext, Droppable, Draggable, DropResult   } from 'react-beautiful-dnd';
import useStateCallback from './stateCallback';
import  * as RecordRTC   from 'recordrtc';
import ProgressBar from 'react-bootstrap/ProgressBar';
const ImageBlobReduce = require('image-blob-reduce');
declare var require: any
const resize = new ImageBlobReduce();
const storeSnapshots:any = []; 
var snapIndex = 0;
var undo = false;
const Ctx = React.createContext<Partial<{qName:string}>>({});

const Edit = observer( () => {
    const navigate = useNavigate();
    const [loading,setLoading] = useState(false);
    const { quizName } = useParams();
    const [saveDisabled, setSaveDisabled] = useState(false);
    const [deleteDisabled, setDeleteDisabled] = useState(false);
    const [showConfirmModalDelQuestion, setShowConfirmModalDelQuestion] = useState(false); 
    const [showChangeNameModalDelQuestion, setShowChangeNameModalDelQuestion] = useState(false);

    const [snapI,setSnapI] = useState(0);

    var qName:string ="test";
    if ( quizName != "" )
        qName=String(quizName);
    
    useEffect ( () => { 
      loadQuiz();
    }, []); 
    
    const loadQuiz = async ()=>
    {
        console.log("REFRESH "+qName) 
        setLoading(true); 
        const { error, dialog, deny } =await service.fetchQuiz(qName,true);
        console.log("dialog : "+dialog);
        if ( dialog && !deny )
            service.createEmptyQuiz();
            
        console.log("deny : "+deny);
        setLoading(false);
        console.log(cleanData(service.quiz));
        storeSnapshots.length =0;
        snapIndex=0;
        storeSnapshots.push(getSnapshot(service.quiz));
        onSnapshot(service.quiz as quizClass, (newSnapshot, previousSnapshot) => {
          if (!undo )
          {
            console.log("Muutos "+snapIndex);
            snapIndex++;
            setSnapI(snapIndex);
            storeSnapshots.splice(snapIndex,1,newSnapshot);
          }
          undo=false;
        })
    }

    const saveQuiz = async(qName:string)=>
    {
        snapIndex = 0;
        setSnapI(snapIndex);
        storeSnapshots.length =0;
        storeSnapshots.push(getSnapshot(service.quiz));
        console.log("saving quiz "+ qName);
        setSaveDisabled(true);
        await service.saveQuiz(qName);
        setSaveDisabled(false);
    }

    const undoClick = ()=>
    {
      if ( snapIndex > 0) 
      { 
        snapIndex--;
        setSnapI(snapIndex);
        console.log("undo"+snapIndex);  
        undo=true; 
        if ( service.quiz )
        {
          console.log("Undo");
          applySnapshot<quizClass>(service.quiz,storeSnapshots[snapIndex]); 

        }
        } 
    }

    console.log("Sivun lataus "+qName);
    return (
        <>
            <Ctx.Provider value={{qName}}>

            <div style={{display:"flex", width:"100%"}}>
            <div style={{width:"100%"}}><strong>{ quizName }</strong></div>
            <div style={{display:"flex", width:"160px", justifyContent:"right"}}><Button variant="secondary" onClick={ ()=>{service.setMsg(""); setShowChangeNameModalDelQuestion(true)}}>Vaihda nimi</Button></div>
            </div>
            { service.quiz &&
            <FloatingLabel controlId="floatingInput" label="Visan otsikko" className="mb-3">
                <Form.Control maxLength={100} onChange={(e)=>service.quiz?.setTitle(e.target.value)} placeholder="Kirjoita visalle lyhyt otsikko" value={service.quiz?.title}/>
            </FloatingLabel>
            }
   
            {  loading && <div style={{width:"100%",display:"flex",justifyContent:"center"}}><Spinner animation="border" variant="primary" /></div>}
            {  !loading && service.quiz && 
                <>
                <Accordion>
                    { service.quiz.questions.map((e,index)=><QuestionEntry saveQ={()=>saveQuiz(qName)} key={index} ix={index} question={e}/>)}
                </Accordion>
                </>
            }
            { service.quiz &&
            <PadTop><Button style={{width:"100%"}} onClick={()=>service.quiz?.addQuestion()} variant="primary">Lisää kysymys</Button></PadTop>
            }
            <PadTop/><PadTop/>

            <Accordion>
            <Accordion.Item eventKey="aa">
            <Accordion.Header>Vaihda kysymysten järjestystä</Accordion.Header>
            <Accordion.Body>
            <Dropzone/>
            </Accordion.Body>
            </Accordion.Item>
            </Accordion>   
         
            { service.quiz && <Form.Check label="Visa näkyy etusivulla julkisissa visoissa" type="checkbox" onChange={(e)=>service.quiz?.setPublic(e.target.checked)} checked={service.quiz.public}/> }

            <PadTop>
            <Button disabled={saveDisabled} onClick={ (e)=>{ saveQuiz(qName)} } style={{width:"65%"}} variant="primary">{ saveDisabled && <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/> }Tallenna visa</Button>
            <Button disabled={deleteDisabled} onClick={ (e)=>{setShowConfirmModalDelQuestion(true)} } style={{width:"35%"}} variant="danger">{ deleteDisabled && <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/> }Poista visa</Button>
            </PadTop>
            <PadTop/>
            <Button disabled={snapI==0 ? true:false} variant="info" onClick={ ()=>undoClick()}>Kumoa muutos</Button>     
            <PadTop/>
            <PadTop><Link to="/"><Button style={{width:"100%"}} variant="light">Palaa etusivulle</Button></Link> </PadTop>
            <PadTop><div style={{display:"flex",justifyContent:"center"}}>{ service.msg }</div>  </PadTop>
        

            <ChangeNameModal  qname={qName} show={showChangeNameModalDelQuestion} onHide={ ()=>setShowChangeNameModalDelQuestion(false)} onOk={ (e:string)=>{ console.log("Suljetaan"); setShowChangeNameModalDelQuestion(false); navigate("/"+e+"/edit")} }/>
            <ConfirmModal ok="Poista" cancel="Peruuta" msg="Haluatko varmasti poistaa visan?" show={showConfirmModalDelQuestion} onHide={ ()=>setShowConfirmModalDelQuestion(false)} onOk={ (e:any)=>{ service.deleteQuiz(qName); setShowConfirmModalDelQuestion(false);  } }/>
            </Ctx.Provider>
        </>
    )
})

var recorder:any;
var timerId:any;

const QuestionEntry = observer( ( {question,ix,saveQ}:{question:questionClass,ix:number,saveQ:()=>void}):any => 
{   
    const [showConfirmModalDelImage, setShowConfirmModalDelImage] = useState(false);
    const [showConfirmModalDelQuestion, setShowConfirmModalDelQuestion] = useState(false);
    const [showConfirmModalDelRecord, setShowConfirmModalDelRecord] = useState(false);

    const [imgShow, setImgShow] = React.useState(false);
    const fileUpload =  React.useRef<HTMLInputElement>(null);

    const [progress, setProgress] = React.useState(0);
    const [showProgress, setShowProgress] = React.useState(false);

    const ctx = React.useContext(Ctx); 
    const [recording, setRecording] = React.useState(false);
    const [seconds, setSeconds] = React.useState(0);
    const secRef = React.useRef(0);
    const blob = React.useRef<any>();
   
    const initiateRecording =() =>
    {
      let mediaConstraints = { video: false, audio: true};
      navigator.mediaDevices.getUserMedia(mediaConstraints).then(successCallback, errorCallback);
    }

    const successCallback = (stream:any) =>
    {
    setRecording(true);   
    setSeconds(0);
    if ( service.quiz)
      service.quiz.questions[ix].setAudioEdit(null);
    recorder = new RecordRTC.default(stream,{mimeType:"audio/webm",bitrate:64000});
    recorder.startRecording();
    secRef.current=0;
    timerId=setInterval(()=>{ 
      secRef.current++;
      setSeconds(secRef.current);if ( secRef.current >=5 ) stopRecording(); },1000); 
    }

    const errorCallback = (error:any) => {
      service.setMsg("Mikrofonia ei pääse käyttämään.");
    }

    const stopRecording = () =>
    {
      if ( timerId)
      clearInterval(timerId);
      recorder.stopRecording(audioReady);
      setRecording(false);
    }

    const audioReady = (blobUrl:any) => {
      console.log( ix+"----"+blobUrl);
      var data = new audioEditClass({ url:blobUrl as string});
      blob.current= recorder.getBlob();
      if (service.quiz)
        service.quiz.questions[ix].setAudioEdit(data);
    }

    const progressCallback = (percent:number) =>
    {
      console.log("progress "+percent)
      setProgress(percent);
    }
    
    const uploadImage = async(e:any)=>
    {
        await saveQ();
        setProgress(0);
        setShowProgress(true);
        const file:File = e.target.files[0];
        console.log("File : "+ file.name);
        console.log("Size      : "+ file.size);
        var blobImage= await resize.toBlob(file,{max: 1500});
        const formData = new FormData();
        formData.append("image", blobImage);
        if ( ctx.qName )
        {
            console.log("uploading image to "+ctx.qName );
            await service.uploadImage(formData,ctx.qName,ix,progressCallback);
            setShowProgress(false);
            setProgress(0);
        }
    }

    const uploadAudio = async()=>
    {
        await saveQ();
        setProgress(0);
        setShowProgress(true);
        const formData = new FormData();
        formData.append("audio", blob.current);
        if ( ctx.qName )
        {
            console.log("uploading audio to "+ctx.qName );
            await service.uploadAudio(formData,ctx.qName,ix,progressCallback);
            setShowProgress(false);
            setProgress(0);
        }
    }

    return (
    <>
    <input ref={fileUpload}  accept="image/*" type="file" id="fileopen" hidden onChange={(e)=>{ uploadImage(e);}} />

    <Accordion.Item eventKey={String(ix)}>
    <Accordion.Header>{ix+1}. {question.text}</Accordion.Header>
    <Accordion.Body>
        <FloatingLabel controlId="floatingTextarea" label="Kysymys" className="mb-3">
        <Form.Control value={question.text} onChange={(e)=>question.setText(e.target.value)}  as="textarea" placeholder="Anna kysymys" />
         </FloatingLabel>
         { service.quiz?.questions[ix].audio && <ReactAudioPlayer style={{width:"100%"}} src={fileUrl+"/"+ctx.qName+"/audio/"+service.quiz?.questions[ix].audio} controls/> }
    
        { 
        question.image != "" && 
            <div style={{paddingBottom:"10px", display:"flex",justifyContent:"center"}}>
            <img style={{cursor: 'zoom-in'}} onClick={()=>setImgShow(true)} 
            src={fileUrl+"/"+ctx.qName+"/images/"+question.image} 
            width={question.width/2}
            height={question.height/2}
            /> 
            </div>
        }
         <Form>
        { 
            question.options.map((e,index)=><OptionEntry key={index} question={question} ix={index} qx={ix}/>)
        }
        </Form>

        <PadTop>
        <InputGroup>
        <Button style={{width:"50%"}} onClick={()=>question.addOption()} variant="primary">Lisää vaihtoehto</Button>
        <Button style={{width:"50%"}} onClick={()=>{setShowConfirmModalDelQuestion(true)}} variant="danger">Poista kysymys</Button>
        </InputGroup>
        </PadTop>
        <PadTop>
        
        { question.image !="" &&
        <InputGroup>
        <Button disabled={showProgress} style={{width:"50%"}} onClick={()=>{fileUpload.current?.click();}} variant="primary">Lisää kuva</Button>
        <Button style={{width:"50%"}} onClick={()=>{setShowConfirmModalDelImage(true)}} variant="danger">Poista kuva</Button>
        </InputGroup>
        }
        { question.image =="" && <Button  disabled={showProgress} style={{width:"100%"}}  onClick={()=>{fileUpload.current?.click();}} variant="primary">Lisää kuva</Button> }

        <PadTop/>
        { !recording && !question.audio  &&  <Button disabled={showProgress}  style={{width:"100%"}} onClick={()=>{initiateRecording()}} variant="primary">Nauhoita äänite</Button>}

        { !recording && question.audio  && 
        <>
        <Button disabled={showProgress} style={{width:"50%"}} onClick={()=>{initiateRecording()}} variant="primary">Nauhoita äänite</Button>
        <Button style={{width:"50%"}} onClick={()=>{setShowConfirmModalDelRecord(true)}} variant="danger">Poista äänite</Button>
        </>
        }

        { recording && <Button style={{width:"100%"}} onClick={()=>{stopRecording()}} variant="primary">Pysäytä nauhoitus {seconds}</Button> }
        { question.audioEdit?.url && <PadTop><Button disabled={showProgress} style={{width:"100%"}} onClick={()=>{uploadAudio()}} variant="primary">Lisää äänite kysymykseen</Button></PadTop>}
        { question.audioEdit?.url && <PadTop><ReactAudioPlayer style={{width:"100%"}} src={question.audioEdit?.url} controls/></PadTop> }
        </PadTop>
        <PadTop/>
        { showProgress && <ProgressBar animated now={progress}/>}
     
        <ConfirmModal ok="Poista" cancel="Peruuta" msg="Haluatko varmasti poistaa kysymyksen?" show={showConfirmModalDelQuestion} onHide={ ()=>setShowConfirmModalDelQuestion(false)} onOk={ (e:any)=>{ service.quiz?.deleteQuestion(ix); setShowConfirmModalDelQuestion(false);} }/>
        <ConfirmModal ok="Poista" cancel="Peruuta" msg="Haluatko varmasti poistaa kuvan?" show={showConfirmModalDelImage} onHide={ ()=>setShowConfirmModalDelImage(false)} onOk={ (e:any)=>{service.quiz?.questions[ix].setImage(""); setShowConfirmModalDelImage(false);} }/>
        <ConfirmModal ok="Poista" cancel="Peruuta" msg="Haluatko varmasti poistaa äänitteen?" show={showConfirmModalDelRecord} onHide={ ()=>setShowConfirmModalDelRecord(false)} onOk={ (e:any)=>{question.setAudio(""); setShowConfirmModalDelRecord(false);} }/>


    </Accordion.Body>
    </Accordion.Item>
    <ImgModal url={fileUrl+"/"+ctx.qName+"/images/"+question.image}  show={imgShow} onHide={() => setImgShow(false)} />
    </>

    )
})

const OptionEntry = observer( ( {question,ix,qx}:{question:questionClass,ix:number,qx:number}):any => 
{
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    return (
        <div style={{padding:"1px"}}>
        <InputGroup>
        <InputGroup.Radio checked={question.true===ix?true:false} name={String(ix)} type="radio" aria-label="radio 1" id={String(qx)} label={question.options[ix]} onChange={ ()=>{ question.setTrue(ix); console.log(cleanData(service.quiz));}}/>   
        <Form.Control aria-label="Text input with radio button" onChange={(e)=>question.setOption(ix,e.target.value)} value={question.options[ix]}/>
        <Button variant="danger" onClick={ ()=>setShowConfirmModal(true)}>x</Button>
        </InputGroup>
        <ConfirmModal ok="Poista" cancel="Peruuta" msg="Haluatko varmasti poistaa vaihtoehdon?" show={showConfirmModal} onHide={ ()=>setShowConfirmModal(false)} onOk={ (e:any)=>{question.deleteOption(ix); setShowConfirmModal(false);} }/>
        </div>
    )
})

function handleOnDragEnd(result:DropResult) {
    if (!result.destination) return;
    service.quiz?.reOrder(result.destination.index,result.source.index);
  }
  
  const Dropzone = observer(()=> {
    return <>
          <div style={{display:"none"}}>
          { service.quiz?.questions.map((e,index)=><div key={index}>{e.text}</div>) }
          </div>
    <DragDropContext onDragEnd={handleOnDragEnd}>
    <Droppable  droppableId="questions">
    {(provided) => (
      <ul className="ch" {...provided.droppableProps} ref={provided.innerRef}>
         {
          service.quiz?.questions?.map((e, index)=>
            { 
            return ( 
              <Draggable key={index} draggableId={String(index)} index={index}>
              {(provided) => (
                <li ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                 {index+1}. { e.text }
                </li>
              )}
            </Draggable>  
           )
          }
          )
         }
        {provided.placeholder}
      </ul>
    )}
    </Droppable>
    </DragDropContext>
    </>
  })

  const ChangeNameModal = (props:any) => {
    
    const [newName,setNewName ] = useState("");
    const [loading,setLoading ] = useState(false);

    
    const changeName = async (oldName:string,onOk:void) =>
    {
      setLoading(true);
      console.log(" : "+oldName+" to "+newName);
        const { error, done } = await service.renameQuiz(oldName,newName);
      if ( done )
      {
        if (props.onOk)
         props.onOk(newName);
      }
      setLoading(false);
    }

    return (
      <Modal  {...props} size="sm" aria-labelledby="contained-modal-title-vcenter" centered>
        <Modal.Header closeButton>
        </Modal.Header>
        <div style={{display:"flex",justifyContent:"center",flexDirection:"column"}}>
        <div>Anna visalle {props.qname} uusi nimi</div>
        <div><Form.Control maxLength={30} value={newName} onChange={(e)=>setNewName(e.target.value)} placeholder="Anna uusi nimi (max 30)"/></div>
        <div style={{display:"flex",justifyContent:"center"}}>
        <Button style={{width:"50%"}} onClick={ ()=>props.onHide()}>Peruuta</Button>
        <Button disabled={loading}  variant="warning" style={{width:"50%"}} onClick={ ()=>{changeName(props.qname,props.onOk)}}>
        { loading && <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/> } 
          Vaihda</Button> 
      
        </div>
        <div>{service.msg}</div>
        </div>
        <Modal.Body>
        </Modal.Body>
      </Modal>
    );
  }



const ConfirmModal = (props:any) => {
    return (
      <Modal  style={{cursor: 'zoom-out'}}  {...props} size="sm" aria-labelledby="contained-modal-title-vcenter" centered onClick={ ()=>{props.onHide()}}>
        <Modal.Header>
        </Modal.Header>
        <div style={{display:"flex",justifyContent:"center"}}>{ props.msg }</div>
        <div style={{display:"flex",justifyContent:"center"}}>
        <Button style={{width:"50%"}} onClick={ ()=>props.onHide()}>{props.cancel}</Button>
        <Button variant="danger" style={{width:"50%"}} onClick={ ()=>props.onOk()}>{props.ok}</Button> 
        
        </div>
        <Modal.Body>
        </Modal.Body>
      </Modal>
    );
}


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


  
export default Edit;