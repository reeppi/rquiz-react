import { BrowserRouter as Router, Routes, Route, Link} from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { useSearchParams, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from 'react';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Form from 'react-bootstrap/Form';
import service  from './service';
import { observer } from "mobx-react";
import Accordion from 'react-bootstrap/Accordion';
import { cleanData,apiUrl, PadTop} from './helper';
import logoGoogle from './images/google_logo.png';
import logoFacebook from './images/facebook_logo.png';
import InputGroup from 'react-bootstrap/InputGroup';
import Dropdown from 'react-bootstrap/Dropdown';


const Main = observer(() => {
    const [loading,setLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [showQuizList,setShowQuizList] = useState(false);

    useEffect ( () => { 
        service.setMsg("");
        var code=searchParams.get("code")
        if (code)
            fetchToken(code);

        if ( service.getToken != "null")
            service.setLogged(true);
    }, []); 

    const fetchToken = async (code :string)=> {   
        await service.fetchToken(code);
        console.log("TOKEN:"+service.getToken);
        navigate("/")
        if ( service.getToken != "null")
            service.setLogged(true);
    }

    const fetchQuizList = async (e:any)=> {   
        if (e)
        {
            setLoading(true);
            await service.fetchQuizList();
            setLoading(false);
        }
    }

    const fetchUserQuizList = async ()=> {  
        if ( !showQuizList ) {
            console.log("fetch quiz List");
            await service.fetchUserQuizList(); 
        }
        setShowQuizList(!showQuizList);
    }

    return (
        <>
        <div style={{display:"flex", width:"100%", justifyContent:"center", flexDirection:"column"}} >
        <InputGroup>
        <FloatingLabel controlId="floatingInput" label="Visan nimi" >
        <Form.Control maxLength={30} onChange={(e)=>service.setQuizName(e.target.value)} placeholder="visan nimi" value={service.quizName}/>
        </FloatingLabel>
        <Dropdown show={showQuizList} >
            <Dropdown.Toggle variant="secondary" id="dropdown-basic" onClick={()=>fetchUserQuizList()}>Omat visasi</Dropdown.Toggle>
        <Dropdown.Menu>
            { service.quizListUser?.map( 
                (e,index)=><Dropdown.Item key={index} onClick={()=>{ service.setQuizName(e); setShowQuizList(false)}}>{e}</Dropdown.Item>) }
            </Dropdown.Menu>
            </Dropdown>
         </InputGroup>
        </div>
        <PadTop/>
        <Accordion onSelect={(e)=>fetchQuizList(e)}>
        <Accordion.Item eventKey="0">
        <Accordion.Header>Luettelo julkisista visoista</Accordion.Header>
        <Accordion.Body>
         {
            service.quizList?.map((e:any,index)=><Button key={index} variant="Secondary" className="rounded-pill" onClick={ ()=>service.setQuizName(e.name)}>{e.name}</Button>)
         }
        </Accordion.Body>
        </Accordion.Item>
        </Accordion>
            <PadTop/>
            <div style={{display:"flex", width:"100%", justifyContent:"center", flexDirection:"column"}} >
            <div> 
                <Link to={"/"+service.quizName+"/1"} ><Button style={{width:"70%"}} variant="primary">Avaa visa {service.quizName} </Button></Link>
                <Link to={"/"+service.quizName+"/scores"} ><Button style={{width:"30%"}} variant="light">Pistetaulu</Button></Link>
            </div>
            
            { service.logged &&
            <PadTop>
            <Link to={service.quizName+"/edit"}><Button style={{width:"100%"}} variant="light">Muokkaa visaa {service.quizName}</Button></Link> 
            </PadTop>
            }

            { !service.logged &&
                <div>
                <PadTop/>
                <Button style={{width:"50%"}} onClick={ ()=>window.open(apiUrl+'/auth/google','_self')} variant="light"><img src={logoGoogle}/>Kirjaudu Googlella</Button>
                <Button style={{width:"50%"}} onClick={ ()=>window.open(apiUrl+'/auth/facebook','_self')}  variant="light"><img src={logoFacebook}/>Kirjaudu Facebookilla</Button>
                </div>
            }

            { service.logged &&  
              <PadTop><Button style={{width:"100%"}} onClick={()=>service.logOut()} variant="light">Kirjaudu ulos</Button> </PadTop>
            }

            { !service.logged &&
                 <>
                 <hr/>
                 <div style={{display:"flex",justifyContent:"center"}}>Kirjautuneena voit luoda ja muokata omia visoja</div>
                 <hr/>
                 </>
            }
        
    
         </div>
         <div style={{display:"flex",justifyContent:"center"}}>{ service.msg }</div>
         <PadTop/>
        </>
    )
})


export default Main;
