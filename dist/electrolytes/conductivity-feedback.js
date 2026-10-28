// Keep the numerical teaching model internal; students see qualitative observations.
export function conductivityLabel(result,powered=true){
 if(!powered)return '尚未檢測';
 return result.score<=0?'不能導電':result.score<.1?'導電極微弱':'能導電';
}
export function qualitativeRecord(record){
 return {...record,text:record.text.replace(/導電分數\s+([\d.]+)(?:\s*\/\s*100)?/g,(_,score)=>conductivityLabel({score:Number(score)}))};
}
