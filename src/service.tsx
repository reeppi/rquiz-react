import { computed } from "mobx"
import {
  model,
  Model,
  modelAction,
  prop,
  modelFlow,
  _async,
  _await,
  getSnapshot
} from "mobx-keystone"
import { cleanData, removeKeystoneIds } from "./helper"
import clone from "just-clone"
import * as Models from "./models"
import Timeout from 'await-timeout';
import {apiUrl, defaultTimeout} from './helper';
import axios from 'axios';

@model("store/RootStore")
export class RootStore extends Model({
  quizName: prop<string>("hopovisa").withSetter(),
  logged: prop<boolean>(false).withSetter(),
  msg: prop<string>("").withSetter(),
  quiz: prop<Models.quizClass | null>(),
  quizList: prop<Models.quizInfo[] | null>(),
  scores: prop<Models.scoresClass|null>().withSetter(),
  quizListUser: prop<string[] | null>().withSetter()
}) {

  @computed
  get getToken() :string {
    return String(window.sessionStorage.getItem("JWT"));
    }  

    @modelAction 
    logOut= () => {
      window.sessionStorage.removeItem("JWT",);
      this.setLogged(false);
    }

    @modelAction
    createEmptyQuiz = () => {
      this.quiz =  new Models.quizClass ( { name : "", title : "", public: false,  questions : [] })
    }

    @modelFlow
    fetchScores = _async( function*(this:RootStore,qName:string) {
      try {
      const res  = yield* _await( Timeout.wrap( axios.get(apiUrl+"/scoreboard?name="+qName),defaultTimeout,"fecthUserQuizList timeout" ) );
      if ( res.data )
      {
        if ( !res.data.error)
        {
          this.setScores(res.data);
          console.log(cleanData(this.scores));
          this.setMsg("");
          return "";
        } else {
          this.setScores(null);
          console.log(res.data);
          this.setMsg(res.data.error);
          return res.data.error;
        }
      }
    } catch (err) {
      this.setMsg((err as Error).message);
      return (err as Error).message;
    }  
    })
    
    @modelFlow 
    renameQuiz = _async ( function*(this:RootStore,fromQuiz:string,toQuiz:string)
    {
      try {
        var config = {
          headers: {'Authorization': this.getToken},
        };
        const res  = yield* _await( Timeout.wrap( axios.get(apiUrl+"/rename?name="+fromQuiz+"&to="+toQuiz,config),defaultTimeout,"deleteQuiz timeout" ) );
        if ( res.data)
        {
          if ( res.data.done )
          {
            this.msg="Visalla uusi nimi "+res.data.done
            return {done:true, error:res.data.error};
          }
          if ( res.data.error)
          {
            this.setMsg(res.data.error);
            return {done:false, error:res.data.error};
          }
        }
        this.setMsg("Tuntematon virhe");
        return {done:false, error:this.msg};
      } catch (err) {
        this.setMsg((err as Error).message);
        return { done:false, error:(err as Error).message };
      }      
    })

    @modelFlow
    deleteQuiz = _async( function*(this:RootStore,qName:string) {
      try {
      var config = {
        headers: {'Authorization': this.getToken},
      };
      const res  = yield* _await( Timeout.wrap( axios.get(apiUrl+"/delete?name="+qName,config),defaultTimeout,"deleteQuiz timeout" ) );
      if ( res.data )
      {
        if (res.data.done)
        {
          this.quiz = null;
          this.setMsg(res.data.done);
          return res.data.done;
        }
        if ( res.data.error)
        {
          this.setMsg(res.data.error);
          return res.data.error;
        } else {
          this.setMsg("Tuntematon virhe");
          return ("Tuntematon virhe");
        }
      }
    } catch (err) {
      this.setMsg((err as Error).message);
      return (err as Error).message;
    }  
    })
  

    @modelFlow
    fetchUserQuizList = _async( function*(this:RootStore) {
      try {
      var config = { 
        headers: {'Authorization': this.getToken},
      };
      const res  = yield* _await( Timeout.wrap( axios.get(apiUrl+"/list",config),defaultTimeout,"fecthUserQuizList timeout" ) );
      if ( res.data )
      {
        if ( !res.data.error)
        {
          this.setQuizListUser(res.data.quiz);
          console.log(cleanData(this.quizListUser));
          return "";
        } else {
          this.setQuizListUser(null);
          console.log(res.data);
          this.setMsg(res.data.error);
          return res.data.error;
        }
      }
    } catch (err) {
      this.setMsg((err as Error).message);
      return (err as Error).message;
    }  
    })
     
    @modelFlow
    uploadImage = _async( function*(this:RootStore,form:FormData,qName:string,qNumber:number, progress: (n: number) => any) {
      try {
      var config = {
        headers: {'Authorization': this.getToken},
        onUploadProgress: function(this:RootStore,progressEvent:any) {
          var percentCompleted = Math.round( (progressEvent.loaded * 100) / progressEvent.total );
          progress(percentCompleted);
        },
      };
      const res  = yield* _await( axios.post(apiUrl+"/upload?name="+qName+"&question="+qNumber,form,config));
      console.log(res.data);
      if ( res.data.done )
        {
          this.quiz?.questions[qNumber].setImage(res.data.done);
          this.quiz?.questions[qNumber].setWidth(res.data.width);
          this.quiz?.questions[qNumber].setHeight(res.data.height);
        }
        this.setMsg(res.data.error);
        return res.data.error;
    } catch (err) {
      this.setMsg((err as Error).message);
      return (err as Error).message;
      
    }  
    })

    @modelFlow
    uploadAudio = _async( function*(this:RootStore,form:FormData,qName:string,qNumber:number,progress: (n: number) => any) {
      try {
      var config = {
        headers: {'Authorization': this.getToken},
        onUploadProgress: function(progressEvent:any) {
          var percentCompleted = Math.round( (progressEvent.loaded * 100) / progressEvent.total );
          console.log(percentCompleted);
          progress(percentCompleted);
        },
      };
      const res  = yield* _await( axios.post(apiUrl+"/uploadaudio?name="+qName+"&question="+qNumber,form,config));
      console.log(res.data);
        if ( res.data.done )
          this.quiz?.questions[qNumber].setAudio(res.data.done);
      this.setMsg(res.data.error);
      return res.data.error;
    } catch (err) {
      this.setMsg((err as Error).message);
      return (err as Error).message;
      
    }  
    })






    replacer (name:any, val:any) 
    {
      if ( name === 'audioEdit' ) { 
          return undefined; 
      } else {
          return val; 
      }
    };
     
    @modelFlow 
    saveQuiz = _async(function* (this:RootStore, qName:string)
    {
     this.setMsg(""); 
    const dataJson = JSON.stringify(cleanData(this.quiz),this.replacer);
    try {
      const response = yield* _await(Timeout.wrap(window.fetch(apiUrl+"/edit?name="+qName,
      { method: 'post', headers: new Headers({'Authorization': this.getToken,'Content-Type': 'application/json'}), body :dataJson }
      ),defaultTimeout,"saveQuiz timeout"));

      if (response.ok) {
        const data  = (yield* _await(response.json())) as any;
        if ( data.hasOwnProperty('error') )
        {
            this.setMsg(data.error);
            return data.error;
        }
      }
    }catch (err) {
      this.setMsg((err as Error).message);
      return (err as Error).message;
    }  

    })

    @modelFlow
    fetchToken = _async(function* (this: RootStore, code:string) {
      console.log("fetch Token");
      try { 
      const response = yield* _await(Timeout.wrap(window.fetch(apiUrl+"/getToken?code="+code),defaultTimeout,"fetchToken timeout"));
      if (response.ok) {
         const data  = (yield* _await(response.json())) as any;
        if ( data.hasOwnProperty('error') ) 
          return data.error;
        if ( data.hasOwnProperty('token') ) 
        {
          console.log("token haettu.");
          window.sessionStorage.setItem("JWT", data.token);
          if ( data.hasOwnProperty('msg') )
          {
            this.setMsg(data.msg);
            return data.msg;
          }
      }
      }
      } catch (err) {
        this.setMsg((err as Error).message);
        return (err as Error).message;
      }  
    })

    @modelFlow
    fetchQuizList = _async(function* (this: RootStore) {
      console.log("fetch quizList");
      try { 
      const response = yield* _await(Timeout.wrap(window.fetch(apiUrl+"/listall"),defaultTimeout,"fetchQuizList timeout"));
      if (response.ok) {
         const data  = (yield* _await(response.json())) as any;
        if ( !data.hasOwnProperty("error"))
            this.quizList = data; 
          else {
            this.quizList = null;
            this.setMsg(data.error);
            return data.error;
          }
      }
      } catch (err) {
        this.setMsg((err as Error).message);
        return (err as Error).message;
      }  
    })
  
    @modelFlow
    fetchQuiz = _async(function* (this: RootStore, quizName: string, edit: boolean) {
      console.log("fetch quiz");
      try { 
      var response;
      if ( !edit)   
        response = yield* _await(Timeout.wrap(window.fetch(apiUrl+"/quiz?name="+quizName),defaultTimeout,"fetchQuiz timeout"));
      else 
        response = yield* _await(Timeout.wrap(window.fetch(apiUrl+"/quiza?name="+quizName,{ headers: new Headers({'Authorization': this.getToken})} ),defaultTimeout,"fetchQuiz timeout"));

      if (response.ok) {
         const data  = (yield* _await(response.json())) as any;
        if ( !data.hasOwnProperty("error"))
          {
            this.quiz =  new Models.quizClass ( { name : data.name, public: data.public, title : data.title,questions : data.questions.map( (e:any)=> new Models.questionClass(e)) })
            this.setMsg("");
            return {error:"",deny:false,dialog:false};
          }  
          else {
            this.quiz = null;
            this.setMsg(data.error);
            return { error: data.error, dialog: data.dialog, deny: data.deny };
          }
      } 
        else {
          this.setMsg("response not ok");
          return {error:"response not ok",deny:false,dialog:false};
        }
      } catch (err) {
        this.setMsg((err as Error).message);
        return {error: (err as Error).message,deny:false,dialog:false };
      }
      
    })
  }

const service = createService();
export default service;

function createService(): RootStore {
  console.log("createRootStore");
  const rootStore = new RootStore({
    quiz: null,
    quizList: null,
    quizListUser: null, 
    scores: null
  })
return rootStore
}
