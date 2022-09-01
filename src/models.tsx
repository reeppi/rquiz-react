import {
    model,
    Model,
    prop,
    modelAction,
    modelFlow,
  } from "mobx-keystone"


  @model("quiz/scoresClass")
  export class scoresClass extends Model({
    name: prop<string>().withSetter(),
    scores: prop<{name:string,score:string}[]>()
  }) { }

  @model("quiz/audioEditClass")
  export class audioEditClass extends Model({
    url: prop<string>().withSetter(),
    blob: prop<any>(),
  }) { }

  @model("quiz/quizClass")
  export class quizClass extends Model({
    name: prop<string>().withSetter(),
    title: prop<string>().withSetter(),
    questions: prop<questionClass[]>(),
    public: prop<boolean>(false).withSetter()
  }) { 
  
    @modelAction
    reOrder(to:number,src:number)
    {
      if ( !this.questions) return;
      const items = Array.from(this.questions);
      const iv = items[src];
      items.splice(src, 1);
      items.splice(to, 0, iv);
     // const [reorderedItem] = items.splice(src, 1);
     // items.splice(to, 0, reorderedItem);
      this.questions=items;
    }
  
    @modelAction 
    deleteQuestion(index:number) {
      this.questions.splice(index,1);
    }

    @modelAction
    addQuestion()
    {
      var newQ = new questionClass({text:"",options:[],audioEdit:null}); 
      if (this.questions == null ) this.questions = [];
      this.questions.push(newQ);
    }
    
  }
  
  @model("quiz/questionClass")
  export class questionClass extends Model({
    text: prop<string>().withSetter(),
    image: prop<string>("").withSetter(),
    audio: prop<string>("").withSetter(),
    width: prop<number>(0).withSetter(),
    height: prop<number>(0).withSetter(),
    true: prop<number>(0).withSetter(),
    audioEdit: prop<audioEditClass|null>(),
    answer: prop<number|null>(null).withSetter(),
    options: prop<string[]>()
  }) {
    @modelAction 
    setOption(index:number,text:string) {
      this.options[index] = text;
    }

    @modelAction
    deleteOption(index:number) {
      this.options.splice(index,1);
    }
    @modelAction
    setAudioEdit(audioEdit:audioEditClass|null )
    {
      this.audioEdit=audioEdit;
    }
  
    @modelAction 
    addOption() {
      this.options.push("");
    }
    
   }

   export type quizInfo = {
    name: string;
    title: string;
    cat: string;
  } 
  