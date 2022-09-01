
import clone from 'just-clone';
import { getSnapshot } from 'mobx-keystone';

const removeKeystoneIds = (obj: any) => {
    for (var propertyName in obj) {
      if (propertyName == '$modelId' || propertyName == '$modelType') {
        delete obj[propertyName]
      }
      if (Array.isArray(obj[propertyName])) {
        obj[propertyName] = obj[propertyName].map(removeKeystoneIds)
      }
      if (obj[propertyName] !== null && typeof obj[propertyName] === 'object') {
        obj[propertyName] = removeKeystoneIds(obj[propertyName])
      }
    }
    return obj
  }

const cleanData = (obj: any) =>
{
  return removeKeystoneIds(clone(getSnapshot(obj)))   
}



const getApiUrl = () => {
  console.log("apiurl");
  if (  window.location.hostname == "tietovisa.netlify.app" ) 
    return "https://reeppi-quiz.netlify.app";
  else 
    return "https://localhost:8888";
}

const PadTop = ( {children } : { children?:any } ) => <div style={{paddingTop:"4px"}}>{children}</div>


const fileUrl: string="https://eu2.contabostorage.com/cab6b4ec7ee045779d63f412f885dfe6:tietovisa";
const apiUrl = getApiUrl();
const defaultTimeout : number=9000;

export { removeKeystoneIds, cleanData, PadTop, fileUrl, apiUrl, defaultTimeout}